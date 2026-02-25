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
    'ru', 'en', 'uk', 'kz'
]);

// Служебные поля, которые не требуют переводов
const serviceFields = new Set([
    'Name', 'Synonym', 'Comment', 'UseStandardCommands', 'Type', 'Properties', 
    'ChildObjects', 'MetaDataObject', 'v8', 'xr', 'xsi', 'OneOf', 'TypeSet',
    'Items', 'Required', 'Default', 'Description', 'Enum'
]);

// 1. Извлекаем все ключи свойств из схем (названия полей в properties)
const propertyFields = new Set();
const propertyRegex = /"([A-Z][a-zA-Z0-9]+)":\s*\{/g;
while ((match = propertyRegex.exec(schemasCode)) !== null) {
    const fieldName = match[1];
    if (!serviceFields.has(fieldName) && !enumValues.has(fieldName)) {
        propertyFields.add(fieldName);
    }
}

// 2. Извлекаем поля из title (только английские названия)
const titleFields = new Set();
const titleRegex = /"title":\s*"([A-Z][a-zA-Z0-9]+)"/g;
while ((match = titleRegex.exec(schemasCode)) !== null) {
    const fieldName = match[1];
    if (!serviceFields.has(fieldName) && !enumValues.has(fieldName)) {
        titleFields.add(fieldName);
    }
}

// 3. Извлекаем поля с префиксами xr:, v8: и т.д. (убираем префиксы)
const prefixedFields = new Set();
const prefixedRegex = /"(xr:|v8:|cfg:|app:)([A-Z][a-zA-Z0-9]+)":/g;
while ((match = prefixedRegex.exec(schemasCode)) !== null) {
    const fieldName = match[2]; // Берем имя без префикса
    if (!serviceFields.has(fieldName) && !enumValues.has(fieldName)) {
        prefixedFields.add(fieldName);
    }
}

// 4. Извлекаем стандартные атрибуты из enum
const standardAttributesFromEnum = new Set();
const standardAttrEnumRegex = /"enum":\s*\[[^\]]*"Posted"[^\]]*\]/s;
if (standardAttrEnumRegex.test(schemasCode)) {
    // Ищем enum со стандартными атрибутами
    const enumMatch = schemasCode.match(/"enum":\s*\[([^\]]+)\]/);
    if (enumMatch) {
        const enumContent = enumMatch[1];
        const standardAttrs = ['Posted', 'Ref', 'DeletionMark', 'Date', 'Number', 'Owner', 
                               'Parent', 'Code', 'Description', 'Predefined', 'Level', 
                               'IsFolder', 'DataVersion', 'LockedByDBMS', 'WriteMode', 'ReadOnly'];
        standardAttrs.forEach(attr => {
            if (enumContent.includes(`"${attr}"`)) {
                standardAttributesFromEnum.add(attr);
            }
        });
    }
}

// Объединяем все поля
const allFields = new Set([...propertyFields, ...titleFields, ...prefixedFields, ...standardAttributesFromEnum]);

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

console.log(`Анализ всех элементов из schemas-code.txt:\n`);
console.log(`Всего полей:`);
console.log(`  - Из properties: ${propertyFields.size}`);
console.log(`  - Из title: ${titleFields.size}`);
console.log(`  - С префиксами (xr:, v8: и т.д.): ${prefixedFields.size}`);
console.log(`  - Стандартные атрибуты из enum: ${standardAttributesFromEnum.size}`);
console.log(`  - Всего уникальных: ${allFields.size}`);
console.log(`Существующих переводов: ${existingKeys.size}`);
console.log(`Отсутствующих переводов (после фильтрации): ${missing.length}\n`);

if (missing.length > 0) {
    console.log('Отсутствующие переводы:');
    missing.forEach(field => console.log(`  ${field}`));
    
    // Сохраняем в файл
    fs.writeFileSync('scripts/missing-all-elements-translations.json', JSON.stringify(missing, null, 2));
    console.log(`\nСписок сохранен в scripts/missing-all-elements-translations.json`);
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
    fs.writeFileSync('scripts/all-missing-elements-translations.json', JSON.stringify(allMissing, null, 2));
    console.log(`Полный список сохранен в scripts/all-missing-elements-translations.json`);
    
    // Группируем по категориям
    const standardAttrsMissing = allMissing.filter(f => standardAttributes.includes(f));
    const otherMissing = allMissing.filter(f => !standardAttributes.includes(f));
    
    console.log(`\nРазбивка:`);
    console.log(`  - Стандартные атрибуты: ${standardAttrsMissing.length}`);
    console.log(`  - Другие поля: ${otherMissing.length}`);
}
