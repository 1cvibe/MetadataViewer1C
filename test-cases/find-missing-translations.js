const fs = require('fs');
const path = require('path');

// Читаем результаты анализа
const analysis = JSON.parse(fs.readFileSync('scripts/analysis-results.json', 'utf8'));

// Читаем field-values.ts
const fieldValuesContent = fs.readFileSync('src/Metadata/field-values.ts', 'utf8');

// Собираем все поля из анализа
const allFields = new Set();
Object.values(analysis.results).forEach(type => {
  if (type.properties) {
    type.properties.forEach(prop => allFields.add(prop.name));
  }
});

// Извлекаем существующие ключи из FIELD_LABELS
const fieldLabelsMatch = fieldValuesContent.match(/export const FIELD_LABELS[^=]*=\s*\{([\s\S]*?)\};/);
if (!fieldLabelsMatch) {
  console.error('Не найден FIELD_LABELS');
  process.exit(1);
}

const fieldLabelsContent = fieldLabelsMatch[1];
const existingKeys = new Set();
const labelRegex = /['"]([A-Za-z][A-Za-z0-9_]*)['"]:\s*['"][^'"]+['"]/g;
let match;
while ((match = labelRegex.exec(fieldLabelsContent)) !== null) {
  existingKeys.add(match[1]);
}

// Находим отсутствующие
const missing = Array.from(allFields).filter(f => !existingKeys.has(f)).sort();

console.log(`Всего полей в анализе: ${allFields.size}`);
console.log(`Существующих переводов: ${existingKeys.size}`);
console.log(`Отсутствующих переводов: ${missing.length}\n`);

console.log('Отсутствующие переводы:');
missing.forEach(f => console.log(`  ${f}`));

// Сохраняем в файл
fs.writeFileSync('scripts/missing-translations.json', JSON.stringify(missing, null, 2));
console.log(`\nСписок сохранен в scripts/missing-translations.json`);
