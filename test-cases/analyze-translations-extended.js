/**
 * Скрипт для расширенного анализа объектов метаданных и поиска полей, требующих переводов
 * Берет по 20 объектов каждого типа из E:\DATA1C\RZDZUP\src\cf
 */

const fs = require('fs');
const path = require('path');

// Маппинг директорий на типы метаданных
const typeDirToMetadataType = {
    'InformationRegisters': 'InformationRegister',
    'AccumulationRegisters': 'AccumulationRegister',
    'AccountingRegisters': 'AccountingRegister',
    'CalculationRegisters': 'CalculationRegister',
    'Catalogs': 'Catalog',
    'Documents': 'Document',
    'Enums': 'Enum',
    'Reports': 'Report',
    'DataProcessors': 'DataProcessor',
    'ChartsOfCharacteristicTypes': 'ChartOfCharacteristicTypes',
    'ChartsOfAccounts': 'ChartOfAccounts',
    'ChartsOfCalculationTypes': 'ChartOfCalculationTypes',
    'BusinessProcesses': 'BusinessProcess',
    'Tasks': 'Task',
    'Constants': 'Constant',
    'CommonModules': 'CommonModule',
    'CommonForms': 'CommonForm',
    'ExchangePlans': 'ExchangePlan',
    'DocumentJournals': 'DocumentJournal',
    'WebServices': 'WebService',
    'HTTPServices': 'HTTPService',
    'Subsystems': 'Subsystem',
    'Roles': 'Role',
    'ScheduledJobs': 'ScheduledJob',
    'CommonCommands': 'CommonCommand',
    'CommonTemplates': 'CommonTemplate',
    'CommonPictures': 'CommonPicture',
    'WSReferences': 'WSReference',
    'SettingsStorages': 'SettingsStorage'
};

const SOURCE_PATH = 'E:\\DATA1C\\RZDZUP\\src\\cf';
const OBJECTS_PER_TYPE = 20;

// Загружаем парсер (из скомпилированного кода)
const { parseMetadataXml } = require('../out/xmlParsers/metadataParser');

/**
 * Получает список объектов из директории
 */
function getObjectsFromDirectory(typeDir) {
    const dirPath = path.join(SOURCE_PATH, typeDir);
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .slice(0, OBJECTS_PER_TYPE);
}

/**
 * Находит XML файл объекта
 */
function findObjectXml(typeDir, objectName) {
    const objectDir = path.join(SOURCE_PATH, typeDir, objectName);
    if (!fs.existsSync(objectDir)) {
        return null;
    }
    
    const xmlFile = path.join(objectDir, `${objectName}.xml`);
    if (fs.existsSync(xmlFile)) {
        return xmlFile;
    }
    
    return null;
}

/**
 * Рекурсивно собирает все ключи из объекта
 */
function collectAllKeys(obj, prefix = '', keys = new Set()) {
    if (obj === null || obj === undefined) {
        return keys;
    }
    
    if (Array.isArray(obj)) {
        obj.forEach(item => collectAllKeys(item, prefix, keys));
        return keys;
    }
    
    if (typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            // Убираем префиксы xr:, v8:, cfg:, app:, xsi:
            const cleanKey = key.replace(/^(xr:|v8:|cfg:|app:|xsi:)/, '');
            // Добавляем только ключи, которые выглядят как названия полей (начинаются с заглавной буквы)
            if (cleanKey && /^[A-Z][a-zA-Z0-9_]*$/.test(cleanKey)) {
                keys.add(cleanKey);
            }
            // Продолжаем рекурсию для вложенных объектов
            if (typeof value === 'object' && value !== null) {
                collectAllKeys(value, `${prefix}.${key}`, keys);
            }
        }
    }
    
    return keys;
}

/**
 * Собирает все поля из ParsedMetadataObject
 */
function collectFieldsFromParsed(parsed) {
    const allKeys = new Set();
    
    // Собираем из properties (основные свойства объекта)
    if (parsed.properties && typeof parsed.properties === 'object') {
        for (const key of Object.keys(parsed.properties)) {
            const cleanKey = key.replace(/^(xr:|v8:|cfg:|app:|xsi:)/, '');
            if (cleanKey && /^[A-Z][a-zA-Z0-9_]*$/.test(cleanKey)) {
                allKeys.add(cleanKey);
            }
            // Также рекурсивно собираем из значений
            collectAllKeys(parsed.properties[key], '', allKeys);
        }
    }
    
    // Собираем из attributes
    if (Array.isArray(parsed.attributes)) {
        parsed.attributes.forEach(attr => {
            if (attr.properties && typeof attr.properties === 'object') {
                for (const key of Object.keys(attr.properties)) {
                    const cleanKey = key.replace(/^(xr:|v8:|cfg:|app:|xsi:)/, '');
                    if (cleanKey && /^[A-Z][a-zA-Z0-9_]*$/.test(cleanKey)) {
                        allKeys.add(cleanKey);
                    }
                    collectAllKeys(attr.properties[key], '', allKeys);
                }
            }
        });
    }
    
    // Собираем из tabularSections
    if (Array.isArray(parsed.tabularSections)) {
        parsed.tabularSections.forEach(ts => {
            if (ts.properties && typeof ts.properties === 'object') {
                for (const key of Object.keys(ts.properties)) {
                    const cleanKey = key.replace(/^(xr:|v8:|cfg:|app:|xsi:)/, '');
                    if (cleanKey && /^[A-Z][a-zA-Z0-9_]*$/.test(cleanKey)) {
                        allKeys.add(cleanKey);
                    }
                    collectAllKeys(ts.properties[key], '', allKeys);
                }
            }
            if (Array.isArray(ts.attributes)) {
                ts.attributes.forEach(attr => {
                    if (attr.properties && typeof attr.properties === 'object') {
                        for (const key of Object.keys(attr.properties)) {
                            const cleanKey = key.replace(/^(xr:|v8:|cfg:|app:|xsi:)/, '');
                            if (cleanKey && /^[A-Z][a-zA-Z0-9_]*$/.test(cleanKey)) {
                                allKeys.add(cleanKey);
                            }
                            collectAllKeys(attr.properties[key], '', allKeys);
                        }
                    }
                });
            }
        });
    }
    
    // Собираем из forms
    if (Array.isArray(parsed.forms)) {
        parsed.forms.forEach(form => {
            if (form.properties && typeof form.properties === 'object') {
                for (const key of Object.keys(form.properties)) {
                    const cleanKey = key.replace(/^(xr:|v8:|cfg:|app:|xsi:)/, '');
                    if (cleanKey && /^[A-Z][a-zA-Z0-9_]*$/.test(cleanKey)) {
                        allKeys.add(cleanKey);
                    }
                    collectAllKeys(form.properties[key], '', allKeys);
                }
            }
        });
    }
    
    // Собираем из commands
    if (Array.isArray(parsed.commands)) {
        parsed.commands.forEach(cmd => {
            if (cmd.properties && typeof cmd.properties === 'object') {
                for (const key of Object.keys(cmd.properties)) {
                    const cleanKey = key.replace(/^(xr:|v8:|cfg:|app:|xsi:)/, '');
                    if (cleanKey && /^[A-Z][a-zA-Z0-9_]*$/.test(cleanKey)) {
                        allKeys.add(cleanKey);
                    }
                    collectAllKeys(cmd.properties[key], '', allKeys);
                }
            }
        });
    }
    
    return allKeys;
}

/**
 * Анализирует объект и собирает все поля
 */
async function analyzeObject(typeDir, objectName, objectType) {
    const xmlPath = findObjectXml(typeDir, objectName);
    if (!xmlPath) {
        return new Set();
    }
    
    try {
        const parsed = await parseMetadataXml(xmlPath);
        
        // Отладка: выводим структуру для первого объекта каждого типа
        if (!analyzeObject._debugShown) {
            console.log(`  [DEBUG] Структура parsed для ${objectName}:`, {
                hasProperties: !!parsed.properties,
                propertiesKeys: parsed.properties ? Object.keys(parsed.properties).slice(0, 10) : [],
                attributesCount: Array.isArray(parsed.attributes) ? parsed.attributes.length : 0,
                tabularSectionsCount: Array.isArray(parsed.tabularSections) ? parsed.tabularSections.length : 0,
                formsCount: Array.isArray(parsed.forms) ? parsed.forms.length : 0,
                commandsCount: Array.isArray(parsed.commands) ? parsed.commands.length : 0
            });
            analyzeObject._debugShown = true;
        }
        
        // Собираем все ключи из структурированного объекта
        const allKeys = collectFieldsFromParsed(parsed);
        
        return allKeys;
    } catch (error) {
        console.error(`Ошибка при анализе ${typeDir}/${objectName}: ${error.message}`);
        return new Set();
    }
}

/**
 * Читает существующие переводы из field-values.ts
 */
function getExistingTranslations() {
    const fieldValuesPath = path.join(__dirname, '..', 'src', 'Metadata', 'field-values.ts');
    const content = fs.readFileSync(fieldValuesPath, 'utf8');
    
    const fieldLabelsMatch = content.match(/export const FIELD_LABELS[^=]*=\s*\{([\s\S]*?)\};/);
    if (!fieldLabelsMatch) {
        return new Set();
    }
    
    const fieldLabelsContent = fieldLabelsMatch[1];
    const existingKeys = new Set();
    const labelRegex = /['"]([A-Za-z][A-Za-z0-9_]*)['"]:\s*['"][^'"]+['"]/g;
    let match;
    while ((match = labelRegex.exec(fieldLabelsContent)) !== null) {
        existingKeys.add(match[1]);
    }
    
    return existingKeys;
}

/**
 * Главная функция
 */
async function main() {
    console.log('Начинаю расширенный анализ объектов метаданных...\n');
    
    const allFields = new Set();
    const existingTranslations = getExistingTranslations();
    
    console.log(`Существующих переводов: ${existingTranslations.size}\n`);
    
    // Проходим по всем типам
    for (const [typeDir, objectType] of Object.entries(typeDirToMetadataType)) {
        const objects = getObjectsFromDirectory(typeDir);
        
        if (objects.length === 0) {
            console.log(`Пропуск ${typeDir}: директория не найдена или пуста`);
            continue;
        }
        
        console.log(`Анализ ${typeDir} (${objects.length} объектов)...`);
        
        // Сбрасываем флаг отладки для каждого типа
        analyzeObject._debugShown = false;
        
        let analyzed = 0;
        for (const objectName of objects) {
            const fields = await analyzeObject(typeDir, objectName, objectType);
            fields.forEach(field => allFields.add(field));
            analyzed++;
        }
        
        console.log(`  Проанализировано: ${analyzed}, найдено уникальных полей: ${allFields.size}`);
    }
    
    // Находим отсутствующие переводы
    const missing = Array.from(allFields)
        .filter(field => !existingTranslations.has(field))
        .sort();
    
    console.log(`\nВсего уникальных полей: ${allFields.size}`);
    console.log(`Отсутствующих переводов: ${missing.length}\n`);
    
    // Сохраняем результаты
    const resultsPath = path.join(__dirname, 'translation-analysis-extended.json');
    const results = {
        analysisDate: new Date().toISOString(),
        sourcePath: SOURCE_PATH,
        objectsPerType: OBJECTS_PER_TYPE,
        totalFields: allFields.size,
        existingTranslations: existingTranslations.size,
        missingTranslations: missing.length,
        missingFields: missing,
        allFields: Array.from(allFields).sort()
    };
    
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
    
    console.log('Отсутствующие переводы:');
    missing.forEach(field => console.log(`  ${field}`));
    
    console.log(`\nРезультаты сохранены в: ${resultsPath}`);
}

main().catch(error => {
    console.error('Ошибка:', error);
    process.exit(1);
});
