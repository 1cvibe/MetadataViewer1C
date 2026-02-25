/**
 * Тест пересохранения Template2.xml через наш xmldom сериализатор
 */
const fs = require('fs');
const path = require('path');

// Импортируем скомпилированные модули
const { parseReportXmlForDcs } = require('../out/xmlParsers/dcsParserXmldom.js');
const { serializeToXml } = require('../out/xmlParsers/dcsSerializerXmldom.js');

const template2Path = path.join(__dirname, 'compare', 'Template2.xml');
const outputPath = path.join(__dirname, 'test-resave-output.xml');

console.log('=== Тест пересохранения Template2.xml ===\n');

try {
  console.log('1. Читаем Template2.xml...');
  const xml2 = fs.readFileSync(template2Path, 'utf8');
  console.log(`   Размер: ${xml2.length} символов`);
  console.log(`   Строк: ${xml2.split('\n').length}`);
  
  // Удаляем BOM если есть
  let cleanXml = xml2;
  if (xml2.charCodeAt(0) === 0xFEFF) {
    cleanXml = xml2.slice(1);
  }
  
  console.log('\n2. Парсим через xmldom...');
  const { DOMParser } = require('@xmldom/xmldom');
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanXml, 'text/xml');
  
  const root = doc.documentElement;
  console.log(`   Корневой элемент: ${root.tagName}`);
  
  // Извлекаем детей
  const children = [];
  for (let i = 0; i < root.childNodes.length; i++) {
    const child = root.childNodes[i];
    if (child.nodeType === 1) {
      children.push({
        path: `${children.length}`,
        tag: child.tagName,
        attrs: {},
        children: [],
      });
    }
  }
  
  console.log(`   Дочерних элементов: ${children.length}`);
  
  // Извлекаем атрибуты
  const rootAttrs = {};
  for (let i = 0; i < root.attributes.length; i++) {
    const attr = root.attributes[i];
    rootAttrs[`@_${attr.name}`] = attr.value;
  }
  
  console.log('\n3. Сериализуем через наш сериализатор...');
  const newXml = serializeToXml(doc, root.tagName, children, rootAttrs);
  
  console.log(`   Размер: ${newXml.length} символов`);
  console.log(`   Строк: ${newXml.split('\n').length}`);
  
  // Сохраняем с BOM
  console.log('\n4. Сохраняем с BOM...');
  const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
  const contentBuffer = Buffer.from(newXml, 'utf8');
  fs.writeFileSync(outputPath, Buffer.concat([bomBuffer, contentBuffer]));
  
  console.log(`   Файл: ${outputPath}`);
  
  // Анализ результата
  console.log('\n5. Анализ результата:\n');
  
  const lines = newXml.split('\n');
  
  // Проверка пустых строк
  const emptyLines = lines.filter((l, i) => i > 2 && i < 40 && l.trim() === '').length;
  console.log(`   Пустых строк в начале (3-40): ${emptyLines} ${emptyLines === 0 ? '✅' : '❌'}`);
  
  // Проверка первого элемента
  const firstElement = lines.find(l => l.includes('<dataSource'));
  let indent = '';
  if (firstElement) {
    indent = firstElement.match(/^(\s*)</)?.[1] || '';
    console.log(`   Отступ dataSource: "${indent}" (${indent.length} символов) ${indent.length === 1 ? '✅' : '❌'}`);
  } else {
    console.log(`   Отступ dataSource: не найден ❌`);
  }
  
  // Проверка xmlns
  const hasXmlns = newXml.includes('xmlns="http://v8.1c.ru');
  console.log(`   xmlns присутствует: ${hasXmlns ? '✅' : '❌'}`);
  
  // Проверка декларации
  const hasDeclaration = newXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>');
  console.log(`   XML декларация: ${hasDeclaration ? '✅' : '❌'}`);
  
  // Показываем первые 10 строк
  console.log('\n6. Первые 10 строк результата:\n');
  lines.slice(0, 10).forEach((line, i) => {
    const lineNum = String(i + 1).padStart(3, ' ');
    console.log(`   ${lineNum}| ${line}`);
  });
  
  console.log('\n=== ИТОГ ===\n');
  
  if (emptyLines === 0 && indent.length === 1 && hasXmlns && hasDeclaration) {
    console.log('✅ ОТЛИЧНО! Форматирование корректно.');
  } else {
    console.log('⚠️  Есть проблемы с форматированием.');
  }
  
} catch (error) {
  console.error('\n❌ ОШИБКА:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
}

