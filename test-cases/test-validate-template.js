const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

const filePath = process.argv[2] || 'd:/1C/RZDZUP/src/cf/Reports/ibs_ВыплатыНезарплатныхДоходов/Templates/ОсновнаяСхемаКомпоновкиДанных/Ext/Template.xml';

console.log(`Проверка файла: ${filePath}`);

if (!fs.existsSync(filePath)) {
  console.error('✗ Файл не найден');
  process.exit(1);
}

try {
  const xml = fs.readFileSync(filePath, 'utf8');
  console.log(`✓ Файл прочитан (${xml.length} символов)`);
  
  // Проверяем строку 1400
  const lines = xml.split(/\r?\n/);
  console.log(`\nВсего строк: ${lines.length}`);
  
  if (lines.length >= 1400) {
    console.log('\n=== Строки около 1400 ===');
    for (let i = 1395; i <= 1405 && i < lines.length; i++) {
      const line = lines[i];
      console.log(`${i + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
    }
  }
  
  // Пробуем распарсить
  console.log('\n=== Попытка парсинга ===');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: false,
    preserveOrder: true,
  });
  
  const parsed = parser.parse(xml);
  console.log('✓ XML валиден и успешно распарсен');
  
  // Проверяем namespace
  console.log('\n=== Проверка namespace ===');
  const hasXmlns = xml.includes('xmlns=');
  const hasXsi = xml.includes('xmlns:xsi=');
  const hasXsiType = xml.includes('xsi:type=');
  
  console.log(`xmlns: ${hasXmlns ? '✓' : '✗'}`);
  console.log(`xmlns:xsi: ${hasXsi ? '✓' : '✗'}`);
  console.log(`xsi:type используется: ${hasXsiType ? '✓' : '✗'}`);
  
  if (hasXsiType && !hasXsi) {
    console.error('\n✗ ПРОБЛЕМА: используется xsi:type, но xmlns:xsi не объявлен!');
    process.exit(1);
  }
  
  console.log('\n✓ Проверка пройдена');
  
} catch (error) {
  console.error('\n✗ Ошибка:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
}

