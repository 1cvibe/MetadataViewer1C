const fs = require('fs');
const path = require('path');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

const file1 = path.join(__dirname, 'compare', 'Template1.xml');
const xml1 = fs.readFileSync(file1, 'utf8');

console.log('=== Тест форматирования XML ===\n');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: true,
});

const parsed = parser.parse(xml1);

// Тест без форматирования (как было)
const builderNoFormat = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: false,
  preserveOrder: true,
  suppressEmptyNode: true,
});

const xmlNoFormat = '<?xml version="1.0" encoding="UTF-8"?>\n' + builderNoFormat.build(parsed);

// Тест с форматированием (исправление)
const builderWithFormat = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '\t',
  preserveOrder: true,
  suppressEmptyNode: true,
});

const xmlWithFormat = '<?xml version="1.0" encoding="UTF-8"?>\n' + builderWithFormat.build(parsed);

console.log('Исходный Template1.xml:');
console.log(`  Размер: ${(xml1.length / 1024).toFixed(1)} KB`);
console.log(`  Строк: ${xml1.split(/\r?\n/).length}`);

console.log('\nБез форматирования (format: false):');
console.log(`  Размер: ${(xmlNoFormat.length / 1024).toFixed(1)} KB`);
console.log(`  Строк: ${xmlNoFormat.split(/\r?\n/).length}`);

console.log('\nС форматированием (format: true, indentBy: \\t):');
console.log(`  Размер: ${(xmlWithFormat.length / 1024).toFixed(1)} KB`);
console.log(`  Строк: ${xmlWithFormat.split(/\r?\n/).length}`);

console.log('\n=== Сравнение ===');

const ratio = xmlWithFormat.length / xml1.length;
const linesRatio = xmlWithFormat.split(/\r?\n/).length / xml1.split(/\r?\n/).length;

console.log(`Увеличение размера: ${(ratio * 100 - 100).toFixed(1)}%`);
console.log(`Количество строк: ${(linesRatio * 100).toFixed(0)}% от оригинала`);

if (xmlWithFormat.length > xml1.length * 1.5) {
  console.log('\n⚠️  ПРЕДУПРЕЖДЕНИЕ: Файл слишком раздулся!');
  console.log('   Возможно, есть проблема с пустыми строками или отступами.');
} else if (xmlWithFormat.length < xml1.length * 0.8) {
  console.log('\n⚠️  ПРЕДУПРЕЖДЕНИЕ: Файл слишком сжался!');
  console.log('   Возможно, потеряно форматирование.');
} else {
  console.log('\n✓ Размер файла в допустимых пределах.');
}

// Проверяем первые 10 строк
console.log('\n=== Первые 10 строк (с форматированием) ===\n');
xmlWithFormat.split(/\r?\n/).slice(0, 10).forEach((line, i) => {
  const preview = line.substring(0, 80) + (line.length > 80 ? '...' : '');
  console.log(`${i + 1}: ${preview}`);
});

