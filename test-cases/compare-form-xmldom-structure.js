/**
 * Сравнение структуры Form.xml через xmldom
 */
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const file1 = path.join(__dirname, 'compare', 'Form1.xml');
const file2 = path.join(__dirname, 'compare', 'Form2.xml');

console.log('=== Сравнение структуры Form.xml через xmldom ===\n');

function parseXml(filePath) {
  const xml = fs.readFileSync(filePath, 'utf8');
  const parser = new DOMParser({
    errorHandler: {
      warning: (w) => console.warn(`[${path.basename(filePath)}] Warning:`, w),
      error: (e) => console.error(`[${path.basename(filePath)}] Error:`, e),
      fatalError: (e) => {
        console.error(`[${path.basename(filePath)}] Fatal:`, e);
        throw new Error(`XML parsing error: ${e}`);
      }
    }
  });
  
  // Удаляем BOM если есть
  let cleanXml = xml;
  if (xml.charCodeAt(0) === 0xFEFF) {
    cleanXml = xml.slice(1);
  }
  
  return parser.parseFromString(cleanXml, 'text/xml');
}

function analyzeDocument(doc, label) {
  console.log(`\n=== ${label} ===\n`);
  
  const root = doc.documentElement;
  console.log(`Корневой элемент: ${root.tagName}`);
  console.log(`Атрибутов: ${root.attributes.length}`);
  
  // Собираем статистику по дочерним элементам
  const childElements = [];
  for (let i = 0; i < root.childNodes.length; i++) {
    const child = root.childNodes[i];
    if (child.nodeType === 1) { // ELEMENT_NODE
      childElements.push(child.tagName);
    }
  }
  
  console.log(`Дочерних элементов: ${childElements.length}`);
  console.log(`Порядок тегов: ${childElements.join(', ')}`);
  
  // Статистика по типам
  const stats = {};
  childElements.forEach(tag => {
    stats[tag] = (stats[tag] || 0) + 1;
  });
  
  console.log('\nСтатистика тегов:');
  Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([tag, count]) => {
    console.log(`  ${tag}: ${count}`);
  });
  
  // Анализ ChildItems
  const childItems = root.getElementsByTagName('ChildItems');
  if (childItems.length > 0) {
    console.log(`\n--- Анализ ChildItems ---`);
    const ci = childItems[0];
    const ciChildren = [];
    for (let j = 0; j < ci.childNodes.length; j++) {
      const child = ci.childNodes[j];
      if (child.nodeType === 1) {
        ciChildren.push(child.tagName);
      }
    }
    console.log(`  Дочерних элементов: ${ciChildren.length}`);
    console.log(`  Порядок (первые 10): ${ciChildren.slice(0, 10).join(', ')}${ciChildren.length > 10 ? '...' : ''}`);
  }
  
  // Анализ Attributes
  const attributes = root.getElementsByTagName('Attributes');
  if (attributes.length > 0) {
    console.log(`\n--- Анализ Attributes ---`);
    const attrs = attributes[0];
    const attrChildren = [];
    for (let j = 0; j < attrs.childNodes.length; j++) {
      const child = attrs.childNodes[j];
      if (child.nodeType === 1) {
        attrChildren.push(child.tagName);
      }
    }
    console.log(`  Дочерних элементов: ${attrChildren.length}`);
    console.log(`  Порядок (первые 10): ${attrChildren.slice(0, 10).join(', ')}${attrChildren.length > 10 ? '...' : ''}`);
  }
  
  // Анализ Commands
  const commands = root.getElementsByTagName('Commands');
  if (commands.length > 0) {
    console.log(`\n--- Анализ Commands ---`);
    const cmds = commands[0];
    const cmdChildren = [];
    for (let j = 0; j < cmds.childNodes.length; j++) {
      const child = cmds.childNodes[j];
      if (child.nodeType === 1) {
        cmdChildren.push(child.tagName);
      }
    }
    console.log(`  Дочерних элементов: ${cmdChildren.length}`);
    console.log(`  Порядок (первые 10): ${cmdChildren.slice(0, 10).join(', ')}${cmdChildren.length > 10 ? '...' : ''}`);
  }
  
  return { root, childElements, stats };
}

try {
  const doc1 = parseXml(file1);
  const doc2 = parseXml(file2);
  
  const analysis1 = analyzeDocument(doc1, 'Form1.xml (до изменения)');
  const analysis2 = analyzeDocument(doc2, 'Form2.xml (после изменения)');
  
  console.log('\n=== СРАВНЕНИЕ ===\n');
  
  // Сравниваем порядок корневых тегов
  const tags1 = analysis1.childElements;
  const tags2 = analysis2.childElements;
  
  console.log(`Элементов в Form1: ${tags1.length}`);
  console.log(`Элементов в Form2: ${tags2.length}`);
  console.log(`Разница: ${tags2.length - tags1.length}`);
  
  // Сравниваем порядок
  console.log('\nПорядок корневых тегов:');
  const maxLen = Math.max(tags1.length, tags2.length);
  let differences = [];
  for (let i = 0; i < maxLen; i++) {
    const t1 = tags1[i] || '(нет)';
    const t2 = tags2[i] || '(нет)';
    if (t1 !== t2) {
      console.log(`  [${i}] ${t1} → ${t2} ${t1 !== t2 ? '❌' : ''}`);
      differences.push({ index: i, was: t1, now: t2 });
    }
  }
  
  if (differences.length === 0) {
    console.log('  ✓ Порядок идентичен');
  } else {
    console.log(`\n⚠️  Найдено различий: ${differences.length}`);
  }
  
  // Сравниваем статистику
  console.log('\nСравнение количества тегов:');
  const allTags = new Set([...Object.keys(analysis1.stats), ...Object.keys(analysis2.stats)]);
  allTags.forEach(tag => {
    const count1 = analysis1.stats[tag] || 0;
    const count2 = analysis2.stats[tag] || 0;
    if (count1 !== count2) {
      console.log(`  ${tag}: ${count1} → ${count2} (${count2 > count1 ? '+' : ''}${count2 - count1})`);
    }
  });
  
  console.log('\n=== ПРОБЛЕМЫ ===\n');
  
  // Проверка пустых строк
  const xml2 = fs.readFileSync(file2, 'utf8');
  const lines = xml2.split('\n');
  const emptyLinesStart = lines.slice(2, 40).filter(line => line.trim() === '').length;
  if (emptyLinesStart > 0) {
    console.log(`❌ Form2.xml имеет ${emptyLinesStart} пустых строк в начале (строки 3-40)`);
  }
  
  // Проверка отступов
  const firstChildItems1 = fs.readFileSync(file1, 'utf8').split('\n').find(l => l.includes('<ChildItems>'));
  const firstChildItems2 = fs.readFileSync(file2, 'utf8').split('\n').find(l => l.includes('<ChildItems>'));
  
  const indent1 = firstChildItems1?.match(/^(\s*)</)?.[1] || '';
  const indent2 = firstChildItems2?.match(/^(\s*)</)?.[1] || '';
  
  console.log(`\nОтступы ChildItems:`);
  console.log(`  Form1: "${indent1}" (${indent1.length} символов)`);
  console.log(`  Form2: "${indent2}" (${indent2.length} символов)`);
  
  if (indent1 !== indent2) {
    console.log(`  ❌ Отступы различаются!`);
  }
  
  // Проверка порядка: ChildItems должен быть после свойств, но перед Attributes и Commands
  const childItemsIdx1 = tags1.indexOf('ChildItems');
  const childItemsIdx2 = tags2.indexOf('ChildItems');
  const attributesIdx1 = tags1.indexOf('Attributes');
  const attributesIdx2 = tags2.indexOf('Attributes');
  const commandsIdx1 = tags1.indexOf('Commands');
  const commandsIdx2 = tags2.indexOf('Commands');
  
  console.log(`\nПроверка порядка элементов:`);
  console.log(`  Form1: ChildItems[${childItemsIdx1}], Attributes[${attributesIdx1}], Commands[${commandsIdx1}]`);
  console.log(`  Form2: ChildItems[${childItemsIdx2}], Attributes[${attributesIdx2}], Commands[${commandsIdx2}]`);
  
  // Правильный порядок: свойства -> ChildItems -> Attributes -> Commands
  let orderIssues = [];
  if (childItemsIdx2 >= 0 && attributesIdx2 >= 0 && childItemsIdx2 > attributesIdx2) {
    orderIssues.push('ChildItems должен быть перед Attributes');
  }
  if (attributesIdx2 >= 0 && commandsIdx2 >= 0 && attributesIdx2 > commandsIdx2) {
    orderIssues.push('Attributes должен быть перед Commands');
  }
  
  if (orderIssues.length > 0) {
    console.log(`  ❌ Проблемы с порядком:`);
    orderIssues.forEach(issue => console.log(`    - ${issue}`));
  } else {
    console.log(`  ✓ Порядок корректен`);
  }
  
  console.log('\n=== ДИАГНОЗ ===\n');
  
  const issues = [];
  if (emptyLinesStart > 0) {
    issues.push('Лишние пустые строки в начале файла');
  }
  if (indent1 !== indent2) {
    issues.push('Некорректные отступы элементов');
  }
  if (differences.length > 0) {
    issues.push('Порядок элементов изменился');
  }
  if (orderIssues.length > 0) {
    issues.push(...orderIssues);
  }
  
  if (issues.length > 0) {
    console.log('❌ НАЙДЕНЫ ПРОБЛЕМЫ:');
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  } else {
    console.log('✅ Структура корректна');
  }
  
} catch (error) {
  console.error('\n❌ ОШИБКА:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
}

