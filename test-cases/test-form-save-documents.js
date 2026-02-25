/*
 * Автотест: сохранение XML форм документов через prod-пайплайн (xmldom + normalize + validate).
 *
 * Запуск:
 *   node test-cases/test-form-save-documents.js "D:/1C/RZDZUP/src/cf" 10
 */

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const { parseFormXmlFull } = require('../out/xmlParsers/formParser');
const { applyFormChangesToXmlStringWithDom } = require('../out/utils/xmlDomUtils');
const { normalizeXML, validateXML } = require('../out/utils/xmlUtils');
const { compareXmlFiles, analyzeDifferences } = require('./xml-structure-comparison');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function safeFileName(s) {
  return String(s || '').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').slice(0, 180);
}

function readUtf8(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeUtf8(p, text) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, text, 'utf8');
}

function findAllFormXmlPathsForDocument(configRoot, docName) {
  const docDir = path.join(configRoot, 'Documents', docName);
  const formsDir = path.join(docDir, 'Forms');
  if (!fs.existsSync(formsDir)) return [];

  const formDirs = fs.readdirSync(formsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const out = [];
  for (const fd of formDirs) {
    const formXml = path.join(formsDir, fd, 'Ext', 'Form.xml');
    if (fs.existsSync(formXml)) out.push({ formName: fd, formPath: formXml });
  }
  return out;
}

function pickSafeStringKey(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const priority = ['Presentation', 'Caption', 'Comment', 'Title'];

  const isForbiddenKey = (k) => (
    k === 'name' ||
    k === 'id' ||
    k === '@' ||
    k === 'Title' ||
    k === 'ExtendedTooltip' ||
    k === 'ContextMenu' ||
    k === 'Events' ||
    k === 'ChildItems'
  );

  for (const k of priority) {
    if (isForbiddenKey(k)) continue;
    if (typeof obj[k] === 'string') return k;
  }

  for (const k of Object.keys(obj)) {
    if (isForbiddenKey(k)) continue;
    if (typeof obj[k] === 'string') return k;
    if (typeof obj[k] === 'number') return k;
    if (typeof obj[k] === 'boolean') return k;
  }

  return null;
}

function findFirstFormItemWithStringProp(items) {
  const stack = Array.isArray(items) ? [...items] : [];
  while (stack.length) {
    const it = stack.shift();
    if (!it || typeof it !== 'object') continue;
    const key = pickSafeStringKey(it.properties);
    if (key) return { item: it, key };
    const kids = Array.isArray(it.childItems) ? it.childItems : [];
    for (const k of kids) stack.push(k);
  }
  return null;
}

function applySafeChange(form) {
  const marker = `__MDV_TEST_${Date.now()}__`;

  const whereKinds = [];

  // Имена для теста
  const attrKeep1 = `MDV_TestAttr_${Date.now()}_K1`;
  const attrKeep2 = `MDV_TestAttr_${Date.now()}_K2`;
  const attrDel = `MDV_TestAttr_${Date.now()}_DEL`;

  const cmdKeep1 = `MDV_TestCmd_${Date.now()}_K1`;
  const cmdKeep2 = `MDV_TestCmd_${Date.now()}_K2`;
  const cmdDel = `MDV_TestCmd_${Date.now()}_DEL`;

  // Шаг 1: добавление (в XML появятся keep + del)
  const addForm = JSON.parse(JSON.stringify(form));

  if (Array.isArray(addForm.attributes)) {
    addForm.attributes.push({ name: attrKeep1, type: 'String', typeDisplay: 'String', properties: {} });
    addForm.attributes.push({ name: attrKeep2, type: 'String', typeDisplay: 'String', properties: {} });
    addForm.attributes.push({ name: attrDel, type: 'String', typeDisplay: 'String', properties: {} });
    whereKinds.push('form.Attributes.add');
  }

  if (Array.isArray(addForm.commands)) {
    addForm.commands.push({ name: cmdKeep1, properties: {} });
    addForm.commands.push({ name: cmdKeep2, properties: {} });
    addForm.commands.push({ name: cmdDel, properties: {} });
    whereKinds.push('form.Commands.add');
  }

  // Маркер: меняем свойство элемента формы (или форму), чтобы гарантировать текстовый diff
  const found = findFirstFormItemWithStringProp(addForm.childItems);
  if (found) {
    const prevRaw = found.item.properties[found.key];
    const prev = typeof prevRaw === 'string' ? prevRaw : String(prevRaw);
    found.item.properties[found.key] = prev + ' ' + marker;
    whereKinds.push(`item.properties.${found.key}`);
  } else {
    const key = pickSafeStringKey(addForm.properties);
    if (key && typeof addForm.properties[key] === 'string') {
      addForm.properties[key] = addForm.properties[key] + ' ' + marker;
      whereKinds.push(`form.properties.${key}`);
    } else {
      const firstItem = Array.isArray(addForm.childItems) ? addForm.childItems[0] : null;
      if (firstItem && firstItem.properties && firstItem.properties.Title && typeof firstItem.properties.Title === 'object') {
        const title = firstItem.properties.Title;
        const arr = title.item || title['v8:item'];
        if (Array.isArray(arr)) {
          const idx = arr.findIndex((x) => x && typeof x === 'object' && ('content' in x || 'v8:content' in x));
          if (idx >= 0) {
            const cur = arr[idx].content ?? arr[idx]['v8:content'] ?? '';
            arr[idx].content = String(cur) + ' ' + marker;
          } else {
            arr.push({ content: marker });
          }
          whereKinds.push('childItems[0].Title');
        }
      }
    }
  }

  const hasMarker = JSON.stringify(addForm).includes(marker);
  if (!hasMarker) {
    return { changed: false, marker, reason: 'Не удалось вставить marker в свойства формы/элементов' };
  }

  // Шаг 2: удаление (берём addForm как базу модели и убираем DEL)
  const delForm = JSON.parse(JSON.stringify(addForm));
  if (Array.isArray(delForm.attributes)) {
    delForm.attributes = delForm.attributes.filter((a) => a && a.name !== attrDel);
    whereKinds.push('form.Attributes.remove');
  }
  if (Array.isArray(delForm.commands)) {
    delForm.commands = delForm.commands.filter((c) => c && c.name !== cmdDel);
    whereKinds.push('form.Commands.remove');
  }

  return {
    changed: true,
    marker,
    created: {
      attrsKeep: [attrKeep1, attrKeep2],
      cmdsKeep: [cmdKeep1, cmdKeep2],
      attrsDel: [attrDel],
      cmdsDel: [cmdDel],
    },
    removed: { attrNames: [attrDel], cmdNames: [cmdDel] },
    where: { kind: 'multi', kinds: whereKinds },
    forms: { add: addForm, del: delForm },
  };
}

function isAllowedDifferences(result, marker, changeKind) {
  if (!result || !result.success) {
    return { ok: false, reason: result?.error || 'compare failed' };
  }

  // Для структурных тестов (add/remove) допускаем missing_* и text_content_mismatch.
  // Сюда относим: Events/ChildItems/Attributes/Commands.
  const kind = String(changeKind || '');
  if (
    kind.includes('.Events.') ||
    kind.includes('.ChildItems.') ||
    kind.includes('form.Attributes') ||
    kind.includes('form.Commands') ||
    kind === 'multi'
  ) {
    const bad = (result.differences || []).find((d) => {
      if (!d || !d.type) return false;
      return d.type === 'tag_name_mismatch' || d.type === 'attribute_value_mismatch';
    });
    if (bad) return { ok: false, reason: `unexpected diff: ${bad.type}`, first: bad };
    return { ok: true, reason: 'structural change allowed' };
  }

  if (!Array.isArray(result.differences) || result.differences.length === 0) {
    return { ok: true, reason: 'no differences' };
  }

  const nonText = result.differences.filter((d) => d.type !== 'text_content_mismatch');
  if (nonText.length) {
    const a = analyzeDifferences(result.differences);
    return {
      ok: false,
      reason: `structural differences: ${nonText[0].type}`,
      first: nonText[0],
      summaryByType: Object.fromEntries(Object.entries(a.byType || {}).map(([k, v]) => [k, v.length])),
    };
  }

  const bad = result.differences.find((d) => {
    const second = String(d.second || '');
    return !second.includes(marker);
  });
  if (bad) {
    return { ok: false, reason: 'text mismatch without marker', first: bad };
  }

  return { ok: true, reason: 'only text mismatches with marker' };
}

async function main() {
  const configRoot = process.argv[2] || 'D:/1C/RZDZUP/src/cf';
  const maxDocs = Number(process.argv[3] || 10);

  const documentsRoot = path.join(configRoot, 'Documents');
  if (!fs.existsSync(documentsRoot)) {
    throw new Error(`Documents dir not found: ${documentsRoot}`);
  }

  const docXmls = fs.readdirSync(documentsRoot, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.xml'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, 'ru'))
    .slice(0, maxDocs)
    .map((name) => ({ name: name.replace(/\.xml$/i, ''), xmlPath: path.join(documentsRoot, name) }));

  const summary = {
    configRoot,
    maxDocs,
    startedAt: new Date().toISOString(),
    docs: [],
    totals: { docs: 0, forms: 0, passed: 0, failed: 0, skipped: 0 },
  };

  const outRoot = path.join(__dirname, 'output', 'form-save');
  ensureDir(outRoot);

  for (const doc of docXmls) {
    const docEntry = { docName: doc.name, docXmlPath: doc.xmlPath, forms: [] };
    summary.docs.push(docEntry);
    summary.totals.docs++;

    const forms = findAllFormXmlPathsForDocument(configRoot, doc.name);
    for (const f of forms) {
      summary.totals.forms++;

      const formRes = {
        formName: f.formName,
        formPath: f.formPath,
        status: 'unknown',
        reason: '',
        diffs: null,
      };
      docEntry.forms.push(formRes);

      const baseDir = path.join(outRoot, safeFileName(doc.name), safeFileName(f.formName));
      ensureDir(baseDir);

      const originalXml = readUtf8(f.formPath);
      writeUtf8(path.join(baseDir, 'before.xml'), originalXml);

      let parsed;
      try {
        parsed = await parseFormXmlFull(f.formPath);
      } catch (e) {
        formRes.status = 'failed';
        formRes.reason = `parseFormXmlFull failed: ${e?.message || String(e)}`;
        summary.totals.failed++;
        continue;
      }

      const change = applySafeChange(parsed);
      if (!change.changed) {
        formRes.status = 'skipped';
        formRes.reason = change.reason || 'no safe change';
        summary.totals.skipped++;
        continue;
      }

      // Pre-check: удалённые имена должны быть реально удалены из модели перед сохранением
      // Pre-check: удаляемое должно присутствовать после add-шага и отсутствовать после del-шага
      const addCmds = Array.isArray(change.forms?.add?.commands) ? change.forms.add.commands.map((c) => c && c.name).filter(Boolean) : [];
      const addAttrs = Array.isArray(change.forms?.add?.attributes) ? change.forms.add.attributes.map((a) => a && a.name).filter(Boolean) : [];
      const delCmds = Array.isArray(change.forms?.del?.commands) ? change.forms.del.commands.map((c) => c && c.name).filter(Boolean) : [];
      const delAttrs = Array.isArray(change.forms?.del?.attributes) ? change.forms.del.attributes.map((a) => a && a.name).filter(Boolean) : [];

      for (const v of (change.created?.attrsDel || [])) {
        if (!addAttrs.includes(String(v))) throw new Error(`BUG: DEL реквизит не попал в add-модель: ${v}`);
        if (delAttrs.includes(String(v))) throw new Error(`BUG: DEL реквизит не удалён из del-модели: ${v}`);
      }
      for (const v of (change.created?.cmdsDel || [])) {
        if (!addCmds.includes(String(v))) throw new Error(`BUG: DEL команда не попала в add-модель: ${v}`);
        if (delCmds.includes(String(v))) throw new Error(`BUG: DEL команда не удалена из del-модели: ${v}`);
      }

      let updatedXml;
      try {
        const addedXmlRaw = applyFormChangesToXmlStringWithDom(originalXml, change.forms.add);
        const addedXml = normalizeXML(addedXmlRaw);
        if (!validateXML(addedXml)) throw new Error('validateXML=false (after add)');
        writeUtf8(path.join(baseDir, 'after-add.xml'), addedXml);

        const finalXmlRaw = applyFormChangesToXmlStringWithDom(addedXml, change.forms.del);
        updatedXml = normalizeXML(finalXmlRaw);
        if (!validateXML(updatedXml)) {
          throw new Error('validateXML=false');
        }
      } catch (e) {
        formRes.status = 'failed';
        formRes.reason = `save pipeline failed: ${e?.message || String(e)}`;
        summary.totals.failed++;
        continue;
      }

      writeUtf8(path.join(baseDir, 'after.xml'), updatedXml);

      // Быстрые sanity-check'и: marker обязателен, созданные name должны попасть в XML.
      if (!updatedXml.includes(change.marker)) {
        throw new Error('marker не найден в сохранённом XML (изменение не применилось)');
      }

      const getDirectChildXml = (xml, tag) => {
        try {
          const doc = new DOMParser().parseFromString(String(xml), 'text/xml');
          const formEl = doc.getElementsByTagName('Form')[0];
          if (!formEl) return '';

          const direct = Array.from(formEl.childNodes || [])
            .filter((n) => n && n.nodeType === 1)
            .find((n) => n.tagName === tag);

          if (!direct) return '';
          return new XMLSerializer().serializeToString(direct);
        } catch {
          return '';
        }
      };

      const attrsXml = getDirectChildXml(updatedXml, 'Attributes');
      const cmdsXml = getDirectChildXml(updatedXml, 'Commands');
      const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const mustContain = [];
      for (const v of (change.created?.attrsKeep || [])) mustContain.push(String(v));
      for (const v of (change.created?.cmdsKeep || [])) mustContain.push(String(v));

      for (const v of mustContain) {
        const isAttr = String(v).startsWith('MDV_TestAttr_');
        const isCmd = String(v).startsWith('MDV_TestCmd_');
        const scope = isAttr ? attrsXml : isCmd ? cmdsXml : updatedXml;

        const re = new RegExp(`(?:name=\\"${escRe(v)}\\")|(?:<Name>${escRe(v)}<\\/Name>)`, 'i');
        if (!re.test(scope)) {
          throw new Error(`ожидаемое созданное имя не найдено в ${isAttr ? '<Attributes>' : isCmd ? '<Commands>' : 'XML'}: ${v}`);
        }
      }

      // Удаление: проверяем только внутри соответствующих секций (<Attributes>/<Commands>),
      // иначе будут ложные срабатывания (например, имя "Список" встречается в других местах XML).

      for (const v of (change.removed?.attrNames || [])) {
        const name = String(v);
        const re = new RegExp(`(?:name=\\"${escRe(name)}\\")|(?:<Name>${escRe(name)}<\\/Name>)`, 'i');
        if (re.test(attrsXml)) {
          throw new Error(`удалённое имя реквизита всё ещё найдено в <Attributes>: ${name}`);
        }
      }

      for (const v of (change.removed?.cmdNames || [])) {
        const name = String(v);
        const re = new RegExp(`(?:name=\\"${escRe(name)}\\")|(?:<Name>${escRe(name)}<\\/Name>)`, 'i');
        if (re.test(cmdsXml)) {
          throw new Error(`удалённое имя команды всё ещё найдено в <Commands>: ${name}`);
        }
      }

      const cmp = compareXmlFiles(path.join(baseDir, 'before.xml'), path.join(baseDir, 'after.xml'));
      const allow = isAllowedDifferences(cmp, change.marker, change.where?.kind);

      if (!allow.ok) {
        formRes.status = 'failed';
        formRes.reason = allow.reason;
        formRes.diffs = { first: allow.first || null, summaryByType: allow.summaryByType || null, total: cmp.total };
        summary.totals.failed++;
      } else {
        formRes.status = 'passed';
        formRes.reason = allow.reason;
        summary.totals.passed++;
      }
    }

    // Если у документа нет форм — считаем skipped для документа (не ошибка пайплайна)
    if (forms.length === 0) {
      docEntry.note = 'no forms';
    }
  }

  summary.finishedAt = new Date().toISOString();

  const summaryPath = path.join(__dirname, 'output', 'test-form-save-documents-summary.json');
  writeUtf8(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`Summary written: ${summaryPath}`);
  console.log(`Totals: docs=${summary.totals.docs}, forms=${summary.totals.forms}, passed=${summary.totals.passed}, failed=${summary.totals.failed}, skipped=${summary.totals.skipped}`);

  if (summary.totals.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
