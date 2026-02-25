const fs = require('fs');

// Читаем schemas-code.txt
const schemasCode = fs.readFileSync('scripts/schemas-code.txt', 'utf8');

// Извлекаем все поля из title (только те, которые выглядят как названия полей)
const titleFields = new Set();
// Ищем паттерн: "title": "FieldName" где FieldName начинается с заглавной буквы и содержит только буквы/цифры
const titleRegex = /"title":\s*"([A-Z][a-zA-Z0-9]+)"/g;
let match;
while ((match = titleRegex.exec(schemasCode)) !== null) {
    const fieldName = match[1];
    // Исключаем служебные названия
    if (!['Имя', 'Синоним', 'Комментарий', 'Многоязычное', 'Элементы', 'Язык', 'Содержимое', 
          'Стандартный', 'Реквизиты', 'Табличная', 'Форма', 'Команда', 'Тип', 'Квалификаторы',
          'Квалификаторы строки', 'Квалификаторы числа', 'Квалификаторы даты'].includes(fieldName)) {
        titleFields.add(fieldName);
    }
}

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

// Находим отсутствующие переводы (только для полей, которые выглядят как названия полей)
const missing = Array.from(titleFields)
    .filter(field => {
        // Исключаем значения enum, которые не являются названиями полей
        const enumValues = ['Auto', 'Create', 'DontCheck', 'DontCreate', 'DontTransform', 'DontUse', 
                           'ShowError', 'ShowWarning', 'TransformValues', 'Use', 'Always', 'DontAutoUpdate',
                           'AutoUpdateUseDefaultLanguage', 'AsDescription', 'AsCode', 'InDialog', 'BothWays',
                           'Allow', 'Deny', 'Managed', 'Automatic', 'AutomaticAndManaged', 'Use', 'DontUse',
                           'Begin', 'Substring', 'Anywhere', 'Background', 'Directly', 'Variable', 'Fixed',
                           'Nonperiodical', 'Year', 'Quarter', 'Month', 'Day', 'Second', 'RecorderPosition',
                           'RecorderSubordinate', 'Independent', 'WriteSelected', 'WriteModified', 'AutoFillOff',
                           'AutoFillOn', 'AutoFillOnWrite', 'HierarchyFoldersAndItems', 'HierarchyItems',
                           'WholeCatalog', 'WithinOwnerSubordination', 'WithinOwnerHierarchy', 'Single', 'Multiple',
                           'PlatformApplication', 'MobilePlatformApplication', 'MobileClient', 'true', 'false'];
        
        // Если это значение enum, не добавляем
        if (enumValues.includes(field)) {
            return false;
        }
        
        // Проверяем, что это не служебное поле
        if (field.length < 3 || field.startsWith('v8:') || field.startsWith('xr:') || field.startsWith('xsi:')) {
            return false;
        }
        
        return !existingKeys.has(field);
    })
    .sort();

console.log(`Всего полей из title в schemas-code.txt: ${titleFields.size}`);
console.log(`Существующих переводов: ${existingKeys.size}`);
console.log(`Отсутствующих переводов (после фильтрации): ${missing.length}\n`);

if (missing.length > 0) {
    console.log('Отсутствующие переводы:');
    missing.forEach(field => console.log(`  ${field}`));
    
    // Сохраняем в файл
    fs.writeFileSync('scripts/missing-schemas-code-translations-refined.json', JSON.stringify(missing, null, 2));
    console.log(`\nСписок сохранен в scripts/missing-schemas-code-translations-refined.json`);
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

fs.writeFileSync('scripts/all-missing-schemas-code-translations.json', JSON.stringify(allMissing, null, 2));
console.log(`Полный список сохранен в scripts/all-missing-schemas-code-translations.json`);
