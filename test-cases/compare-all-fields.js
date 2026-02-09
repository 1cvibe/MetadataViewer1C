const fs = require('fs');

// Читаем поля из схем
const schemaFields = JSON.parse(fs.readFileSync('scripts/schema-fields.json', 'utf8'));

// Читаем существующие переводы
const fieldValuesContent = fs.readFileSync('src/Metadata/field-values.ts', 'utf8');
const fieldLabelsMatch = fieldValuesContent.match(/export const FIELD_LABELS[^=]*=\s*\{([\s\S]*?)\};/);
const fieldLabelsContent = fieldLabelsMatch ? fieldLabelsMatch[1] : '';
const existingKeys = new Set();
const labelRegex = /['"]([A-Za-z][A-Za-z0-9_]*)['"]:\s*['"][^'"]+['"]/g;
let match;
while ((match = labelRegex.exec(fieldLabelsContent)) !== null) {
    existingKeys.add(match[1]);
}

// Читаем отсутствующие из анализа
const missingFromAnalysis = JSON.parse(fs.readFileSync('scripts/missing-translations.json', 'utf8'));

// Находим все отсутствующие из схем
const missingFromSchemas = schemaFields.filter(f => !existingKeys.has(f));

// Объединяем все отсутствующие
const allMissing = [...new Set([...missingFromAnalysis, ...missingFromSchemas])].sort();

console.log(`Всего полей в схемах: ${schemaFields.length}`);
console.log(`Существующих переводов: ${existingKeys.size}`);
console.log(`Отсутствующих из анализа: ${missingFromAnalysis.length}`);
console.log(`Отсутствующих из схем: ${missingFromSchemas.length}`);
console.log(`Всего отсутствующих (уникальных): ${allMissing.length}\n`);

console.log('Все отсутствующие переводы:');
allMissing.forEach(f => console.log(`  ${f}`));

// Сохраняем
fs.writeFileSync('scripts/all-missing-translations.json', JSON.stringify(allMissing, null, 2));
console.log(`\nСписок сохранен в scripts/all-missing-translations.json`);
