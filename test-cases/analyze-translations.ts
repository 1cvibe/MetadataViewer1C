/**
 * Скрипт для анализа объектов метаданных и поиска полей, требующих переводов
 * Берет по 20 объектов каждого типа из E:\DATA1C\RZDZUP\src\cf
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseMetadataXml, ParsedMetadataObject } from '../src/xmlParsers/metadataParser';

// Маппинг директорий на типы метаданных
const typeDirToMetadataType: Record<string, string> = {
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
    'ExternalDataSources': 'ExternalDataSource',
    'DefinedTypes': 'DefinedType',
    'ExchangePlans': 'ExchangePlan',
    'DocumentJournals': 'DocumentJournal',
    'Sequences': 'Sequence',
    'DocumentNumerators': 'DocumentNumerator',
    'WebServices': 'WebService',
    'HTTPServices': 'HTTPService',
    'Subsystems': 'Subsystem',
    'Roles': 'Role',
    'SessionParameters': 'SessionParameter',
    'CommonAttributes': 'CommonAttribute',
    'EventSubscriptions': 'EventSubscription',
    'ScheduledJobs': 'ScheduledJob',
    'CommonCommands': 'CommonCommand',
    'CommandGroups': 'CommandGroup',
    'CommonTemplates': 'CommonTemplate',
    'CommonPictures': 'CommonPicture',
    'WSReferences': 'WSReference',
    'Styles': 'Style',
    'StyleItems': 'StyleItem',
    'FilterCriteria': 'FilterCriterion',
    'FunctionalOptions': 'FunctionalOption',
    'FunctionalOptionsParameters': 'FunctionalOptionsParameter',
    'SettingsStorages': 'SettingsStorage'
};

const SOURCE_PATH = 'E:\\DATA1C\\RZDZUP\\src\\cf';
const OBJECTS_PER_TYPE = 20;

/**
 * Получает список объектов из директории
 */
function getObjectsFromDirectory(typeDir: string): string[] {
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
function findObjectXml(typeDir: string, objectName: string): string | null {
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
function collectAllKeys(obj: any, prefix: string = '', keys: Set<string> = new Set()): Set<string> {
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
            if (cleanKey && /^[A-Z][a-zA-Z0-9_]*$/.test(cleanKey)) {
                keys.add(cleanKey);
            }
            collectAllKeys(value, `${prefix}.${key}`, keys);
        }
    }
    
    return keys;
}

/**
 * Анализирует объект и собирает все поля
 */
function analyzeObject(typeDir: string, objectName: string, objectType: string): Set<string> {
    const xmlPath = findObjectXml(typeDir, objectName);
    if (!xmlPath) {
        return new Set();
    }
    
    try {
        const parsed = parseMetadataXml(xmlPath);
        const allKeys = new Set<string>();
        
        // Собираем все ключи из объекта
        collectAllKeys(parsed, '', allKeys);
        
        return allKeys;
    } catch (error) {
        console.error(`Ошибка при анализе ${typeDir}/${objectName}: ${error}`);
        return new Set();
    }
}

/**
 * Читает существующие переводы из field-values.ts
 */
function getExistingTranslations(): Set<string> {
    const fieldValuesPath = path.join(__dirname, '..', 'src', 'Metadata', 'field-values.ts');
    const content = fs.readFileSync(fieldValuesPath, 'utf8');
    
    const fieldLabelsMatch = content.match(/export const FIELD_LABELS[^=]*=\s*\{([\s\S]*?)\};/);
    if (!fieldLabelsMatch) {
        return new Set();
    }
    
    const fieldLabelsContent = fieldLabelsMatch[1];
    const existingKeys = new Set<string>();
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
    console.log('Начинаю анализ объектов метаданных...\n');
    
    const allFields = new Set<string>();
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
        
        let analyzed = 0;
        for (const objectName of objects) {
            const fields = analyzeObject(typeDir, objectName, objectType);
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
    const resultsPath = path.join(__dirname, 'translation-analysis-results.json');
    const results = {
        analysisDate: new Date().toISOString(),
        sourcePath: SOURCE_PATH,
        objectsPerType: OBJECTS_PER_TYPE,
        totalFields: allFields.size,
        existingTranslations: existingTranslations.size,
        missingTranslations: missing.length,
        missingFields: missing
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
