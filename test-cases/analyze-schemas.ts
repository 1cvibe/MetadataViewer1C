/**
 * Скрипт для анализа XML структуры объектов метаданных 1С
 * и извлечения всех свойств для создания JSON Schema схем
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

interface PropertyInfo {
    name: string;
    types: Set<string>;
    isRequired: boolean;
    isArray: boolean;
    isMultilingual: boolean;
    examples: any[];
    description?: string;
}

interface ObjectTypeAnalysis {
    objectType: string;
    analyzedCount: number;
    properties: Map<string, PropertyInfo>;
    hasAttributes: boolean;
    hasTabularSections: boolean;
    hasForms: boolean;
    hasCommands: boolean;
    hasDimensions: boolean;
    hasResources: boolean;
    hasMeasures: boolean;
    errors: string[];
}

const SOURCE_PATH = 'E:\\DATA1C\\RZDZUP\\src\\cf';

/**
 * Определяет тип значения для JSON Schema
 */
function getValueType(value: any): string {
    if (value === null || value === undefined) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return 'array';
    }
    if (typeof value === 'string') {
        return 'string';
    }
    if (typeof value === 'number') {
        return 'number';
    }
    if (typeof value === 'boolean') {
        return 'boolean';
    }
    if (typeof value === 'object') {
        // Проверяем на многоязычное поле
        if (value['v8:item'] || value['item']) {
            return 'multilingual';
        }
        return 'object';
    }
    return 'unknown';
}

/**
 * Проверяет, является ли значение многоязычным полем
 */
function isMultilingualField(value: any): boolean {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    return !!(value['v8:item'] || value['item']);
}

/**
 * Находит XML файл объекта
 */
function findObjectXml(typeDir: string, objectName: string): string | null {
    // Вариант 1: <TypeDir>/<ObjectName>/<ObjectName>.xml
    const path1 = path.join(SOURCE_PATH, typeDir, objectName, `${objectName}.xml`);
    if (fs.existsSync(path1)) {
        return path1;
    }
    
    // Вариант 2: <TypeDir>/<ObjectName>.xml
    const path2 = path.join(SOURCE_PATH, typeDir, `${objectName}.xml`);
    if (fs.existsSync(path2)) {
        return path2;
    }
    
    return null;
}

/**
 * Анализирует один объект
 */
async function analyzeObject(typeDir: string, objectName: string, objectType: string): Promise<ObjectTypeAnalysis | null> {
    const xmlPath = findObjectXml(typeDir, objectName);
    if (!xmlPath) {
        console.warn(`[analyzeObject] XML файл не найден для ${typeDir}/${objectName}`);
        return null;
    }

    try {
        const parsed = await parseMetadataXml(xmlPath);
        
        const analysis: ObjectTypeAnalysis = {
            objectType: objectType,
            analyzedCount: 1,
            properties: new Map(),
            hasAttributes: parsed.attributes.length > 0,
            hasTabularSections: parsed.tabularSections.length > 0,
            hasForms: parsed.forms.length > 0,
            hasCommands: parsed.commands.length > 0,
            hasDimensions: parsed.attributes.some(a => a.childObjectKind === 'Dimension'),
            hasResources: parsed.attributes.some(a => a.childObjectKind === 'Resource'),
            hasMeasures: false, // Будет определено позже
            errors: []
        };

        // Анализируем свойства
        for (const [key, value] of Object.entries(parsed.properties)) {
            if (!analysis.properties.has(key)) {
                analysis.properties.set(key, {
                    name: key,
                    types: new Set(),
                    isRequired: false,
                    isArray: false,
                    isMultilingual: false,
                    examples: []
                });
            }

            const propInfo = analysis.properties.get(key)!;
            const valueType = getValueType(value);
            
            propInfo.types.add(valueType);
            
            if (Array.isArray(value)) {
                propInfo.isArray = true;
                if (value.length > 0) {
                    const itemType = getValueType(value[0]);
                    propInfo.types.add(`array<${itemType}>`);
                }
            }
            
            if (isMultilingualField(value)) {
                propInfo.isMultilingual = true;
            }
            
            // Сохраняем пример (максимум 3)
            if (propInfo.examples.length < 3) {
                propInfo.examples.push(value);
            }
        }

        return analysis;
    } catch (error: any) {
        console.error(`[analyzeObject] Ошибка при парсинге ${xmlPath}:`, error.message);
        return {
            objectType: objectType,
            analyzedCount: 0,
            properties: new Map(),
            hasAttributes: false,
            hasTabularSections: false,
            hasForms: false,
            hasCommands: false,
            hasDimensions: false,
            hasResources: false,
            hasMeasures: false,
            errors: [error.message]
        };
    }
}

/**
 * Объединяет результаты анализа нескольких объектов одного типа
 */
function mergeAnalyses(analyses: ObjectTypeAnalysis[]): ObjectTypeAnalysis {
    if (analyses.length === 0) {
        throw new Error('Нельзя объединить пустой массив анализов');
    }

    const merged: ObjectTypeAnalysis = {
        objectType: analyses[0].objectType,
        analyzedCount: analyses.reduce((sum, a) => sum + a.analyzedCount, 0),
        properties: new Map(),
        hasAttributes: analyses.some(a => a.hasAttributes),
        hasTabularSections: analyses.some(a => a.hasTabularSections),
        hasForms: analyses.some(a => a.hasForms),
        hasCommands: analyses.some(a => a.hasCommands),
        hasDimensions: analyses.some(a => a.hasDimensions),
        hasResources: analyses.some(a => a.hasResources),
        hasMeasures: analyses.some(a => a.hasMeasures),
        errors: analyses.flatMap(a => a.errors)
    };

    // Объединяем свойства
    for (const analysis of analyses) {
        for (const [key, propInfo] of analysis.properties.entries()) {
            if (!merged.properties.has(key)) {
                merged.properties.set(key, {
                    name: key,
                    types: new Set(),
                    isRequired: propInfo.isRequired,
                    isArray: propInfo.isArray,
                    isMultilingual: propInfo.isMultilingual,
                    examples: []
                });
            }

            const mergedProp = merged.properties.get(key)!;
            
            // Объединяем типы
            for (const type of propInfo.types) {
                mergedProp.types.add(type);
            }
            
            // Объединяем флаги
            mergedProp.isRequired = mergedProp.isRequired || propInfo.isRequired;
            mergedProp.isArray = mergedProp.isArray || propInfo.isArray;
            mergedProp.isMultilingual = mergedProp.isMultilingual || propInfo.isMultilingual;
            
            // Объединяем примеры
            for (const example of propInfo.examples) {
                if (mergedProp.examples.length < 5) {
                    mergedProp.examples.push(example);
                }
            }
        }
    }

    return merged;
}

/**
 * Получает список объектов из директории
 */
function getObjectsFromDirectory(typeDir: string, maxCount: number = 10): string[] {
    const dirPath = path.join(SOURCE_PATH, typeDir);
    if (!fs.existsSync(dirPath)) {
        return [];
    }

    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const objects: string[] = [];

    for (const item of items) {
        if (objects.length >= maxCount) {
            break;
        }

        if (item.isDirectory()) {
            // Вариант 1: <TypeDir>/<ObjectName>/<ObjectName>.xml
            const xmlPath = path.join(dirPath, item.name, `${item.name}.xml`);
            if (fs.existsSync(xmlPath)) {
                objects.push(item.name);
            }
        } else if (item.isFile() && item.name.endsWith('.xml')) {
            // Вариант 2: <TypeDir>/<ObjectName>.xml
            const objectName = item.name.slice(0, -4);
            objects.push(objectName);
        }
    }

    return objects;
}

/**
 * Главная функция анализа
 */
async function main() {
    console.log('[analyze-schemas] Начало анализа схем...');
    
    const results: Record<string, ObjectTypeAnalysis> = {};

    // Список директорий для анализа (исключаем те, для которых уже есть схемы)
    const directoriesToAnalyze = Object.keys(typeDirToMetadataType).filter(dir => {
        const objectType = typeDirToMetadataType[dir];
        // Пропускаем Document, Catalog, Enum, Form - для них уже есть схемы
        return !['Document', 'Catalog', 'Enum'].includes(objectType);
    });

    // Анализируем каждый тип объектов
    for (const typeDir of directoriesToAnalyze) {
        const objectType = typeDirToMetadataType[typeDir];
        
        // Получаем реальные объекты из директории
        const objects = getObjectsFromDirectory(typeDir, 10);
        
        if (objects.length === 0) {
            console.log(`[analyze-schemas] Пропуск ${objectType}: нет объектов в директории ${typeDir}`);
            continue;
        }
        
        console.log(`[analyze-schemas] Анализ типа ${objectType} (${objects.length} объектов из ${typeDir})...`);

        const analyses: ObjectTypeAnalysis[] = [];
        
        for (const objectName of objects) {
            const analysis = await analyzeObject(typeDir, objectName, objectType);
            if (analysis && analysis.analyzedCount > 0) {
                analyses.push(analysis);
            }
        }

        if (analyses.length > 0) {
            results[objectType] = mergeAnalyses(analyses);
            console.log(`[analyze-schemas] ✓ ${objectType}: проанализировано ${results[objectType].analyzedCount} объектов, найдено ${results[objectType].properties.size} свойств`);
        } else {
            console.warn(`[analyze-schemas] ⚠ ${objectType}: не удалось проанализировать ни одного объекта`);
        }
    }

    // Сохраняем результаты
    const outputPath = path.join(__dirname, 'analysis-results.json');
    const output: any = {
        analysisDate: new Date().toISOString(),
        sourcePath: SOURCE_PATH,
        results: {}
    };

    for (const [objectType, analysis] of Object.entries(results)) {
        output.results[objectType] = {
            objectType: analysis.objectType,
            analyzedCount: analysis.analyzedCount,
            properties: Array.from(analysis.properties.values()).map(prop => ({
                name: prop.name,
                types: Array.from(prop.types),
                isRequired: prop.isRequired,
                isArray: prop.isArray,
                isMultilingual: prop.isMultilingual,
                examples: prop.examples
            })),
            hasAttributes: analysis.hasAttributes,
            hasTabularSections: analysis.hasTabularSections,
            hasForms: analysis.hasForms,
            hasCommands: analysis.hasCommands,
            hasDimensions: analysis.hasDimensions,
            hasResources: analysis.hasResources,
            hasMeasures: analysis.hasMeasures,
            errors: analysis.errors
        };
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`[analyze-schemas] Результаты сохранены в ${outputPath}`);
    console.log(`[analyze-schemas] Всего проанализировано типов: ${Object.keys(results).length}`);
}

// Запуск
if (require.main === module) {
    main().catch(error => {
        console.error('[analyze-schemas] Критическая ошибка:', error);
        process.exit(1);
    });
}

export { analyzeObject, mergeAnalyses, ObjectTypeAnalysis, PropertyInfo };
