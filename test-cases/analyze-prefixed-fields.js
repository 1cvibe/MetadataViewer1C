const fs = require('fs');

// Читаем schemas-code.txt
const schemasCode = fs.readFileSync('scripts/schemas-code.txt', 'utf8');

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

// Извлекаем все поля с префиксами xr:, v8:, cfg:, app:
const prefixedFields = new Set();
const prefixedRegex = /"(xr:|v8:|cfg:|app:)([A-Z][a-zA-Z0-9]+)":/g;
while ((match = prefixedRegex.exec(schemasCode)) !== null) {
    const prefix = match[1];
    const fieldName = match[2]; // Имя без префикса
    prefixedFields.add(fieldName);
}

// Значения enum, которые не являются названиями полей
const enumValues = new Set([
    'Auto', 'Create', 'DontCheck', 'DontCreate', 'DontTransform', 'DontUse', 
    'ShowError', 'ShowWarning', 'TransformValues', 'Use', 'Always', 'DontAutoUpdate',
    'AutoUpdateUseDefaultLanguage', 'AsDescription', 'AsCode', 'InDialog', 'BothWays',
    'Allow', 'Deny', 'Managed', 'Automatic', 'AutomaticAndManaged', 'Begin', 'Substring', 
    'Anywhere', 'Background', 'Directly', 'Variable', 'Fixed', 'Nonperiodical', 'Year', 
    'Quarter', 'Month', 'Day', 'Second', 'RecorderPosition', 'RecorderSubordinate', 
    'Independent', 'WriteSelected', 'WriteModified', 'AutoFillOff', 'AutoFillOn', 
    'AutoFillOnWrite', 'HierarchyFoldersAndItems', 'HierarchyItems', 'WholeCatalog', 
    'WithinOwnerSubordination', 'WithinOwnerHierarchy', 'Single', 'Multiple',
    'PlatformApplication', 'MobilePlatformApplication', 'MobileClient', 'true', 'false',
    'ru', 'en', 'uk', 'kz', 'Item', 'Lang', 'Content', 'Type', 'TypeSet', 'Length',
    'AllowedLength', 'Digits', 'FractionDigits', 'Sign', 'DateFractions'
]);

// Служебные поля
const serviceFields = new Set(['Name', 'Synonym', 'Comment', 'UseStandardCommands', 'Type', 
                              'Properties', 'ChildObjects', 'MetaDataObject', 'Items', 
                              'Required', 'Default', 'Description', 'Enum']);

// Фильтруем поля с префиксами
const missingPrefixed = Array.from(prefixedFields)
    .filter(field => {
        // Исключаем значения enum
        if (enumValues.has(field)) {
            return false;
        }
        
        // Исключаем служебные поля
        if (serviceFields.has(field)) {
            return false;
        }
        
        // Проверяем, что это не слишком короткое поле
        if (field.length < 3) {
            return false;
        }
        
        return !existingKeys.has(field);
    })
    .sort();

console.log(`Анализ полей с префиксами из schemas-code.txt:\n`);
console.log(`Всего полей с префиксами: ${prefixedFields.size}`);
console.log(`Отсутствующих переводов (после фильтрации): ${missingPrefixed.length}\n`);

if (missingPrefixed.length > 0) {
    console.log('Отсутствующие переводы для полей с префиксами:');
    missingPrefixed.forEach(field => console.log(`  ${field}`));
} else {
    console.log('Все переводы для полей с префиксами присутствуют!');
}

// Стандартные атрибуты
const standardAttributes = [
    'Posted', 'Ref', 'DeletionMark', 'Date', 'Number', 'Owner', 'Parent', 
    'Code', 'Description', 'Predefined', 'Level', 'IsFolder', 'DataVersion', 
    'LockedByDBMS', 'WriteMode', 'ReadOnly'
];

const missingStandard = standardAttributes.filter(attr => !existingKeys.has(attr));

// Объединяем все отсутствующие
const allMissing = [...new Set([...missingPrefixed, ...missingStandard])].sort();

console.log(`\nИтоговый список отсутствующих переводов:`);
console.log(`  - Стандартные атрибуты: ${missingStandard.length}`);
console.log(`  - Поля с префиксами: ${missingPrefixed.length}`);
console.log(`  - Всего уникальных: ${allMissing.length}\n`);

if (allMissing.length > 0) {
    console.log('Все отсутствующие переводы:');
    allMissing.forEach(field => console.log(`  ${field}`));
    
    fs.writeFileSync('scripts/all-missing-elements-final.json', JSON.stringify(allMissing, null, 2));
    console.log(`\nСписок сохранен в scripts/all-missing-elements-final.json`);
}
