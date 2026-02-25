const fs = require('fs');

// Читаем schemas-code.txt
const schemasCode = fs.readFileSync('scripts/schemas-code.txt', 'utf8');

// Извлекаем все ключи свойств из схем (названия полей в properties)
const propertyFields = new Set();
// Ищем паттерн: "FieldName": { где FieldName начинается с заглавной буквы
const propertyRegex = /"([A-Z][a-zA-Z0-9]+)":\s*\{/g;
let match;
while ((match = propertyRegex.exec(schemasCode)) !== null) {
    const fieldName = match[1];
    // Исключаем служебные поля
    if (!['Name', 'Synonym', 'Comment', 'UseStandardCommands', 'Type', 'Properties', 
          'ChildObjects', 'MetaDataObject', 'v8', 'xr', 'xsi', 'OneOf', 'TypeSet'].includes(fieldName)) {
        propertyFields.add(fieldName);
    }
}

// Также извлекаем поля из title
const titleFields = new Set();
const titleRegex = /"title":\s*"([A-Z][a-zA-Z0-9]+)"/g;
while ((match = titleRegex.exec(schemasCode)) !== null) {
    const fieldName = match[1];
    // Исключаем служебные названия
    if (!['Имя', 'Синоним', 'Комментарий', 'Многоязычное', 'Элементы', 'Язык', 'Содержимое', 
          'Стандартный', 'Реквизиты', 'Табличная', 'Форма', 'Команда', 'Тип', 'Квалификаторы',
          'Квалификаторы строки', 'Квалификаторы числа', 'Квалификаторы даты'].includes(fieldName)) {
        titleFields.add(fieldName);
    }
}

// Объединяем все поля
const allFields = new Set([...propertyFields, ...titleFields]);

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
    'PlatformApplication', 'MobilePlatformApplication', 'MobileClient'
]);

// Находим отсутствующие переводы
const missing = Array.from(allFields)
    .filter(field => {
        // Исключаем значения enum
        if (enumValues.has(field)) {
            return false;
        }
        
        // Проверяем, что это не служебное поле
        if (field.length < 3 || field.startsWith('v8') || field.startsWith('xr') || field.startsWith('xsi')) {
            return false;
        }
        
        return !existingKeys.has(field);
    })
    .sort();

console.log(`Всего полей в schemas-code.txt:`);
console.log(`  - Из properties: ${propertyFields.size}`);
console.log(`  - Из title: ${titleFields.size}`);
console.log(`  - Всего уникальных: ${allFields.size}`);
console.log(`Существующих переводов: ${existingKeys.size}`);
console.log(`Отсутствующих переводов (после фильтрации): ${missing.length}\n`);

if (missing.length > 0) {
    console.log('Отсутствующие переводы:');
    missing.forEach(field => console.log(`  ${field}`));
    
    // Сохраняем в файл
    fs.writeFileSync('scripts/missing-schemas-code-all-fields.json', JSON.stringify(missing, null, 2));
    console.log(`\nСписок сохранен в scripts/missing-schemas-code-all-fields.json`);
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
    console.log('Стандартные атрибуты без переводов:');
    missingStandard.forEach(attr => console.log(`  ${attr}`));
}

// Объединяем все отсутствующие
const allMissing = [...new Set([...missing, ...missingStandard])].sort();
console.log(`\nВсего отсутствующих переводов (уникальных): ${allMissing.length}`);

if (allMissing.length > 0) {
    fs.writeFileSync('scripts/all-missing-schemas-code-translations.json', JSON.stringify(allMissing, null, 2));
    console.log(`Полный список сохранен в scripts/all-missing-schemas-code-translations.json`);
}
