const { XMLParser } = require('fast-xml-parser');
const { serializeDcsToPreserveOrder, serializeToXml } = require('../out/xmlParsers/dcsSerializer');

console.log('=== Тест правильного порядка тегов ===\n');

// Создаем структуру с тегами в неправильном порядке
const testData = [
  { parameter: [{ name: [{ '#text': 'Параметр1' }] }] },
  { calculatedField: [{ dataPath: [{ '#text': 'ВычисляемоеПоле1' }] }] },
  { totalField: [{ dataPath: [{ '#text': 'Итого1' }] }] },
  { dataSet: [{ ':@': { '@_xsi:type': 'DataSetQuery' } }, { name: [{ '#text': 'НаборДанных1' }] }] },
  { dataSource: [{ name: [{ '#text': 'ИсточникДанных1' }] }] },
  { settingsVariant: [{ name: [{ '#text': 'Вариант1' }] }] },
  { template: [{ name: [{ '#text': 'Макет1' }] }] },
];

const xml = serializeToXml(testData, 'DataCompositionSchema');

console.log('Исходный порядок (неправильный):');
console.log('1. parameter');
console.log('2. calculatedField');
console.log('3. totalField');
console.log('4. dataSet');
console.log('5. dataSource');
console.log('6. settingsVariant');
console.log('7. template');

// Парсим результат
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: true,
});

const parsed = parser.parse(xml);
const top = Array.isArray(parsed) ? parsed : [parsed];
const rootEntry = top.find(n => n && typeof n === 'object' && !Array.isArray(n) && 'DataCompositionSchema' in n);

if (!rootEntry) {
  console.error('✗ Не найден корневой элемент');
  process.exit(1);
}

const rootBody = rootEntry['DataCompositionSchema'] || [];
const resultTags = [];

for (const item of rootBody) {
  if (!item || typeof item !== 'object') continue;
  const tag = Object.keys(item).find(k => k !== ':@' && k !== '#text');
  if (tag) {
    const localTag = tag.includes(':') ? tag.split(':').pop() : tag;
    resultTags.push(localTag);
  }
}

console.log('\nПолученный порядок в XML:');
resultTags.forEach((tag, i) => {
  console.log(`${i + 1}. ${tag}`);
});

// Проверяем правильность порядка
const expectedOrder = ['dataSource', 'dataSet', 'totalField', 'calculatedField', 'parameter', 'template', 'settingsVariant'];
const actualOrder = resultTags.filter(t => expectedOrder.includes(t));

console.log('\n=== Проверка порядка ===');

let orderCorrect = true;
for (let i = 0; i < actualOrder.length - 1; i++) {
  const current = actualOrder[i];
  const next = actualOrder[i + 1];
  
  const currentIdx = expectedOrder.indexOf(current);
  const nextIdx = expectedOrder.indexOf(next);
  
  if (currentIdx > nextIdx) {
    console.log(`✗ Неправильный порядок: ${current} должен быть ПЕРЕД ${next}`);
    orderCorrect = false;
  }
}

if (orderCorrect) {
  console.log('✓ Порядок тегов правильный!');
  console.log('\nПравильная последовательность:');
  expectedOrder.forEach((tag, i) => {
    const found = actualOrder.includes(tag);
    console.log(`  ${i + 1}. ${tag} ${found ? '✓' : '(отсутствует)'}`);
  });
  process.exit(0);
} else {
  console.log('\n✗ Порядок тегов нарушен!');
  process.exit(1);
}

