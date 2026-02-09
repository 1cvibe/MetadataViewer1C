/**
 * Скрипт анализа форм документов (RZDZUP) для подготовки EDT-подобного preview.
 *
 * Цель:
 * - взять первые 10 Form.xml форм документов из D:\\1C\\RZDZUP\\src\\cf
 * - прогнать через parseFormXmlFull()
 * - собрать статистику по ChildItems: типы элементов, ключи properties, глубина, крайние случаи
 * - сохранить отчёт в workspace (reports/form-preview/)
 *
 * Запуск:
 * 1) npm run compile
 * 2) node scripts/analyze-doc-forms.js
 */

const path = require('path');
const fs = require('fs');
const fg = require('fast-glob');

/**
 * Безопасно создаёт директорию (рекурсивно).
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Обходит дерево FormItem[] и собирает статистику.
 * @param {Array<any>} items
 * @returns {{
 *   totalItems: number,
 *   maxDepth: number,
 *   typeCounts: Record<string, number>,
 *   propertyKeyCounts: Record<string, number>,
 *   anomalies: Array<{ kind: string; details: any }>
 * }}
 */
function analyzeChildItems(items) {
  /** @type {Record<string, number>} */
  const typeCounts = Object.create(null);
  /** @type {Record<string, number>} */
  const propertyKeyCounts = Object.create(null);
  /** @type {Array<{ kind: string; details: any }>} */
  const anomalies = [];

  let totalItems = 0;
  let maxDepth = 0;

  /**
   * @param {any} node
   * @param {number} depth
   */
  function walk(node, depth) {
    totalItems += 1;
    if (depth > maxDepth) maxDepth = depth;

    const type = typeof node?.type === 'string' && node.type.length ? node.type : 'Unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    const props = node?.properties;
    if (!props || typeof props !== 'object') {
      anomalies.push({ kind: 'missing_properties', details: { type, name: node?.name, id: node?.id } });
    } else {
      for (const k of Object.keys(props)) {
        propertyKeyCounts[k] = (propertyKeyCounts[k] || 0) + 1;
      }
    }

    if (!node?.name && !node?.id) {
      anomalies.push({ kind: 'missing_name_and_id', details: { type, propertiesKeys: props ? Object.keys(props).slice(0, 10) : [] } });
    }

    if (type === 'Unknown') {
      anomalies.push({ kind: 'unknown_type', details: { name: node?.name, id: node?.id } });
    }

    const children = node?.childItems;
    if (children && Array.isArray(children)) {
      for (const child of children) {
        walk(child, depth + 1);
      }
    }
  }

  if (Array.isArray(items)) {
    for (const item of items) {
      walk(item, 1);
    }
  }

  return { totalItems, maxDepth, typeCounts, propertyKeyCounts, anomalies };
}

/**
 * Сортирует объект-частоты по убыванию.
 * @param {Record<string, number>} counts
 */
function sortCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ key, count }));
}

async function main() {
  const root = 'D:\\1C\\RZDZUP\\src\\cf';
  const pattern = 'Documents/**/Forms/**/Ext/Form.xml';

  const reportDir = path.resolve(process.cwd(), 'reports', 'form-preview');
  ensureDir(reportDir);

  // parseFormXmlFull лежит в src, но запускать будем из скомпилированного out
  /** @type {{ parseFormXmlFull: (xmlPath: string) => Promise<any> }} */
  const { parseFormXmlFull } = require(path.resolve(process.cwd(), 'out', 'xmlParsers', 'formParser.js'));

  const matches = await fg(pattern, {
    cwd: root,
    onlyFiles: true,
    absolute: true,
    dot: false,
    followSymbolicLinks: false,
  });

  const sorted = matches.slice().sort((a, b) => String(a).localeCompare(String(b)));
  const sample = sorted.slice(0, 10);

  if (sample.length === 0) {
    throw new Error(`Не найдено файлов по шаблону: ${path.join(root, pattern)}`);
  }

  /** @type {Array<any>} */
  const perFile = [];

  /** @type {Record<string, number>} */
  const allTypeCounts = Object.create(null);
  /** @type {Record<string, number>} */
  const allPropertyKeyCounts = Object.create(null);

  let globalMaxDepth = 0;
  let globalTotalItems = 0;

  for (const filePath of sample) {
    try {
      const parsed = await parseFormXmlFull(filePath);
      const childItems = Array.isArray(parsed?.childItems) ? parsed.childItems : [];

      const stats = analyzeChildItems(childItems);

      globalTotalItems += stats.totalItems;
      if (stats.maxDepth > globalMaxDepth) globalMaxDepth = stats.maxDepth;

      for (const [t, c] of Object.entries(stats.typeCounts)) {
        allTypeCounts[t] = (allTypeCounts[t] || 0) + c;
      }
      for (const [k, c] of Object.entries(stats.propertyKeyCounts)) {
        allPropertyKeyCounts[k] = (allPropertyKeyCounts[k] || 0) + c;
      }

      perFile.push({
        filePath,
        formName: parsed?.name,
        formType: parsed?.formType,
        totalItems: stats.totalItems,
        maxDepth: stats.maxDepth,
        typesTop: sortCounts(stats.typeCounts).slice(0, 20),
        propertyKeysTop: sortCounts(stats.propertyKeyCounts).slice(0, 30),
        anomaliesTop: stats.anomalies.slice(0, 30),
      });
    } catch (e) {
      perFile.push({
        filePath,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const report = {
    sourceRoot: root,
    globPattern: pattern,
    sampleStrategy: 'lexicographic_full_path_first_10',
    sample,
    summary: {
      filesAnalyzed: perFile.length,
      globalTotalItems,
      globalMaxDepth,
      typesTop: sortCounts(allTypeCounts).slice(0, 50),
      propertyKeysTop: sortCounts(allPropertyKeyCounts).slice(0, 80),
    },
    perFile,
  };

  const jsonPath = path.join(reportDir, 'doc-forms-sample-10.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const mdPath = path.join(reportDir, 'doc-forms-sample-10.md');
  const md = [
    '# Анализ 10 форм документов (RZDZUP)',
    '',
    `Источник: \`${root}\``,
    `Шаблон: \`${pattern}\``,
    `Стратегия выборки: \`${report.sampleStrategy}\``,
    '',
    `Файлов: **${report.summary.filesAnalyzed}**`,
    `Всего элементов (суммарно): **${report.summary.globalTotalItems}**`,
    `Макс. глубина: **${report.summary.globalMaxDepth}**`,
    '',
    '## Топ типов элементов',
    ...report.summary.typesTop.slice(0, 20).map(r => `- ${r.key}: ${r.count}`),
    '',
    '## Топ ключей properties',
    ...report.summary.propertyKeysTop.slice(0, 30).map(r => `- ${r.key}: ${r.count}`),
    '',
    '## Выборка (10 файлов)',
    ...report.sample.map(p => `- ${p}`),
    '',
    'Подробности: см. JSON отчёт рядом.',
    '',
  ].join('\n');

  fs.writeFileSync(mdPath, md, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`OK: отчёт сохранён в ${reportDir}`);
  // eslint-disable-next-line no-console
  console.log(`- ${mdPath}`);
  // eslint-disable-next-line no-console
  console.log(`- ${jsonPath}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
