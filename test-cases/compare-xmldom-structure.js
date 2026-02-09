/**
 * Сравнение структуры Template.xml через xmldom
 */
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const file1 = path.join(__dirname, 'compare', 'Template1.xml');
const file2 = path.join(__dirname, 'compare', 'Template2.xml');

console.log('=== Сравнение структуры через xmldom ===\n');

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
  
  // Анализ dataSet
  const dataSets = root.getElementsByTagName('dataSet');
  if (dataSets.length > 0) {
    console.log(`\n--- Анализ dataSet ---`);
    for (let i = 0; i < dataSets.length; i++) {
      const ds = dataSets[i];
      const name = ds.getElementsByTagName('name')[0]?.textContent || 'unnamed';
      console.log(`\ndataSet[${i}]: ${name}`);
      
      // Порядок детей dataSet
      const dsChildren = [];
      for (let j = 0; j < ds.childNodes.length; j++) {
        const child = ds.childNodes[j];
        if (child.nodeType === 1) {
          dsChildren.push(child.tagName);
        }
      }
      
      console.log(`  Дочерних элементов: ${dsChildren.length}`);
      console.log(`  Порядок: ${dsChildren.slice(0, 10).join(', ')}${dsChildren.length > 10 ? '...' : ''}`);
      
      // Подсчет field
      const fields = ds.getElementsByTagName('field');
      console.log(`  Полей (field): ${fields.length}`);
      
      // Проверка порядка field относительно query
      const query = ds.getElementsByTagName('query')[0];
      if (query) {
        const queryIndex = dsChildren.indexOf('query');
        const firstFieldIndex = dsChildren.indexOf('field');
        console.log(`  query на позиции: ${queryIndex}`);
        console.log(`  Первый field на позиции: ${firstFieldIndex}`);
        if (firstFieldIndex >= 0 && queryIndex >= 0) {
          if (firstFieldIndex < queryIndex) {
            console.log(`  ⚠️  ОШИБКА: field перед query!`);
          } else {
            console.log(`  ✓ Порядок корректен (field после query)`);
          }
        }
      }
    }
  }
  
  return { root, childElements, stats };
}

try {
  const doc1 = parseXml(file1);
  const doc2 = parseXml(file2);
  
  const analysis1 = analyzeDocument(doc1, 'Template1.xml (до изменения)');
  const analysis2 = analyzeDocument(doc2, 'Template2.xml (после изменения)');
  
  console.log('\n=== СРАВНЕНИЕ ===\n');
  
  // Сравниваем порядок корневых тегов
  const tags1 = analysis1.childElements;
  const tags2 = analysis2.childElements;
  
  console.log(`Элементов в Template1: ${tags1.length}`);
  console.log(`Элементов в Template2: ${tags2.length}`);
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
    console.log(`❌ Template2.xml имеет ${emptyLinesStart} пустых строк в начале (строки 3-40)`);
  }
  
  // Проверка отступов
  const firstDataSource1 = fs.readFileSync(file1, 'utf8').split('\n').find(l => l.includes('<dataSource>'));
  const firstDataSource2 = fs.readFileSync(file2, 'utf8').split('\n').find(l => l.includes('<dataSource>'));
  
  const indent1 = firstDataSource1?.match(/^(\s*)</)?.[1] || '';
  const indent2 = firstDataSource2?.match(/^(\s*)</)?.[1] || '';
  
  console.log(`\nОтступы dataSource:`);
  console.log(`  Template1: "${indent1}" (${indent1.length} символов)`);
  console.log(`  Template2: "${indent2}" (${indent2.length} символов)`);
  
  if (indent1 !== indent2) {
    console.log(`  ❌ Отступы различаются!`);
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

