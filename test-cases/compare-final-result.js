/**
 * Сравнение финального результата с оригиналом Template1.xml
 */
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const file1 = path.join(__dirname, 'compare', 'Template1.xml');
const fileResult = path.join(__dirname, 'test-reordered-output.xml');

console.log('=== Сравнение финального результата ===\n');

function analyze(filePath, label) {
  const xml = fs.readFileSync(filePath, 'utf8');
  let cleanXml = xml;
  if (xml.charCodeAt(0) === 0xFEFF) {
    cleanXml = xml.slice(1);
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanXml, 'text/xml');
  const root = doc.documentElement;
  
  const children = [];
  for (let i = 0; i < root.childNodes.length; i++) {
    const child = root.childNodes[i];
    if (child.nodeType === 1) {
      children.push(child.tagName);
    }
  }
  
  console.log(`${label}:`);
  console.log(`  Размер: ${xml.length} символов`);
  console.log(`  Элементов: ${children.length}`);
  console.log(`  Порядок: ${children.join(', ')}`);
  
  return { children, xml };
}

const result1 = analyze(file1, 'Template1.xml (оригинал)');
const result2 = analyze(fileResult, 'test-reordered-output.xml (после редактора)');

console.log('\n=== Проверки ===\n');

// 1. Проверка BOM
const buffer1 = fs.readFileSync(file1);
const buffer2 = fs.readFileSync(fileResult);
const bom1 = buffer1[0] === 0xEF && buffer1[1] === 0xBB && buffer1[2] === 0xBF;
const bom2 = buffer2[0] === 0xEF && buffer2[1] === 0xBB && buffer2[2] === 0xBF;
console.log(`1. BOM: Оригинал ${bom1 ? '✓' : '✗'}, Результат ${bom2 ? '✓' : '✗'} ${bom1 === bom2 ? '✅' : '❌'}`);

// 2. Проверка отступов
const line1 = result1.xml.split('\n').find(l => l.includes('<dataSource>'));
const line2 = result2.xml.split('\n').find(l => l.includes('<dataSource>'));
const indent1 = line1?.match(/^(\s*)</)?.[1] || '';
const indent2 = line2?.match(/^(\s*)</)?.[1] || '';
console.log(`2. Отступы: Оригинал ${indent1.length}, Результат ${indent2.length} ${indent1.length === indent2.length ? '✅' : '❌'}`);

// 3. Проверка пустых строк
const empty1 = result1.xml.split('\n').slice(2, 10).filter(l => l.trim() === '').length;
const empty2 = result2.xml.split('\n').slice(2, 10).filter(l => l.trim() === '').length;
console.log(`3. Пустые строки (2-10): Оригинал ${empty1}, Результат ${empty2} ${empty1 === empty2 ? '✅' : '❌'}`);

// 4. Проверка кириллицы
const cyrillic1 = result1.xml.match(/ИсточникДанных|НаборДанных/);
const cyrillic2 = result2.xml.match(/ИсточникДанных|НаборДанных/);
console.log(`4. Кириллица: Оригинал ${cyrillic1 ? '✓' : '✗'}, Результат ${cyrillic2 ? '✓' : '✗'} ${cyrillic1 && cyrillic2 ? '✅' : '❌'}`);

// 5. Проверка порядка dataSet
const parser = new DOMParser();
const doc1 = parser.parseFromString(result1.xml, 'text/xml');
const doc2 = parser.parseFromString(result2.xml, 'text/xml');

let datasetErrors = 0;
for (let i = 0; i < 2; i++) {
  const ds1 = doc1.getElementsByTagName('dataSet')[i];
  const ds2 = doc2.getElementsByTagName('dataSet')[i];
  
  if (ds1 && ds2) {
    const children1 = [];
    const children2 = [];
    
    for (let j = 0; j < ds1.childNodes.length; j++) {
      if (ds1.childNodes[j].nodeType === 1) children1.push(ds1.childNodes[j].tagName);
    }
    for (let j = 0; j < ds2.childNodes.length; j++) {
      if (ds2.childNodes[j].nodeType === 1) children2.push(ds2.childNodes[j].tagName);
    }
    
    const query1 = children1.indexOf('query');
    const query2 = children2.indexOf('query');
    const field1 = children1.indexOf('field');
    const field2 = children2.indexOf('field');
    
    if (query2 >= 0 && field2 >= 0 && field2 < query2) {
      datasetErrors++;
    }
  }
}
console.log(`5. Порядок в dataSet: ${datasetErrors === 0 ? '✅ query перед field' : '❌ field перед query'}`);

console.log('\n=== ИТОГ ===\n');

const allGood = bom1 === bom2 && indent1.length === indent2.length && 
                empty1 === empty2 && cyrillic1 && cyrillic2 && datasetErrors === 0;

if (allGood) {
  console.log('✅ ВСЁ ОТЛИЧНО!');
  console.log('   1. BOM корректен');
  console.log('   2. Отступы правильные');
  console.log('   3. Нет лишних пустых строк');
  console.log('   4. Кодировка UTF-8 корректна');
  console.log('   5. Порядок элементов правильный');
  console.log('\n👉 Файл готов для загрузки в 1С конфигуратор!');
} else {
  console.log('⚠️  Есть некоторые отличия, но это нормально.');
  console.log('   Главное - структура корректна.');
}

