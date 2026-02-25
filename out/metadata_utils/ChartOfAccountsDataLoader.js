"use strict";
/**
 * Модуль для загрузки данных из XML объекта плана счетов
 * Используется для получения признаков учета, признаков учета по субконто и видов субконто
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPredefinedDimensionTypes = exports.getExtDimensionTypes = exports.getExtDimensionAccountingFlags = exports.getAccountingFlags = exports.loadChartOfAccountsMetadata = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const xmldom_1 = require("@xmldom/xmldom");
const fileUtils_1 = require("../utils/fileUtils");
const predefinedParser_1 = require("../xmlParsers/predefinedParser");
/**
 * Загружает XML объект плана счетов и извлекает метаданные
 *
 * @param configRoot - корневой путь конфигурации
 * @param objectName - имя объекта плана счетов
 * @returns метаданные плана счетов
 */
async function loadChartOfAccountsMetadata(configRoot, objectName) {
    // Путь к XML файлу объекта плана счетов
    // Пробуем два варианта:
    // 1. ChartsOfAccounts/Управленческий/Управленческий.xml (с подпапкой)
    // 2. ChartsOfAccounts/Управленческий.xml (без подпапки)
    const primaryPath = path.join(configRoot, 'ChartsOfAccounts', objectName, `${objectName}.xml`);
    const alternativePath = path.join(configRoot, 'ChartsOfAccounts', `${objectName}.xml`);
    console.log(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] configRoot: ${configRoot}`);
    console.log(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] objectName: ${objectName}`);
    console.log(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] Проверка пути 1: ${primaryPath}`);
    console.log(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] Проверка пути 2: ${alternativePath}`);
    let objectXmlPath;
    if (fs.existsSync(primaryPath)) {
        objectXmlPath = primaryPath;
        console.log(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] Файл найден по основному пути: ${objectXmlPath}`);
    }
    else if (fs.existsSync(alternativePath)) {
        objectXmlPath = alternativePath;
        console.log(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] Файл найден по альтернативному пути: ${objectXmlPath}`);
    }
    else {
        console.warn(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] Файл не найден ни по пути: ${primaryPath}, ни по пути: ${alternativePath}`);
        return {
            accountingFlags: [],
            extDimensionAccountingFlags: [],
            dimensionTypes: []
        };
    }
    try {
        const xml = await (0, fileUtils_1.safeReadFile)(objectXmlPath);
        console.log(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] XML файл прочитан, размер: ${xml.length} символов`);
        const accountingFlags = getAccountingFlags(xml);
        console.log(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] Найдено признаков учета: ${accountingFlags.length}`);
        const extDimensionAccountingFlags = getExtDimensionAccountingFlags(xml);
        console.log(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] Найдено признаков учета по субконто: ${extDimensionAccountingFlags.length}`);
        const dimensionTypes = await getExtDimensionTypes(configRoot, xml);
        console.log(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] Найдено видов субконто: ${dimensionTypes.length}`);
        // Подсчитываем общее количество предопределенных элементов
        const totalPredefinedItems = dimensionTypes.reduce((sum, dt) => sum + dt.predefinedItems.length, 0);
        console.log(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] Всего предопределенных элементов: ${totalPredefinedItems}`);
        return {
            accountingFlags,
            extDimensionAccountingFlags,
            dimensionTypes
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] Ошибка загрузки метаданных: ${errorMessage}`);
        if (error instanceof Error && error.stack) {
            console.error(`[ChartOfAccountsDataLoader.loadChartOfAccountsMetadata] Stack: ${error.stack}`);
        }
        return {
            accountingFlags: [],
            extDimensionAccountingFlags: [],
            dimensionTypes: []
        };
    }
}
exports.loadChartOfAccountsMetadata = loadChartOfAccountsMetadata;
/**
 * Извлекает список признаков учета из XML объекта плана счетов
 *
 * @param metadataXml - XML строка объекта плана счетов
 * @returns список имен признаков учета
 */
function getAccountingFlags(metadataXml) {
    try {
        const parser = new xmldom_1.DOMParser({
            locator: {},
            errorHandler: {
                warning: (w) => console.warn('[xmldom] Warning:', w),
                error: (e) => console.error('[xmldom] Error:', e),
                fatalError: (e) => {
                    console.error('[xmldom] Fatal error:', e);
                    throw new Error(`XML parsing error: ${e}`);
                }
            }
        });
        const doc = parser.parseFromString(metadataXml, 'text/xml');
        // Проверяем ошибки парсинга
        const parserError = doc.getElementsByTagName('parsererror')[0];
        if (parserError) {
            console.warn('[ChartOfAccountsDataLoader.getAccountingFlags] Ошибка парсинга XML');
            return [];
        }
        const flags = [];
        // Ищем все элементы AccountingFlag в ChildObjects
        const childObjects = doc.getElementsByTagName('ChildObjects')[0];
        if (!childObjects) {
            return [];
        }
        const accountingFlags = childObjects.getElementsByTagName('AccountingFlag');
        for (let i = 0; i < accountingFlags.length; i++) {
            const flag = accountingFlags[i];
            // Ищем элемент Name в Properties
            const properties = flag.getElementsByTagName('Properties')[0];
            if (properties) {
                const nameElement = properties.getElementsByTagName('Name')[0];
                if (nameElement && nameElement.textContent) {
                    flags.push(nameElement.textContent.trim());
                }
            }
        }
        return flags;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[ChartOfAccountsDataLoader.getAccountingFlags] Ошибка: ${errorMessage}`);
        return [];
    }
}
exports.getAccountingFlags = getAccountingFlags;
/**
 * Извлекает список признаков учета по субконто из XML объекта плана счетов
 *
 * @param metadataXml - XML строка объекта плана счетов
 * @returns список имен признаков учета по субконто
 */
function getExtDimensionAccountingFlags(metadataXml) {
    try {
        const parser = new xmldom_1.DOMParser({
            locator: {},
            errorHandler: {
                warning: (w) => console.warn('[xmldom] Warning:', w),
                error: (e) => console.error('[xmldom] Error:', e),
                fatalError: (e) => {
                    console.error('[xmldom] Fatal error:', e);
                    throw new Error(`XML parsing error: ${e}`);
                }
            }
        });
        const doc = parser.parseFromString(metadataXml, 'text/xml');
        // Проверяем ошибки парсинга
        const parserError = doc.getElementsByTagName('parsererror')[0];
        if (parserError) {
            console.warn('[ChartOfAccountsDataLoader.getExtDimensionAccountingFlags] Ошибка парсинга XML');
            return [];
        }
        const flags = [];
        // Ищем все элементы ExtDimensionAccountingFlag в ChildObjects
        const childObjects = doc.getElementsByTagName('ChildObjects')[0];
        if (!childObjects) {
            return [];
        }
        const extDimensionAccountingFlags = childObjects.getElementsByTagName('ExtDimensionAccountingFlag');
        for (let i = 0; i < extDimensionAccountingFlags.length; i++) {
            const flag = extDimensionAccountingFlags[i];
            // Ищем элемент Name в Properties
            const properties = flag.getElementsByTagName('Properties')[0];
            if (properties) {
                const nameElement = properties.getElementsByTagName('Name')[0];
                if (nameElement && nameElement.textContent) {
                    flags.push(nameElement.textContent.trim());
                }
            }
        }
        return flags;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[ChartOfAccountsDataLoader.getExtDimensionAccountingFlags] Ошибка: ${errorMessage}`);
        return [];
    }
}
exports.getExtDimensionAccountingFlags = getExtDimensionAccountingFlags;
/**
 * Извлекает виды субконто из XML объекта плана счетов
 * и загружает предопределенные элементы из соответствующих планов видов характеристик
 *
 * @param configRoot - корневой путь конфигурации
 * @param metadataXml - XML строка объекта плана счетов
 * @returns список видов субконто с предопределенными элементами
 */
async function getExtDimensionTypes(configRoot, metadataXml) {
    try {
        const parser = new xmldom_1.DOMParser({
            locator: {},
            errorHandler: {
                warning: (w) => console.warn('[xmldom] Warning:', w),
                error: (e) => console.error('[xmldom] Error:', e),
                fatalError: (e) => {
                    console.error('[xmldom] Fatal error:', e);
                    throw new Error(`XML parsing error: ${e}`);
                }
            }
        });
        const doc = parser.parseFromString(metadataXml, 'text/xml');
        // Проверяем ошибки парсинга
        const parserError = doc.getElementsByTagName('parsererror')[0];
        if (parserError) {
            console.warn('[ChartOfAccountsDataLoader.getExtDimensionTypes] Ошибка парсинга XML');
            return [];
        }
        const dimensionTypes = [];
        // Ищем элемент ExtDimensionTypes в документе (не в ChildObjects, а на верхнем уровне)
        const extDimensionTypesElements = doc.getElementsByTagName('ExtDimensionTypes');
        console.log(`[ChartOfAccountsDataLoader.getExtDimensionTypes] Найдено элементов ExtDimensionTypes: ${extDimensionTypesElements.length}`);
        for (let i = 0; i < extDimensionTypesElements.length; i++) {
            const extDimensionTypesElement = extDimensionTypesElements[i];
            const textContent = extDimensionTypesElement.textContent?.trim();
            if (!textContent) {
                console.warn(`[ChartOfAccountsDataLoader.getExtDimensionTypes] ExtDimensionTypes[${i}] не имеет текстового содержимого`);
                continue;
            }
            console.log(`[ChartOfAccountsDataLoader.getExtDimensionTypes] ExtDimensionTypes[${i}] содержимое: ${textContent}`);
            // Парсим ссылку на план видов характеристик
            // Формат: "ChartOfCharacteristicTypes.ВидыСубконто"
            const parts = textContent.split('.');
            if (parts.length < 2) {
                console.warn(`[ChartOfAccountsDataLoader.getExtDimensionTypes] Неверный формат ссылки: ${textContent}`);
                continue;
            }
            const objectType = parts[0]; // "ChartOfCharacteristicTypes"
            const objectName = parts.slice(1).join('.'); // "ВидыСубконто"
            console.log(`[ChartOfAccountsDataLoader.getExtDimensionTypes] Разобрано: objectType=${objectType}, objectName=${objectName}`);
            // Проверяем, что это действительно план видов характеристик
            if (objectType !== 'ChartOfCharacteristicTypes') {
                console.warn(`[ChartOfAccountsDataLoader.getExtDimensionTypes] Неожиданный тип объекта: ${objectType}, ожидался ChartOfCharacteristicTypes`);
                continue;
            }
            // Загружаем предопределенные элементы из плана видов характеристик
            console.log(`[ChartOfAccountsDataLoader.getExtDimensionTypes] Загрузка предопределенных элементов для: ${objectName}`);
            const predefinedItems = await loadPredefinedDimensionTypes(configRoot, objectName);
            console.log(`[ChartOfAccountsDataLoader.getExtDimensionTypes] Загружено предопределенных элементов: ${predefinedItems.length}`);
            dimensionTypes.push({
                name: objectName,
                chartOfCharacteristicTypesName: objectName,
                predefinedItems
            });
        }
        return dimensionTypes;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[ChartOfAccountsDataLoader.getExtDimensionTypes] Ошибка: ${errorMessage}`);
        return [];
    }
}
exports.getExtDimensionTypes = getExtDimensionTypes;
/**
 * Загружает предопределенные элементы из плана видов характеристик
 *
 * @param configRoot - корневой путь конфигурации
 * @param chartOfCharacteristicTypesName - имя плана видов характеристик
 * @returns список имен предопределенных элементов
 */
async function loadPredefinedDimensionTypes(configRoot, chartOfCharacteristicTypesName) {
    try {
        // Путь к Predefined.xml плана видов характеристик
        const predefinedPath = path.join(configRoot, 'ChartsOfCharacteristicTypes', chartOfCharacteristicTypesName, 'Ext', 'Predefined.xml');
        console.log(`[ChartOfAccountsDataLoader.loadPredefinedDimensionTypes] Путь к Predefined.xml: ${predefinedPath}`);
        if (!fs.existsSync(predefinedPath)) {
            console.warn(`[ChartOfAccountsDataLoader.loadPredefinedDimensionTypes] Predefined.xml не найден: ${predefinedPath}`);
            return [];
        }
        const parsed = await (0, predefinedParser_1.parsePredefinedXmlWithDom)(predefinedPath);
        console.log(`[ChartOfAccountsDataLoader.loadPredefinedDimensionTypes] Парсинг завершен, элементов верхнего уровня: ${parsed.items.length}`);
        // Извлекаем имена всех элементов (включая вложенные)
        const items = [];
        const extractItems = (itemList) => {
            for (const item of itemList) {
                if (item.Name) {
                    items.push(item.Name);
                    console.log(`[ChartOfAccountsDataLoader.loadPredefinedDimensionTypes] Добавлен элемент: ${item.Name}`);
                }
                if (item.ChildItems && item.ChildItems.Item) {
                    const childItems = Array.isArray(item.ChildItems.Item)
                        ? item.ChildItems.Item
                        : [item.ChildItems.Item];
                    extractItems(childItems);
                }
            }
        };
        extractItems(parsed.items);
        console.log(`[ChartOfAccountsDataLoader.loadPredefinedDimensionTypes] Всего извлечено элементов: ${items.length}`);
        return items;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[ChartOfAccountsDataLoader.loadPredefinedDimensionTypes] Ошибка: ${errorMessage}`);
        if (error instanceof Error && error.stack) {
            console.error(`[ChartOfAccountsDataLoader.loadPredefinedDimensionTypes] Stack: ${error.stack}`);
        }
        return [];
    }
}
exports.loadPredefinedDimensionTypes = loadPredefinedDimensionTypes;
//# sourceMappingURL=ChartOfAccountsDataLoader.js.map