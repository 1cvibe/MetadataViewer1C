const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');
const { serializeDcsToPreserveOrder, serializeToXml } = require('../out/xmlParsers/dcsSerializer');
const { XmlDiffMerge } = require('../out/utils/xmlDiffMerge');

const templatePath = 'd:/1C/RZDZUP/src/cf/Reports/ibs_ВыплатыНезарплатныхДоходов/Templates/ОсновнаяСхемаКомпоновкиДанных/Ext/Template.xml';

console.log('=== Тест прямой обработки Template.xml ===\n');

if (!fs.existsSync(templatePath)) {
  console.error('✗ Файл не найден:', templatePath);
  process.exit(1);
}

try {
  // Читаем исходный XML
  const originalXml = fs.readFileSync(templatePath, 'utf8');
  const originalLines = originalXml.split(/\r?\n/).length;
  console.log(`✓ Исходный файл: ${originalXml.length} символов, ${originalLines} строк`);
  
  // Парсим с preserveOrder
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: false,
    preserveOrder: true,
    trimValues: false,
    parseTagValue: false,
    parseAttributeValue: false,
  });
  
  const ordered = parser.parse(originalXml);
  console.log('✓ XML распарсен в preserveOrder');
  
  // Извлекаем корневой элемент и его атрибуты
  const top = Array.isArray(ordered) ? ordered : [ordered];
  const rootEntry = top.find(n => n && typeof n === 'object' && !Array.isArray(n) && 'DataCompositionSchema' in n);
  
  if (!rootEntry) {
    throw new Error('Не найден корневой элемент DataCompositionSchema');
  }
  
  const rootAttrs = rootEntry[':@'] || {};
  const rootBody = rootEntry['DataCompositionSchema'] || [];
  
  console.log(`✓ Корневой элемент найден, атрибутов: ${Object.keys(rootAttrs).length}`);
  console.log('  Атрибуты:', Object.keys(rootAttrs).map(k => k.replace('@_', '')).join(', '));
  
  // Пересохраняем без изменений
  const updatedXml = serializeToXml(rootBody, 'DataCompositionSchema', rootAttrs);
  const updatedLines = updatedXml.split(/\r?\n/).length;
  
  console.log(`\n✓ XML сгенерирован: ${updatedXml.length} символов, ${updatedLines} строк`);
  console.log(`  Разница: ${updatedLines - originalLines > 0 ? '+' : ''}${updatedLines - originalLines} строк`);
  
  // Сохраняем результат
  const outputPath = path.join(__dirname, 'output', 'template-direct-resaved.xml');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, updatedXml, 'utf8');
  console.log(`✓ Сохранено в: ${outputPath}`);
  
  // Проверяем валидность результата
  parser.parse(updatedXml);
  console.log('✓ Результат валиден');
  
  // Проверяем namespace
  console.log('\n=== Проверка namespace ===');
  const checks = [
    ['xmlns', 'xmlns='],
    ['xmlns:xsi', 'xmlns:xsi='],
    ['xmlns:dcscom', 'xmlns:dcscom=']
  ];
  
  for (const [name, pattern] of checks) {
    const inOriginal = originalXml.includes(pattern);
    const inResult = updatedXml.includes(pattern);
    const status = inResult ? '✓' : '✗';
    console.log(`  ${status} ${name}: исходный=${inOriginal}, результат=${inResult}`);
  }
  
  // Показываем первые 10 строк результата
  console.log('\n=== Первые 10 строк результата ===');
  updatedXml.split(/\r?\n/).slice(0, 10).forEach((line, i) => {
    console.log(`${i + 1}: ${line}`);
  });
  
  console.log('\n✓ Все проверки пройдены');
  
} catch (error) {
  console.error('\n✗ Ошибка:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
}

