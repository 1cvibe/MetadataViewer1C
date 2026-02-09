const fs = require('fs');

// Поля, которые видны на скриншоте без переводов
const fieldsFromScreenshot = [
    'PredefinedDataName',
    'Order',
    'OffBalance',
    'Type',
    'Description',
    'Code'
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

// Проверяем, какие поля отсутствуют
const missing = fieldsFromScreenshot.filter(field => !existingKeys.has(field));

console.log('Поля из скриншота:');
fieldsFromScreenshot.forEach(field => {
    const hasTranslation = existingKeys.has(field);
    console.log(`  ${field}: ${hasTranslation ? '✓ есть перевод' : '✗ нет перевода'}`);
});

if (missing.length > 0) {
    console.log(`\nОтсутствующие переводы: ${missing.length}`);
    missing.forEach(field => console.log(`  ${field}`));
    
    fs.writeFileSync('scripts/missing-fields-from-ui.json', JSON.stringify(missing, null, 2));
    console.log(`\nСписок сохранен в scripts/missing-fields-from-ui.json`);
} else {
    console.log('\nВсе поля из скриншота имеют переводы!');
}
