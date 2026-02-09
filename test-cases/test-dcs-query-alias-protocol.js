/**
 * Автотест протоколирования алиасов в запросах DCS (эмуляция UI-редактирования запроса).
 *
 * Что делает:
 * - Находит DCS Template.xml в отчётах
 * - Извлекает dataSet.query
 * - Для каждого query делает последовательность "редактирований" текста (rename алиаса и рассинхронизация)
 * - На каждом шаге строит карту алиасов (только объявленные через КАК/AS) и протоколирует
 *
 * Запуск:
 *   node test-cases/test-dcs-query-alias-protocol.js --reportsDir "D:\\1C\\RZDZUP\\src\\cf\\Reports" --limit 5
 */

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  allowBooleanAttributes: true,
  parseAttributeValue: false,
  trimValues: false,
  parseTrueNumberOnly: false,
  preserveOrder: false,
  commentPropName: '#comment',
});

function parseArgs(argv) {
  const out = { reportsDir: 'D:\\1C\\RZDZUP\\src\\cf\\Reports', limit: 5, outFile: '' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--reportsDir') out.reportsDir = String(argv[++i] || '');
    else if (a === '--limit') out.limit = Number(argv[++i] || '5');
    else if (a === '--out') out.outFile = String(argv[++i] || '');
  }
  if (!out.reportsDir) throw new Error('reportsDir is required');
  if (!Number.isFinite(out.limit) || out.limit <= 0) out.limit = 5;
  return out;
}

function walkDir(dir, fileName, limit = 1000) {
  const out = [];
  const stack = [dir];
  while (stack.length && out.length < limit) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && e.name === fileName) out.push(p);
      if (out.length >= limit) break;
    }
  }
  return out;
}

function looksLikeDcsTemplate(xmlText) {
  const s = String(xmlText || '');
  return s.includes('<DataCompositionSchema') && s.includes('<dataSet');
}

function findDcsTemplateForReport(reportDir) {
  const preferred = path.join(reportDir, 'Templates', 'ОсновнаяСхемаКомпоновкиДанных', 'Ext', 'Template.xml');
  if (fs.existsSync(preferred)) return preferred;

  // fallback: любая Template.xml под Templates
  const templatesDir = path.join(reportDir, 'Templates');
  if (!fs.existsSync(templatesDir)) return '';

  const candidates = walkDir(templatesDir, 'Template.xml', 50);
  for (const f of candidates) {
    try {
      const xml = fs.readFileSync(f, 'utf8');
      if (looksLikeDcsTemplate(xml)) return f;
    } catch {
      // ignore
    }
  }
  return '';
}

function extractDataSetQueriesFromTemplate(xmlText) {
  const parsed = parser.parse(String(xmlText || ''));
  const ds = parsed?.DataCompositionSchema?.dataSet;
  if (!ds) return [];
  const list = Array.isArray(ds) ? ds : [ds];

  const out = [];
  for (const node of list) {
    const q = node?.query;
    if (!q) continue;
    const name = node?.name ? String(node.name) : 'dataSet';
    out.push({ name, query: String(q) });
  }
  return out;
}

function tokenizeQuery(src) {
  const s = String(src || '');
  const out = [];
  let i = 0;
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  const push = (type, raw) => {
    const upper = type === 'ident' ? raw.toUpperCase() : raw;
    out.push({ type, raw, upper });
  };

  while (i < s.length) {
    const ch = s[i];
    const next = s[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      i++;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (inString) {
      if (ch === '"' && next === '"') {
        i += 2;
        continue;
      }
      if (ch === '"') {
        inString = false;
        i++;
        continue;
      }
      i++;
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (ch === '"') {
      inString = true;
      i++;
      continue;
    }

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // ident (кириллица/латиница/цифры/_)
    if (/[A-Za-zА-Яа-я_]/.test(ch)) {
      let j = i + 1;
      while (j < s.length && /[0-9A-Za-zА-Яа-я_]/.test(s[j])) j++;
      push('ident', s.slice(i, j));
      i = j;
      continue;
    }

    // символ
    push('sym', ch);
    i++;
  }

  return out;
}

function normAlias(s) {
  return String(s || '').toLowerCase();
}

function readDottedIdent(tokens, startIdx) {
  let i = startIdx;
  let parts = [];
  if (!tokens[i] || tokens[i].type !== 'ident') return { value: '', nextIdx: startIdx };
  parts.push(tokens[i].raw);
  i++;
  while (tokens[i] && tokens[i].raw === '.' && tokens[i + 1] && tokens[i + 1].type === 'ident') {
    parts.push(tokens[i + 1].raw);
    i += 2;
  }
  return { value: parts.join('.'), nextIdx: i };
}

function readVirtualTail(tokens, startIdx) {
  // ожидаем: . Ident ( ...balanced... )
  let i = startIdx;
  if (!(tokens[i] && tokens[i].raw === '.' && tokens[i + 1]?.type === 'ident' && tokens[i + 2]?.raw === '(')) {
    return { tail: '', nextIdx: startIdx };
  }

  const method = tokens[i + 1].raw;
  i = i + 2; // на '('

  let depth = 0;
  let buf = `.${method}`;
  while (tokens[i]) {
    const t = tokens[i].raw;
    buf += t;
    if (t === '(') depth++;
    else if (t === ')') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
    i++;
  }

  return { tail: buf, nextIdx: i };
}

function parseAliasMap(queryText) {
  const tokens = tokenizeQuery(queryText);
  const aliasMap = new Map();

  const isFromJoin = (u) => ['ИЗ', 'FROM', 'JOIN', 'СОЕДИНЕНИЕ'].includes(u);
  const isAs = (u) => ['КАК', 'AS'].includes(u);

  for (let i = 0; i < tokens.length; i++) {
    if (!isFromJoin(tokens[i].upper)) continue;

    const t1 = tokens[i + 1];
    if (!t1) continue;

    // таблица / выражение
    const { value: base, nextIdx } = readDottedIdent(tokens, i + 1);
    if (!base) continue;

    let expr = base;
    const vt = readVirtualTail(tokens, nextIdx);
    if (vt.tail) expr = expr + vt.tail;

    // алиас только через КАК/AS
    const tAs = tokens[vt.tail ? vt.nextIdx : nextIdx];
    const tAlias = tokens[(vt.tail ? vt.nextIdx : nextIdx) + 1];

    if (tAs && isAs(tAs.upper) && tAlias?.type === 'ident') {
      aliasMap.set(normAlias(tAlias.raw), expr);
    }

    i = Math.max(i, (vt.tail ? vt.nextIdx : nextIdx) - 1);
  }

  return aliasMap;
}

function collectAliasUsages(queryText, aliasNames) {
  const s = String(queryText || '');
  const out = {};
  for (const a of aliasNames) {
    const re = new RegExp(String.raw`(^|[^0-9A-Za-zА-Яа-я_])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\.`,'gi');
    const m = s.match(re);
    out[a] = m ? m.length : 0;
  }
  return out;
}

function replaceAliasEverywhere(queryText, fromAlias, toAlias) {
  const s = String(queryText || '');
  const from = String(fromAlias || '');
  const to = String(toAlias || '');
  if (!from || !to) return s;

  const esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const identChar = '0-9A-Za-zА-Яа-я_';

  // 1) меняем объявление алиаса после КАК (без \b, т.к. \b плохо работает с кириллицей)
  const reDecl = new RegExp(String.raw`(^|[^${identChar}])(КАК\s+)${esc(from)}(?![${identChar}])`, 'gi');
  let next = s.replace(reDecl, `$1$2${to}`);

  // 2) меняем использования alias.
  const reUse = new RegExp(String.raw`(^|[^${identChar}])${esc(from)}\.`, 'gi');
  next = next.replace(reUse, `$1${to}.`);

  return next;
}

function replaceAliasDeclarationOnly(queryText, fromAlias, toAlias) {
  const s = String(queryText || '');
  const from = String(fromAlias || '');
  const to = String(toAlias || '');
  if (!from || !to) return s;

  const esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const identChar = '0-9A-Za-zА-Яа-я_';

  const reDecl = new RegExp(String.raw`(^|[^${identChar}])(КАК\s+)${esc(from)}(?![${identChar}])`, 'gi');
  return s.replace(reDecl, `$1$2${to}`);
}

function runEditorSimulation({ reportName, templatePath, dataSetName, query }) {
  const protocol = [];
  const step = (name, q) => {
    const aliasMap = parseAliasMap(q);
    const aliasList = Array.from(aliasMap.keys());
    const usages = collectAliasUsages(q, aliasList);

    const item = {
      step: name,
      aliasCount: aliasList.length,
      aliasMap: Object.fromEntries(Array.from(aliasMap.entries())),
      usages,
    };
    protocol.push(item);

    console.log(`  - [${name}] aliases=${item.aliasCount}`);
    const show = aliasList.slice(0, 20);
    if (show.length) {
      console.log(`    aliasMap(sample):`, show.map((a) => `${a} -> ${item.aliasMap[a]}`).join(' | '));
      console.log(`    usages(sample):`, show.map((a) => `${a}. = ${item.usages[a]}`).join(' | '));
    }

    return { aliasMap, aliasList };
  };

  console.log(`\n=== ${reportName} ===`);
  console.log(`Template: ${templatePath}`);
  console.log(`DataSet: ${dataSetName}`);

  let cur = String(query || '');

  // STEP 0 baseline
  const base = step('open_editor', cur);

  // STEP 1 rename алиас (если есть)
  if (base.aliasList.length) {
    const a0 = base.aliasList[0];
    const nextAlias = `${a0}_t`;
    cur = replaceAliasEverywhere(cur, a0, nextAlias);
    step('edit_rename_alias', cur);

    // STEP 2 рассинхронизируем: меняем объявление, но не меняем использования
    const brokenAlias = `${nextAlias}_broken`;
    cur = replaceAliasDeclarationOnly(cur, nextAlias, brokenAlias);
    step('edit_break_alias', cur);
  } else {
    step('edit_no_aliases_found', cur);
  }

  return {
    reportName,
    templatePath,
    dataSetName,
    protocol,
  };
}

function main() {
  const args = parseArgs(process.argv);

  if (!fs.existsSync(args.reportsDir)) {
    console.error(`❌ reportsDir not found: ${args.reportsDir}`);
    process.exit(1);
  }

  const reportDirs = fs
    .readdirSync(args.reportsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const picked = [];
  for (const name of reportDirs) {
    if (picked.length >= args.limit) break;
    const reportPath = path.join(args.reportsDir, name);
    const tpl = findDcsTemplateForReport(reportPath);
    if (!tpl) continue;
    picked.push({ name, reportPath, templatePath: tpl });
  }

  if (picked.length === 0) {
    console.error('❌ No reports with DCS Template.xml found');
    process.exit(1);
  }

  console.log(`Reports dir: ${args.reportsDir}`);
  console.log(`Selected reports: ${picked.length}`);

  const results = [];
  let totalDataSets = 0;

  for (const r of picked) {
    let xml = '';
    try {
      xml = fs.readFileSync(r.templatePath, 'utf8');
    } catch (e) {
      console.log(`\n=== ${r.name} ===`);
      console.log(`  ❌ Cannot read template: ${String(e.message || e)}`);
      continue;
    }

    const dataSets = extractDataSetQueriesFromTemplate(xml);
    if (!dataSets.length) {
      console.log(`\n=== ${r.name} ===`);
      console.log(`Template: ${r.templatePath}`);
      console.log('  ⚠️ No dataSet.query found');
      continue;
    }

    for (const ds of dataSets) {
      totalDataSets++;
      results.push(
        runEditorSimulation({
          reportName: r.name,
          templatePath: r.templatePath,
          dataSetName: ds.name,
          query: ds.query,
        })
      );
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Reports processed: ${picked.length}`);
  console.log(`DataSets processed: ${totalDataSets}`);

  if (args.outFile) {
    try {
      fs.writeFileSync(args.outFile, JSON.stringify({ args, results }, null, 2), 'utf8');
      console.log(`Protocol written: ${args.outFile}`);
    } catch (e) {
      console.log(`⚠️ Cannot write outFile: ${String(e.message || e)}`);
    }
  }
}

if (require.main === module) {
  main();
}
