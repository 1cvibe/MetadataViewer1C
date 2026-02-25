// Тест: проверяем, что при добавлении calculatedField/totalField
// автоматически создается поле в dataSet

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const file1 = path.join(__dirname, 'compare', 'Template1.xml');
const file2 = path.join(__dirname, 'compare', 'Template2.xml');

const xml1 = fs.readFileSync(file1, 'utf8');
const xml2 = fs.readFileSync(file2, 'utf8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: false,
});

const parsed1 = parser.parse(xml1);
const parsed2 = parser.parse(xml2);

const schema1 = parsed1.DataCompositionSchema || {};
const schema2 = parsed2.DataCompositionSchema || {};

const ds1 = Array.isArray(schema1.dataSet) ? schema1.dataSet[0] : schema1.dataSet;
const ds2 = Array.isArray(schema2.dataSet) ? schema2.dataSet[0] : schema2.dataSet;

const fields1 = Array.isArray(ds1.field) ? ds1.field : [ds1.field];
const fields2 = Array.isArray(ds2.field) ? ds2.field : [ds2.field];

console.log('=== Проверка: должны ли calculatedField/totalField иметь поля в dataSet? ===\n');

// Получаем calculatedField и totalField
const cf = schema2.calculatedField;
const tf = schema2.totalField;

if (cf) {
  const cfDataPath = cf.dataPath;
  console.log(`calculatedField: "${cfDataPath}"`);
  
  const hasField = fields2.some(f => f.dataPath === cfDataPath);
  console.log(`  Поле в dataSet: ${hasField ? '✓ ЕСТЬ' : '✗ НЕТ'}`);
  
  if (!hasField) {
    console.log(`  ПРОБЛЕМА: calculatedField "${cfDataPath}" не имеет поля в dataSet`);
    console.log(`  РЕШЕНИЕ: нужно добавить field с type="DataSetFieldFolder"`);
  }
}

if (tf) {
  const tfDataPath = tf.dataPath;
  console.log(`\ntotalField: "${tfDataPath}"`);
  
  const hasField = fields2.some(f => f.dataPath === tfDataPath);
  console.log(`  Поле в dataSet: ${hasField ? '✓ ЕСТЬ' : '✗ НЕТ'}`);
  
  if (!hasField) {
    console.log(`  ПРОБЛЕМА: totalField "${tfDataPath}" не имеет поля в dataSet`);
    console.log(`  РЕШЕНИЕ: нужно добавить field (обычно существующее поле используется)`);
  }
}

console.log('\n=== Анализ реальных 1С отчетов ===');
console.log('В 1С:');
console.log('- calculatedField требует field с xsi:type="DataSetFieldFolder" в dataSet');
console.log('- totalField обычно использует существующее поле из запроса');

