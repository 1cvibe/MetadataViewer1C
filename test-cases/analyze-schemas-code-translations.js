const fs = require('fs');

// Читаем schemas-code.txt
const schemasCode = fs.readFileSync('scripts/schemas-code.txt', 'utf8');

// Извлекаем все поля из title
const titleFields = new Set();
const titleRegex = /"title":\s*"([A-Z][a-zA-Z0-9]+)"/g;
let match;
while ((match = titleRegex.exec(schemasCode)) !== null) {
    titleFields.add(match[1]);
}

// Извлекаем все значения из enum
const enumValues = new Set();
const enumRegex = /"enum":\s*\[([^\]]+)\]/g;
while ((match = enumRegex.exec(schemasCode)) !== null) {
    const enumContent = match[1];
    // Извлекаем строковые значения из enum
    const stringValues = enumContent.match(/"([^"]+)"/g);
    if (stringValues) {
        stringValues.forEach(val => {
            const cleanVal = val.replace(/"/g, '');
            // Добавляем только если это похоже на название поля (начинается с заглавной буквы)
            if (/^[A-Z][a-zA-Z0-9]*$/.test(cleanVal)) {
                enumValues.add(cleanVal);
            }
        });
    }
}

// Объединяем все поля
const allFields = new Set([...titleFields, ...enumValues]);

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
while ((match = labelRegex.exec(fieldLabelsContent)) !== null) {
    existingKeys.add(match[1]);
}

// Находим отсутствующие переводы
const missing = Array.from(allFields)
    .filter(field => !existingKeys.has(field))
    .sort();

console.log(`Всего полей в schemas-code.txt: ${allFields.size}`);
console.log(`  - Из title: ${titleFields.size}`);
console.log(`  - Из enum: ${enumValues.size}`);
console.log(`Существующих переводов: ${existingKeys.size}`);
console.log(`Отсутствующих переводов: ${missing.length}\n`);

if (missing.length > 0) {
    console.log('Отсутствующие переводы:');
    missing.forEach(field => console.log(`  ${field}`));
    
    // Сохраняем в файл
    fs.writeFileSync('scripts/missing-schemas-code-translations.json', JSON.stringify(missing, null, 2));
    console.log(`\nСписок сохранен в scripts/missing-schemas-code-translations.json`);
} else {
    console.log('Все переводы присутствуют!');
}

// Также проверяем стандартные атрибуты отдельно
const standardAttributes = [
    'Posted', 'Ref', 'DeletionMark', 'Date', 'Number', 'Owner', 'Parent', 
    'Code', 'Description', 'Predefined', 'Level', 'IsFolder', 'DataVersion', 
    'LockedByDBMS', 'WriteMode', 'ReadOnly'
];

const missingStandard = standardAttributes.filter(attr => !existingKeys.has(attr));
console.log(`\nОтсутствующие переводы для стандартных атрибутов: ${missingStandard.length}`);
if (missingStandard.length > 0) {
    missingStandard.forEach(attr => console.log(`  ${attr}`));
}
