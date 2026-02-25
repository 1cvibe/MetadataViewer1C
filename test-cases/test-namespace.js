const { serializeToXml } = require('../out/xmlParsers/dcsSerializer');

// Простой тест проверки namespace
const testData = [
  {
    dataSet: [
      { ':@': { '@_xsi:type': 'DataSetQuery' } },
      { name: [{ '#text': 'НаборДанных1' }] }
    ]
  }
];

const xml = serializeToXml(testData, 'DataCompositionSchema');
console.log('=== Сгенерированный XML ===');
console.log(xml);
console.log('\n=== Проверка namespace ===');

const checks = [
  { name: 'xmlns', pattern: 'xmlns="http://v8.1c.ru/8.1/data-composition-system/schema"' },
  { name: 'xmlns:xsi', pattern: 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' },
  { name: 'xmlns:dcscom', pattern: 'xmlns:dcscom="http://v8.1c.ru/8.1/data-composition-system/common"' },
  { name: 'xmlns:xs', pattern: 'xmlns:xs="http://www.w3.org/2001/XMLSchema"' }
];

let allPassed = true;
for (const check of checks) {
  const found = xml.includes(check.pattern);
  console.log(`${found ? '✓' : '✗'} ${check.name}: ${found ? 'Найден' : 'НЕ НАЙДЕН'}`);
  if (!found) allPassed = false;
}

if (allPassed) {
  console.log('\n✓ Все namespace объявления добавлены корректно!');
  process.exit(0);
} else {
  console.log('\n✗ Некоторые namespace отсутствуют!');
  process.exit(1);
}

