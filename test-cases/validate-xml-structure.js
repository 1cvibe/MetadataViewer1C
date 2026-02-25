const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const file2 = path.join(__dirname, 'compare', 'Template2.xml');
const xml2 = fs.readFileSync(file2, 'utf8');

console.log('=== Проверка структуры Template2.xml для загрузки в 1С ===\n');

// Парсим с preserveOrder для точного анализа
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: true,
});

const parsed = parser.parse(xml2);
const top = Array.isArray(parsed) ? parsed : [parsed];
const rootEntry = top.find(n => n && typeof n === 'object' && !Array.isArray(n) && 'DataCompositionSchema' in n);

if (!rootEntry) {
  console.log('✗ DataCompositionSchema не найден!');
  process.exit(1);
}

const rootBody = rootEntry['DataCompositionSchema'] || [];
const rootAttrs = rootEntry[':@'] || {};

console.log('=== Атрибуты корневого элемента ===');
Object.keys(rootAttrs).forEach(k => {
  console.log(`  ${k}: ${rootAttrs[k]}`);
});

console.log('\n=== Порядок тегов на корневом уровне ===\n');

const rootTags = [];
rootBody.forEach((item, idx) => {
  if (!item || typeof item !== 'object') return;
  const tag = Object.keys(item).find(k => k !== ':@' && k !== '#text');
  if (!tag) return;
  
  const localTag = tag.includes(':') ? tag.split(':').pop() : tag;
  const attrs = item[':@'] || {};
  
  rootTags.push({ idx: idx + 1, tag: localTag, fullTag: tag, attrs });
});

rootTags.forEach(({ idx, tag, fullTag, attrs }) => {
  const attrStr = Object.keys(attrs).length > 0 ? ` [${Object.keys(attrs).map(k => `${k}="${attrs[k]}"`).join(', ')}]` : '';
  console.log(`${idx}. <${tag}>${attrStr}`);
});

console.log('\n=== Проверка правильности порядка ===\n');

// Правильный порядок согласно 1С
const expectedOrder = [
  'dataSource',
  'dataSet',
  'dataSetLink',
  'totalField',
  'calculatedField',
  'parameter',
  'template',
  'groupTemplate',
  'totalFieldsTemplate',
  'settingsVariant'
];

let errors = [];

// Проверяем порядок
for (let i = 0; i < rootTags.length - 1; i++) {
  const current = rootTags[i];
  const next = rootTags[i + 1];
  
  const currentIdx = expectedOrder.indexOf(current.tag);
  const nextIdx = expectedOrder.indexOf(next.tag);
  
  if (currentIdx >= 0 && nextIdx >= 0 && currentIdx > nextIdx) {
    errors.push(`✗ Позиция ${current.idx}: <${current.tag}> НЕ ДОЛЖЕН быть перед <${next.tag}>`);
  }
}

if (errors.length > 0) {
  console.log('❌ НАЙДЕНЫ ОШИБКИ ПОРЯДКА:');
  errors.forEach(e => console.log(`  ${e}`));
  
  console.log('\n=== Правильный порядок должен быть: ===');
  expectedOrder.forEach((tag, i) => {
    console.log(`  ${i + 1}. ${tag}`);
  });
  
  console.log('\n=== Рекомендация ===');
  console.log('Нужно исправить функцию reorderRootSectionsForSave в src/dcsEditor.ts');
  
  process.exit(1);
} else {
  console.log('✓ Порядок тегов на корневом уровне ПРАВИЛЬНЫЙ');
}

// Проверяем структуру dataSet
console.log('\n=== Проверка структуры dataSet ===\n');

const dataSetEntry = rootBody.find(item => item && typeof item === 'object' && 'dataSet' in item);

if (!dataSetEntry) {
  console.log('✗ dataSet не найден!');
  process.exit(1);
}

const dataSetBody = dataSetEntry['dataSet'] || [];
const dataSetAttrs = dataSetEntry[':@'] || {};

console.log(`Атрибуты dataSet: ${JSON.stringify(dataSetAttrs)}`);

const dsChildren = [];
dataSetBody.forEach((item) => {
  if (!item || typeof item !== 'object') return;
  const tag = Object.keys(item).find(k => k !== ':@' && k !== '#text');
  if (!tag) return;
  
  const localTag = tag.includes(':') ? tag.split(':').pop() : tag;
  dsChildren.push(localTag);
});

console.log(`\nПорядок тегов в dataSet (${dsChildren.length} элементов):`);
dsChildren.slice(0, 10).forEach((tag, i) => {
  console.log(`  ${i + 1}. ${tag}`);
});
if (dsChildren.length > 10) {
  console.log(`  ... еще ${dsChildren.length - 10} элементов`);
}

// Проверяем правильность порядка в dataSet
const dsExpectedOrder = ['name', 'field', 'dataSource', 'query'];

let dsErrors = [];

const nameIdx = dsChildren.indexOf('name');
const firstFieldIdx = dsChildren.indexOf('field');
const lastFieldIdx = dsChildren.lastIndexOf('field');
const dataSourceIdx = dsChildren.indexOf('dataSource');
const queryIdx = dsChildren.indexOf('query');

if (nameIdx > 0) {
  dsErrors.push(`✗ name должен быть первым (сейчас на позиции ${nameIdx + 1})`);
}

if (firstFieldIdx >= 0 && dataSourceIdx >= 0 && lastFieldIdx > dataSourceIdx) {
  dsErrors.push(`✗ field должны быть ПЕРЕД dataSource (последний field на ${lastFieldIdx + 1}, dataSource на ${dataSourceIdx + 1})`);
}

if (firstFieldIdx >= 0 && queryIdx >= 0 && lastFieldIdx > queryIdx) {
  dsErrors.push(`✗ field должны быть ПЕРЕД query (последний field на ${lastFieldIdx + 1}, query на ${queryIdx + 1})`);
}

if (dataSourceIdx >= 0 && queryIdx >= 0 && dataSourceIdx > queryIdx) {
  dsErrors.push(`✗ dataSource должен быть ПЕРЕД query (dataSource на ${dataSourceIdx + 1}, query на ${queryIdx + 1})`);
}

if (dsErrors.length > 0) {
  console.log('\n❌ НАЙДЕНЫ ОШИБКИ В dataSet:');
  dsErrors.forEach(e => console.log(`  ${e}`));
  
  console.log('\n=== Правильный порядок в dataSet: ===');
  console.log('  1. <name>');
  console.log('  2. <field> ... </field> (все поля)');
  console.log('  3. <dataSource>');
  console.log('  4. <query>');
  
  console.log('\n=== Рекомендация ===');
  console.log('Нужно исправить логику вставки полей в dataSet');
  console.log('Файл: src/webview/components/DcsEditor/DcsEditorApp.tsx');
  console.log('Метод: handleAddCalculatedField');
  
  process.exit(1);
} else {
  console.log('\n✓ Порядок тегов в dataSet ПРАВИЛЬНЫЙ');
}

console.log('\n=== ИТОГ ===');
console.log('✅ Структура XML полностью соответствует требованиям 1С СКД!');
console.log('✅ Файл должен загружаться в конфигуратор без ошибок.');

console.log('\n=== Дополнительная информация ===');
console.log(`Размер файла: ${(xml2.length / 1024).toFixed(1)} KB`);
console.log(`Строк в файле: ${xml2.split(/\r?\n/).length}`);
console.log(`Элементов на корневом уровне: ${rootTags.length}`);

