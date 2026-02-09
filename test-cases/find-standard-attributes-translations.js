const fs = require('fs');

// Стандартные атрибуты из baseSchema.ts
const standardAttributes = [
    'Posted',
    'Ref',
    'DeletionMark',
    'Date',
    'Number',
    'Owner',
    'Parent',
    'Code',
    'Description',
    'Predefined',
    'Level',
    'IsFolder',
    'DataVersion',
    'LockedByDBMS',
    'WriteMode',
    'ReadOnly'
];

// Читаем существующие переводы
const fieldValuesContent = fs.readFileSync('src/Metadata/field-values.ts', 'utf8');
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

// Находим отсутствующие переводы для стандартных атрибутов
const missing = standardAttributes.filter(attr => !existingKeys.has(attr));

console.log(`Всего стандартных атрибутов: ${standardAttributes.length}`);
console.log(`Существующих переводов: ${standardAttributes.filter(attr => existingKeys.has(attr)).length}`);
console.log(`Отсутствующих переводов: ${missing.length}\n`);

if (missing.length > 0) {
    console.log('Отсутствующие переводы для стандартных атрибутов:');
    missing.forEach(attr => console.log(`  ${attr}`));
    
    // Сохраняем в файл
    fs.writeFileSync('scripts/missing-standard-attributes.json', JSON.stringify(missing, null, 2));
    console.log(`\nСписок сохранен в scripts/missing-standard-attributes.json`);
} else {
    console.log('Все переводы для стандартных атрибутов присутствуют!');
}

// Также проверяем schemas-code.txt на использование этих полей
const schemasCode = fs.readFileSync('scripts/schemas-code.txt', 'utf8');
const usedInSchemas = standardAttributes.filter(attr => schemasCode.includes(`"${attr}"`) || schemasCode.includes(`'${attr}'`));

console.log(`\nИспользуется в schemas-code.txt: ${usedInSchemas.length} из ${standardAttributes.length}`);
if (usedInSchemas.length > 0) {
    console.log('Используемые в schemas-code.txt:');
    usedInSchemas.forEach(attr => console.log(`  ${attr}`));
}
