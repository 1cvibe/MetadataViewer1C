/**
 * Проверка порядка элементов в dataSet после пересохранения
 */
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const outputFile = path.join(__dirname, 'test-full-output.xml');

console.log('=== Проверка порядка в dataSet ===\n');

if (!fs.existsSync(outputFile)) {
  console.error('❌ Файл не найден:', outputFile);
  console.error('   Запустите сначала: node test-cases/test-full-reparse.js');
  process.exit(1);
}

const xml = fs.readFileSync(outputFile, 'utf8');

// Удаляем BOM
let cleanXml = xml;
if (xml.charCodeAt(0) === 0xFEFF) {
  cleanXml = xml.slice(1);
}

const parser = new DOMParser();
const doc = parser.parseFromString(cleanXml, 'text/xml');

const dataSets = doc.getElementsByTagName('dataSet');

console.log(`Найдено dataSet: ${dataSets.length}\n`);

for (let i = 0; i < dataSets.length; i++) {
  const ds = dataSets[i];
  const name = ds.getElementsByTagName('name')[0]?.textContent || 'unnamed';
  
  console.log(`\n--- dataSet[${i}]: ${name} ---\n`);
  
  // Собираем порядок детей (только элементы)
  const children = [];
  for (let j = 0; j < ds.childNodes.length; j++) {
    const child = ds.childNodes[j];
    if (child.nodeType === 1) { // ELEMENT_NODE
      children.push(child.tagName);
    }
  }
  
  console.log(`Дочерних элементов: ${children.length}`);
  console.log(`Порядок: ${children.slice(0, 15).join(', ')}${children.length > 15 ? '...' : ''}`);
  
  // Ищем позиции ключевых элементов
  const nameIdx = children.indexOf('name');
  const queryIdx = children.indexOf('query');
  const itemsIdx = children.indexOf('items');
  const firstFieldIdx = children.indexOf('field');
  
  console.log(`\nПозиции:`);
  console.log(`  name: ${nameIdx}`);
  console.log(`  query: ${queryIdx >= 0 ? queryIdx : '(нет)'}`);
  console.log(`  items: ${itemsIdx >= 0 ? itemsIdx : '(нет)'}`);
  console.log(`  первый field: ${firstFieldIdx >= 0 ? firstFieldIdx : '(нет)'}`);
  
  // Проверка правильности порядка
  console.log(`\nПроверка порядка:`);
  
  if (nameIdx !== 0) {
    console.log(`  ❌ name должен быть первым (позиция 0), а не ${nameIdx}`);
  } else {
    console.log(`  ✓ name на позиции 0`);
  }
  
  const dataIdx = queryIdx >= 0 ? queryIdx : itemsIdx;
  if (dataIdx < 0) {
    console.log(`  ⚠️  Нет query/items`);
  } else if (firstFieldIdx >= 0 && firstFieldIdx < dataIdx) {
    console.log(`  ❌ ОШИБКА: field (позиция ${firstFieldIdx}) перед query/items (позиция ${dataIdx})`);
    console.log(`     Правильно: name → query/items → field`);
  } else if (firstFieldIdx >= 0 && firstFieldIdx > dataIdx) {
    console.log(`  ✓ Порядок правильный: query/items → field`);
  } else {
    console.log(`  ⚠️  Нет field элементов`);
  }
}

console.log('\n=== ИТОГ ===\n');

// Подсчитываем ошибки
let errors = 0;
for (let i = 0; i < dataSets.length; i++) {
  const ds = dataSets[i];
  const children = [];
  for (let j = 0; j < ds.childNodes.length; j++) {
    const child = ds.childNodes[j];
    if (child.nodeType === 1) {
      children.push(child.tagName);
    }
  }
  
  const queryIdx = children.indexOf('query');
  const itemsIdx = children.indexOf('items');
  const firstFieldIdx = children.indexOf('field');
  const dataIdx = queryIdx >= 0 ? queryIdx : itemsIdx;
  
  if (dataIdx >= 0 && firstFieldIdx >= 0 && firstFieldIdx < dataIdx) {
    errors++;
  }
}

if (errors === 0) {
  console.log('✅ ВСЕ dataSet имеют правильный порядок элементов!');
} else {
  console.log(`❌ Найдено ${errors} dataSet с неправильным порядком`);
  console.log('   Нужно исправить функцию reorderDataSetChildren');
}

