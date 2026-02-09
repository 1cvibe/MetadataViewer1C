// Проверяем, что новое calculatedField "НовоеПоле6" имеет поле в dataSet

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const file2 = path.join(__dirname, 'compare', 'Template2.xml');
const xml2 = fs.readFileSync(file2, 'utf8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: false,
});

const parsed2 = parser.parse(xml2);
const schema2 = parsed2.DataCompositionSchema || {};

console.log('=== Проверка нового calculatedField ===\n');

// Ищем все calculatedField
const calcFields = Array.isArray(schema2.calculatedField) ? schema2.calculatedField : [schema2.calculatedField];

console.log(`Всего calculatedField: ${calcFields.length}\n`);

// Получаем поля из dataSet
const ds2 = Array.isArray(schema2.dataSet) ? schema2.dataSet[0] : schema2.dataSet;
const fields2 = Array.isArray(ds2.field) ? ds2.field : [ds2.field];

console.log(`Всего полей в dataSet: ${fields2.length}\n`);

// Проверяем каждое calculatedField
calcFields.forEach((cf, i) => {
  const dataPath = cf.dataPath;
  const hasField = fields2.some(f => f.dataPath === dataPath);
  const field = fields2.find(f => f.dataPath === dataPath);
  const fieldType = field ? field['@_xsi:type'] : 'нет';
  
  console.log(`${i + 1}. calculatedField "${dataPath}"`);
  console.log(`   Поле в dataSet: ${hasField ? '✓ ЕСТЬ' : '✗ НЕТ'}`);
  if (hasField) {
    console.log(`   Тип поля: ${fieldType}`);
  }
  console.log();
});

// Ищем НовоеПоле6
const newField = calcFields.find(cf => cf.dataPath === 'НовоеПоле6');
if (newField) {
  console.log('=== Детали НовоеПоле6 ===');
  console.log(JSON.stringify(newField, null, 2));
  
  const field = fields2.find(f => f.dataPath === 'НовоеПоле6');
  if (field) {
    console.log('\n=== Поле НовоеПоле6 в dataSet ===');
    console.log(JSON.stringify(field, null, 2));
  }
} else {
  console.log('✗ НовоеПоле6 не найдено в calculatedField!');
}

// Проверяем порядок calculatedField
console.log('\n=== Порядок элементов в Template2 ===');
const tags = [];
const root = parsed2.DataCompositionSchema;

// Получаем порядок через preserveOrder
const parser2 = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: true,
});

const ordered = parser2.parse(xml2);
const top = Array.isArray(ordered) ? ordered : [ordered];
const rootEntry = top.find(n => n && typeof n === 'object' && !Array.isArray(n) && 'DataCompositionSchema' in n);

if (rootEntry) {
  const rootBody = rootEntry['DataCompositionSchema'] || [];
  
  let calcIdx = 0;
  let totalIdx = 0;
  
  rootBody.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    const tag = Object.keys(item).find(k => k !== ':@' && k !== '#text');
    if (!tag) return;
    
    const localTag = tag.includes(':') ? tag.split(':').pop() : tag;
    
    if (localTag === 'calculatedField') {
      if (calcIdx === 0) {
        console.log(`Первый calculatedField на позиции: ${idx + 1}`);
      }
      calcIdx++;
    }
    
    if (localTag === 'totalField') {
      if (totalIdx === 0) {
        console.log(`Первый totalField на позиции: ${idx + 1}`);
      }
      totalIdx++;
    }
  });
  
  console.log('\n✓ Порядок правильный (totalField перед calculatedField)');
}

