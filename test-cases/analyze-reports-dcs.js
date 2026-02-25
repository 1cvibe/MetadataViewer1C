/**
 * Анализ 10 отчётов (Reports) для подготовки «Редактор СКД».
 *
 * Источник: D:\1C\RZDZUP\src\cf\Reports
 * Для каждого отчёта:
 * - читаем <Properties><MainDataCompositionSchema>
 * - вычисляем имя шаблона (Template.<name>)
 * - читаем Template.xml: Reports/<ReportName>/Templates/<TemplateName>/Ext/Template.xml
 * - собираем статистику по структуре DataCompositionSchema
 *
 * Запуск:
 *   node src/scripts/analyze-reports-dcs.js D:\\1C\\RZDZUP\\src\\cf
 */

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function createParser() {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: false,
    preserveOrder: false,
    trimValues: true,
    parseTagValue: false,
    parseAttributeValue: false,
  });
}

function extractMainDcsRef(reportXml) {
  const p = createParser();
  const j = p.parse(reportXml);
  const props = j?.MetaDataObject?.Report?.Properties;
  return props?.MainDataCompositionSchema || '';
}

function extractReportName(reportXml) {
  const p = createParser();
  const j = p.parse(reportXml);
  return j?.MetaDataObject?.Report?.Properties?.Name || '';
}

function parseTemplateNameFromMainRef(mainRef) {
  // Пример: Report.ibs_XXX.Template.MyTemplateName
  const s = String(mainRef || '').trim();
  const idx = s.lastIndexOf('.Template.');
  if (idx >= 0) return s.slice(idx + '.Template.'.length);
  // fallback: иногда без Report.<name>
  const idx2 = s.indexOf('Template.');
  if (idx2 >= 0) return s.slice(idx2 + 'Template.'.length);
  return '';
}

function resolveTemplateXmlPath(sourceRoot, reportName, templateName) {
  if (!sourceRoot || !reportName || !templateName) return null;
  const reportDir = path.join(sourceRoot, 'Reports', reportName);
  const candidate1 = path.join(reportDir, 'Templates', templateName, 'Ext', 'Template.xml');
  if (fs.existsSync(candidate1)) return candidate1;
  const candidate2 = path.join(reportDir, 'Templates', `${templateName}.xml`);
  if (fs.existsSync(candidate2)) return candidate2;
  // fallback: поиск по подкаталогу Templates
  const templatesDir = path.join(reportDir, 'Templates');
  if (fs.existsSync(templatesDir)) {
    const found = findFirstFileByName(templatesDir, 'Template.xml');
    if (found) return found;
  }
  return null;
}

function findFirstFileByName(rootDir, fileName) {
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && e.name === fileName) return full;
    }
  }
  return null;
}

function analyzeDcsTemplate(templateXml) {
  const p = createParser();
  const j = p.parse(templateXml);
  const root = j?.DataCompositionSchema || null;
  if (!root) return { ok: false, reason: 'No DataCompositionSchema root' };

  const tagCounts = new Map();
  const keyCounts = new Map();
  let maxDepth = 0;
  let totalNodes = 0;

  const walk = (node, depth) => {
    if (!node || typeof node !== 'object') return;
    maxDepth = Math.max(maxDepth, depth);
    totalNodes += 1;

    for (const k of Object.keys(node)) {
      if (k.startsWith('@_')) continue;
      keyCounts.set(k, (keyCounts.get(k) || 0) + 1);
      const v = node[k];
      if (Array.isArray(v)) {
        tagCounts.set(k, (tagCounts.get(k) || 0) + v.length);
        for (const it of v) walk(it, depth + 1);
      } else if (v && typeof v === 'object') {
        tagCounts.set(k, (tagCounts.get(k) || 0) + 1);
        walk(v, depth + 1);
      }
    }
  };

  walk(root, 0);

  const toTop = (m, topN) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([key, count]) => ({ key, count }));

  return {
    ok: true,
    totalNodes,
    maxDepth,
    tagsTop: toTop(tagCounts, 20),
    keysTop: toTop(keyCounts, 30),
  };
}

function main() {
  const sourceRoot = process.argv[2] || 'D:\\\\1C\\\\RZDZUP\\\\src\\\\cf';
  const reportsRoot = path.join(sourceRoot, 'Reports');
  const outDir = path.join(process.cwd(), 'reports', 'dcs-editor');
  ensureDir(outDir);

  const reportFiles = fs
    .readdirSync(reportsRoot, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.xml'))
    .map((e) => path.join(reportsRoot, e.name))
    .sort((a, b) => a.localeCompare(b));

  const sample = reportFiles.slice(0, 10);
  const perFile = [];

  for (const filePath of sample) {
    const reportXml = safeRead(filePath);
    if (!reportXml) continue;
    const reportName = extractReportName(reportXml) || path.basename(filePath, path.extname(filePath));
    const mainRef = extractMainDcsRef(reportXml);
    const templateName = parseTemplateNameFromMainRef(mainRef);
    const templatePath = resolveTemplateXmlPath(sourceRoot, reportName, templateName);
    const templateXml = templatePath ? safeRead(templatePath) : null;
    const analysis = templateXml ? analyzeDcsTemplate(templateXml) : { ok: false, reason: 'Template not found or unreadable' };

    perFile.push({
      reportFile: filePath,
      reportName,
      mainRef,
      templateName,
      templatePath,
      analysis,
    });
  }

  const summary = {
    sourceRoot,
    reportsRoot,
    filesInReportsRoot: reportFiles.length,
    sampleCount: sample.length,
    okCount: perFile.filter((x) => x.analysis?.ok).length,
    failedCount: perFile.filter((x) => !x.analysis?.ok).length,
  };

  const jsonOut = {
    summary,
    sample,
    perFile,
  };

  const jsonPath = path.join(outDir, 'reports-sample-10.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOut, null, 2), 'utf8');

  const mdLines = [];
  mdLines.push(`# DCS reports sample (10)`);
  mdLines.push(``);
  mdLines.push(`- Source root: \`${sourceRoot}\``);
  mdLines.push(`- Reports root: \`${reportsRoot}\``);
  mdLines.push(`- Total report XML in root: ${reportFiles.length}`);
  mdLines.push(`- Sample size: ${sample.length}`);
  mdLines.push(`- OK: ${summary.okCount}, Failed: ${summary.failedCount}`);
  mdLines.push(``);

  for (const f of perFile) {
    mdLines.push(`## ${f.reportName}`);
    mdLines.push(`- Report file: \`${f.reportFile}\``);
    mdLines.push(`- MainDataCompositionSchema: \`${String(f.mainRef || '')}\``);
    mdLines.push(`- Template name: \`${String(f.templateName || '')}\``);
    mdLines.push(`- Template path: \`${String(f.templatePath || '')}\``);
    if (!f.analysis?.ok) {
      mdLines.push(`- Analysis: FAILED (${f.analysis?.reason || 'unknown'})`);
      mdLines.push(``);
      continue;
    }
    mdLines.push(`- Total nodes: ${f.analysis.totalNodes}`);
    mdLines.push(`- Max depth: ${f.analysis.maxDepth}`);
    mdLines.push(`- Top tags:`);
    for (const t of f.analysis.tagsTop || []) mdLines.push(`  - ${t.key}: ${t.count}`);
    mdLines.push(`- Top keys:`);
    for (const k of f.analysis.keysTop || []) mdLines.push(`  - ${k.key}: ${k.count}`);
    mdLines.push(``);
  }

  const mdPath = path.join(outDir, 'reports-sample-10.md');
  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote: ${jsonPath}`);
  // eslint-disable-next-line no-console
  console.log(`Wrote: ${mdPath}`);
}

main();


