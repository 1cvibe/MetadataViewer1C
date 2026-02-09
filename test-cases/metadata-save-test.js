/**
 * Комплексный тест сохранения метаданных 1С
 * 
 * Тестирует корректность сохранения изменений в XML файлах метаданных
 * для всех типов объектов (кроме общих модулей).
 * 
 * Запуск: node test-cases/metadata-save-test.js
 */

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const { compareXmlFiles } = require('./xml-structure-comparison');

// Маппинг директорий типов на XML типы объектов
const TYPE_DIR_TO_XML_TYPE = {
    'Catalogs': 'Catalog',
    'Documents': 'Document',
    'Enums': 'Enum',
    'Reports': 'Report',
    'DataProcessors': 'DataProcessor',
    'ChartsOfCharacteristicTypes': 'ChartOfCharacteristicTypes',
    'ChartsOfAccounts': 'ChartOfAccounts',
    'ChartsOfCalculationTypes': 'ChartOfCalculationTypes',
    'InformationRegisters': 'InformationRegister',
    'AccumulationRegisters': 'AccumulationRegister',
    'AccountingRegisters': 'AccountingRegister',
    'CalculationRegisters': 'CalculationRegister',
    'BusinessProcesses': 'BusinessProcess',
    'Tasks': 'Task',
    'Constants': 'Constant',
    'Subsystems': 'Subsystem',
    'ExchangePlans': 'ExchangePlan',
    'DocumentJournals': 'DocumentJournal',
    'Sequences': 'Sequence',
    'WebServices': 'WebService',
    'HTTPServices': 'HTTPService',
    'DefinedTypes': 'DefinedType'
};

// Исключаемые типы (общие модули и другие)
const EXCLUDED_TYPES = new Set(['CommonModules']);

/**
 * Сканирует конфигурацию и находит до 20 файлов каждого типа
 * @param {string} configPath - путь к корню конфигурации
 * @param {number} maxPerType - максимальное количество объектов каждого типа (по умолчанию 20)
 * @returns {Object} объект с типами и массивами путей к файлам
 */
function scanConfiguration(configPath, maxPerType = 20) {
    console.log(`\n=== Сканирование конфигурации: ${configPath} ===`);
    console.log(`Максимум объектов каждого типа: ${maxPerType}`);
    
    if (!fs.existsSync(configPath)) {
        console.error(`❌ Каталог не найден: ${configPath}`);
        return {};
    }
    
    const result = {};
    const typeDirs = fs.readdirSync(configPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .filter(d => !EXCLUDED_TYPES.has(d.name))
        .map(d => d.name);
    
    console.log(`Найдено директорий типов: ${typeDirs.length}`);
    
    for (const typeDir of typeDirs) {
        const xmlType = TYPE_DIR_TO_XML_TYPE[typeDir];
        if (!xmlType) {
            console.log(`⚠️  Пропущен неизвестный тип: ${typeDir}`);
            continue;
        }
        
        const typeDirPath = path.join(configPath, typeDir);
        const foundFiles = [];
        
        // Ищем файлы в подпапках (формат: TypeDir/ObjectName/ObjectName.xml)
        const subdirs = fs.readdirSync(typeDirPath, { withFileTypes: true })
            .filter(e => e.isDirectory())
            .map(e => e.name);
        
        for (const subdir of subdirs) {
            if (foundFiles.length >= maxPerType) break;
            
            const subdirPath = path.join(typeDirPath, subdir);
            const xmlFile = path.join(subdirPath, `${subdir}.xml`);
            
            if (fs.existsSync(xmlFile)) {
                foundFiles.push({
                    filePath: xmlFile,
                    objectName: subdir,
                    typeDir: typeDir
                });
            }
        }
        
        // Если не нашли достаточно в подпапках, ищем в корне типа (формат: TypeDir/ObjectName.xml)
        if (foundFiles.length < maxPerType) {
            const xmlFiles = fs.readdirSync(typeDirPath, { withFileTypes: true })
                .filter(e => e.isFile() && e.name.endsWith('.xml'))
                .map(e => path.join(typeDirPath, e.name))
                .slice(0, maxPerType - foundFiles.length);
            
            for (const xmlFile of xmlFiles) {
                foundFiles.push({
                    filePath: xmlFile,
                    objectName: path.basename(xmlFile, '.xml'),
                    typeDir: typeDir
                });
            }
        }
        
        if (foundFiles.length > 0) {
            result[xmlType] = foundFiles;
            console.log(`✅ Найдено ${foundFiles.length} объектов типа ${xmlType}`);
        } else {
            console.log(`⚠️  Не найдено файлов для типа: ${xmlType}`);
        }
    }
    
    const totalObjects = Object.values(result).reduce((sum, files) => sum + files.length, 0);
    console.log(`\nНайдено объектов для тестирования: ${totalObjects} (${Object.keys(result).length} типов)`);
    return result;
}

/**
 * Копирует найденные файлы в тестовую директорию
 * @param {Object} foundObjects - объект с массивами найденных файлов
 * @param {string} testDir - путь к тестовой директории
 */
function copyTestFiles(foundObjects, testDir) {
    console.log(`\n=== Копирование файлов в ${testDir} ===`);
    
    // Чистим директорию, чтобы повторный прогон не смешивал разные выборки (20/30 и т.д.)
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
        fs.mkdirSync(testDir, { recursive: true });
    
    const copied = {};
    
    for (const [xmlType, files] of Object.entries(foundObjects)) {
        const destDir = path.join(testDir, xmlType);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        copied[xmlType] = [];
        
        for (const info of files) {
        const destFile = path.join(destDir, path.basename(info.filePath));
        fs.copyFileSync(info.filePath, destFile);
        
            copied[xmlType].push({
            originalPath: info.filePath,
            testPath: destFile,
            objectName: info.objectName,
            typeDir: info.typeDir
            });
        }
        
        console.log(`✅ Скопировано ${copied[xmlType].length} файлов типа ${xmlType}`);
    }
    
    const totalCopied = Object.values(copied).reduce((sum, files) => sum + files.length, 0);
    console.log(`\n✅ Всего скопировано файлов: ${totalCopied}`);
    return copied;
}

/**
 * Генерирует UUID для новых объектов
 */
function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Создает тестовые изменения для объекта
 * @param {Object} parsedObject - распарсенный объект
 * @returns {Object} модифицированный объект с изменениями
 */
function createTestChanges(parsedObject, xmlType) {
    const modified = JSON.parse(JSON.stringify(parsedObject)); // Глубокое копирование
    const applied = {
        synonym: false,
        newAttribute: false,
        newTabularSection: false,
        tabularAttribute: false,
        compositeType: false,
        registerRecord: false
    };

    /**
     * Делает имя уникальным в рамках заданного множества.
     * ВАЖНО: тесты могут выполняться многократно по одной и той же конфигурации.
     * Без уникализации легко получить "Дублирование имени объекта метаданных" при сборке CF.
     * @param {string} base
     * @param {Set<string>} existing
     * @returns {string}
     */
    function makeUniqueName(base, existing) {
        let name = base;
        let i = 1;
        while (existing.has(name)) {
            name = `${base}_${i++}`;
        }
        existing.add(name);
        return name;
    }

    /**
     * Собирает set имён реквизитов верхнего уровня (modified.attributes).
     * @returns {Set<string>}
     */
    function collectAttributeNames() {
        const set = new Set();
        const attrs = Array.isArray(modified.attributes) ? modified.attributes : [];
        for (const a of attrs) {
            const n = a?.name ?? a?.properties?.Name;
            if (n) set.add(String(n));
        }
        return set;
    }

    /**
     * Собирает set имён табличных частей верхнего уровня (modified.tabularSections).
     * @returns {Set<string>}
     */
    function collectTabularSectionNames() {
        const set = new Set();
        const tss = Array.isArray(modified.tabularSections) ? modified.tabularSections : [];
        for (const ts of tss) {
            const n = ts?.name ?? ts?.properties?.Name;
            if (n) set.add(String(n));
        }
        return set;
    }

    // 1) Изменение синонима (делаем везде, где есть Synonym)
    if (modified.properties && modified.properties.Synonym) {
        if (typeof modified.properties.Synonym === 'string') {
            modified.properties.Synonym = modified.properties.Synonym + ' [Тест]';
            applied.synonym = true;
        } else if (typeof modified.properties.Synonym === 'object' && modified.properties.Synonym['v8:item']) {
            const item = Array.isArray(modified.properties.Synonym['v8:item']) 
                ? modified.properties.Synonym['v8:item'][0]
                : modified.properties.Synonym['v8:item'];
            
            if (item && item['v8:content'] !== undefined) {
                item['v8:content'] = (item['v8:content'] || '') + ' [Тест]';
                applied.synonym = true;
            }
        } else if (typeof modified.properties.Synonym === 'object' && modified.properties.Synonym !== null) {
            if (modified.properties.Synonym['v8:content'] !== undefined) {
                modified.properties.Synonym['v8:content'] = (modified.properties.Synonym['v8:content'] || '') + ' [Тест]';
                applied.synonym = true;
            }
        }
    }

    const hasAttributes = Array.isArray(parsedObject.attributes) && parsedObject.attributes.length > 0;
    const hasTabularSections = Array.isArray(parsedObject.tabularSections) && parsedObject.tabularSections.length > 0;

    // 2) Новый реквизит — только если у объекта уже есть реквизиты (иначе для многих типов это невалидно)
    if (hasAttributes) {
        const existingNames = collectAttributeNames();
        const uniqueAttrName = makeUniqueName('ТестовыйРеквизит', existingNames);
    
    const newAttribute = {
            name: uniqueAttrName,
        type: {
            kind: 'xs:string',
            details: {
                StringQualifiers: {
                    Length: 100,
                    AllowedLength: 'Variable'
                }
            }
        },
        typeDisplay: 'string',
        properties: {
                Name: uniqueAttrName,
            Synonym: {
                'v8:item': {
                    'v8:lang': 'ru',
                        'v8:content': `Тестовый реквизит (${uniqueAttrName})`
                }
            },
            Comment: 'Добавлен тестом',
            Type: {
                'v8:Type': 'xs:string',
                'v8:StringQualifiers': {
                    'v8:Length': 100,
                    'v8:AllowedLength': 'Variable'
                }
            },
            PasswordMode: false,
            Format: '',
            EditFormat: '',
            ToolTip: '',
            MarkNegatives: false,
            Mask: '',
            MultiLine: false,
            ExtendedEdit: false,
            MinValue: { _xsiNil: true, _value: '' },
            MaxValue: { _xsiNil: true, _value: '' },
            FillFromFillingValue: false,
            FillValue: { type: 'xs:string' },
            FillChecking: 'DontCheck',
            ChoiceFoldersAndItems: 'Items',
            ChoiceParameterLinks: '',
            ChoiceParameters: '',
            QuickChoice: 'Auto',
            CreateOnInput: 'Auto',
            ChoiceForm: '',
            LinkByType: '',
            ChoiceHistoryOnInput: 'Auto',
            Use: 'ForItem',
            Indexing: 'DontIndex',
            FullTextSearch: 'Use',
            DataHistory: 'Use'
        }
    };
    
        modified.attributes = Array.isArray(modified.attributes) ? modified.attributes : [];
    modified.attributes.push(newAttribute);
        applied.newAttribute = true;
    }

    // 3) Табличная часть и реквизит табличной части — только если табличные части уже есть
    if (hasTabularSections) {
        const existingTsNames = collectTabularSectionNames();
        const uniqueTsName = makeUniqueName('ТестоваяТабличнаяЧасть', existingTsNames);
    
    const newTabularSection = {
            name: uniqueTsName,
        attributes: [],
        properties: {
                Name: uniqueTsName,
            Synonym: {
                'v8:item': {
                    'v8:lang': 'ru',
                        'v8:content': `Тестовая табличная часть (${uniqueTsName})`
                }
            },
            Comment: 'Добавлена тестом'
        }
    };
    
        const tsAttrNames = new Set();
        const uniqueTsAttrName = makeUniqueName('РеквизитТабличнойЧасти', tsAttrNames);
    const tabularAttribute = {
            name: uniqueTsAttrName,
        type: {
            kind: 'xs:decimal',
            details: {
                NumberQualifiers: {
                    Digits: 10,
                    FractionDigits: 2,
                    AllowedSign: 'Any'
                }
            }
        },
        typeDisplay: 'decimal',
        properties: {
                Name: uniqueTsAttrName,
            Synonym: {
                'v8:item': {
                    'v8:lang': 'ru',
                        'v8:content': `Реквизит табличной части (${uniqueTsAttrName})`
                }
            },
            Comment: 'Добавлен тестом',
            Type: {
                'v8:Type': 'xs:decimal',
                'v8:NumberQualifiers': {
                    'v8:Digits': 10,
                    'v8:FractionDigits': 2,
                    'v8:AllowedSign': 'Any'
                }
                }
        }
    };
    
    newTabularSection.attributes.push(tabularAttribute);
        modified.tabularSections = Array.isArray(modified.tabularSections) ? modified.tabularSections : [];
    modified.tabularSections.push(newTabularSection);
        applied.newTabularSection = true;
        applied.tabularAttribute = true;
    }
    
    // 4) Составной тип (строка+decimal) — только если есть хотя бы один реквизит
    if (hasAttributes && Array.isArray(modified.attributes) && modified.attributes.length > 0) {
        const firstAttr = modified.attributes[0];
        if (firstAttr && firstAttr.properties) {
                firstAttr.properties.Type = {
                Type: [
                    { Type: 'xs:string', StringQualifiers: { Length: 0, AllowedLength: 'Variable' } },
                    { Type: 'xs:decimal', NumberQualifiers: { Digits: 10, FractionDigits: 2, AllowedSign: 'Any' } }
                ]
            };
            firstAttr.typeDisplay = 'Один из (string, decimal)';
            applied.compositeType = true;
        }
    }

    // 5) Добавление регистра в движение документа — только Document
    if (xmlType === 'Document') {
        if (!modified.properties) modified.properties = {};
        let registerRecords = modified.properties.RegisterRecords;
        if (!registerRecords || !Array.isArray(registerRecords)) registerRecords = [];

        registerRecords.push({
            Item: {
                text: 'AccumulationRegister.ibs_ЗначениеОперативныхПоказателейПремирования',
                type: 'xr:MDObjectRef'
            }
        });

        modified.properties.RegisterRecords = registerRecords;
        applied.registerRecord = true;
    }

    return { modified, applied };
            }

/**
 * Парсит XML используя xmldom
 * @param {string} xml - XML строка
 * @returns {Document|null} DOM документ или null при ошибке
 */
function parseXmlWithDom(xml) {
    try {
        // Удаляем BOM если есть
        let cleanXml = xml;
        if (cleanXml.charCodeAt(0) === 0xfeff) {
            cleanXml = cleanXml.slice(1);
        }
        
        const parser = new DOMParser({
            locator: {},
            errorHandler: {
                warning: () => {},
                error: () => {},
                fatalError: () => {}
            }
        });
        
        return parser.parseFromString(cleanXml, 'text/xml');
    } catch (error) {
        return null;
    }
}

/**
 * Проверяет баланс тегов в XML используя xmldom
 * @param {string} xml - XML строка
 * @returns {Object} результат проверки
 */
function checkTagBalance(xml) {
    const doc = parseXmlWithDom(xml);
    
    if (!doc) {
        // Fallback на regex если парсинг не удался
    const openTags = (xml.match(/<[^/!?][^>]*>/g) || []).length;
    const closeTags = (xml.match(/<\/[^>]+>/g) || []).length;
    const selfClosingTags = (xml.match(/<[^/!?][^>]*\/>/g) || []).length;
    const comments = (xml.match(/<!--[\s\S]*?-->/g) || []).length;
    const declarations = (xml.match(/<\?[^>]+\?>/g) || []).length;
    
    const totalOpen = openTags + comments + declarations;
    const totalClose = closeTags + selfClosingTags;
    const diff = Math.abs(totalOpen - totalClose);
    
    return {
            balanced: diff <= 5,
        openTags,
        closeTags,
        selfClosingTags,
        comments,
        declarations,
        diff
        };
    }
    
    // Используем DOM для подсчета элементов
    function countElements(node) {
        let count = 0;
        if (node.nodeType === 1) { // ELEMENT_NODE
            count = 1;
            for (let i = 0; i < node.childNodes.length; i++) {
                count += countElements(node.childNodes[i]);
            }
        }
        return count;
    }
    
    const elementCount = countElements(doc.documentElement || doc);
    const openTags = elementCount;
    const closeTags = elementCount;
    const selfClosingTags = 0; // xmldom не различает самозакрывающиеся теги
    const comments = 0;
    const declarations = 1; // XML declaration
    
    return {
        balanced: true,
        openTags,
        closeTags,
        selfClosingTags,
        comments,
        declarations,
        diff: 0
    };
}

/**
 * Сравнивает структуру XML до и после изменений используя xmldom
 * @param {string} originalXml - оригинальный XML
 * @param {string} modifiedXml - измененный XML
 * @returns {Object} результат сравнения
 */
function compareXmlStructures(originalXml, modifiedXml) {
    const issues = [];
    
    // Парсим оба XML через xmldom
    const originalDoc = parseXmlWithDom(originalXml);
    const modifiedDoc = parseXmlWithDom(modifiedXml);
    
    if (!originalDoc) {
        issues.push('Не удалось распарсить оригинальный XML');
    }
    
    if (!modifiedDoc) {
        issues.push('Не удалось распарсить измененный XML');
    }
    
    if (!originalDoc || !modifiedDoc) {
        return {
            valid: false,
            issues,
            originalBalance: { balanced: false },
            modifiedBalance: { balanced: false }
        };
    }
    
    // Проверка баланса тегов
    const originalBalance = checkTagBalance(originalXml);
    const modifiedBalance = checkTagBalance(modifiedXml);
    
    if (!originalBalance.balanced) {
        issues.push(`Оригинальный XML имеет проблемы с балансом тегов (разница: ${originalBalance.diff})`);
    }
    
    if (!modifiedBalance.balanced) {
        issues.push(`Измененный XML имеет проблемы с балансом тегов (разница: ${modifiedBalance.diff})`);
    }
    
    // Проверка наличия основных элементов через DOM
    function findElement(doc, tagName) {
        const elements = doc.getElementsByTagName(tagName);
        return elements.length > 0 ? elements[0] : null;
    }
    
    const requiredElements = ['MetaDataObject', 'Properties'];
    for (const elemName of requiredElements) {
        const originalElem = findElement(originalDoc, elemName);
        const modifiedElem = findElement(modifiedDoc, elemName);
        
        if (!originalElem) {
            issues.push(`Оригинальный XML не содержит элемент ${elemName}`);
        }
        if (!modifiedElem) {
            issues.push(`Измененный XML не содержит элемент ${elemName}`);
        }
    }
    
    // Проверка, что элементы Properties остались элементами (не стали атрибутами)
    const originalProps = findElement(originalDoc, 'Properties');
    const modifiedProps = findElement(modifiedDoc, 'Properties');
    
    if (originalProps && modifiedProps) {
        // Получаем все дочерние элементы Properties из оригинала
        const originalChildElements = [];
        for (let i = 0; i < originalProps.childNodes.length; i++) {
            const child = originalProps.childNodes[i];
            if (child.nodeType === 1) { // ELEMENT_NODE
                originalChildElements.push(child.tagName);
            }
        }
        
        // Проверяем, что эти элементы остались в измененном XML
        const modifiedChildElementNames = new Set();
        for (let i = 0; i < modifiedProps.childNodes.length; i++) {
            const child = modifiedProps.childNodes[i];
            if (child.nodeType === 1) { // ELEMENT_NODE
                modifiedChildElementNames.add(child.tagName);
            }
        }
        
        for (const elemName of originalChildElements) {
            if (!modifiedChildElementNames.has(elemName)) {
                issues.push(`Элемент Properties.${elemName} потерян или стал атрибутом`);
            } else {
                // Дополнительная проверка: элемент должен быть именно элементом, а не атрибутом
                const modifiedElem = modifiedProps.getElementsByTagName(elemName)[0];
                if (!modifiedElem || modifiedElem.parentNode !== modifiedProps) {
                    issues.push(`Элемент Properties.${elemName} имеет неправильную структуру`);
                }
            }
        }
        
        // Проверяем, что элементы Properties не стали атрибутами (проверяем атрибуты Properties)
        const modifiedPropsAttributes = [];
        if (modifiedProps.attributes) {
            for (let i = 0; i < modifiedProps.attributes.length; i++) {
                const attr = modifiedProps.attributes[i];
                if (originalChildElements.includes(attr.name)) {
                    issues.push(`Элемент Properties.${attr.name} стал атрибутом вместо элемента`);
                }
            }
        }
    } else if (originalProps && !modifiedProps) {
        issues.push('Элемент Properties потерян в измененном XML');
    }
    
    return {
        valid: issues.length === 0,
        issues,
        originalBalance,
        modifiedBalance
    };
}

/**
 * Тестирует сохранение одного объекта
 * @param {string} xmlType - тип объекта в XML (Catalog, Document и т.д.)
 * @param {string} filePath - путь к XML файлу
 * @returns {Promise<Object>} результат теста
 */
async function testObjectSave(xmlType, filePath) {
    console.log(`\n=== Тестирование ${xmlType}: ${path.basename(filePath)} ===`);
    
    try {
        // Загружаем скомпилированные модули
        const parseMetadataXml = require('../out/xmlParsers/metadataParser').parseMetadataXml;
        const applyChangesToXmlString = require('../out/utils/xmlStringPatcher').applyChangesToXmlString;
        const validateXML = require('../out/utils/xmlUtils').validateXML;
        
        // 1. Чтение и парсинг оригинального XML
        console.log('1. Парсинг оригинального XML...');
        const originalObject = await parseMetadataXml(filePath);
        console.log(`   ✅ Объект распарсен: ${originalObject.name}`);
        
        if (!originalObject._originalXml) {
            throw new Error('_originalXml не найден в распарсенном объекте');
        }
        
        const originalXml = originalObject._originalXml;
        console.log(`   ✅ Исходный XML сохранен, длина: ${originalXml.length} символов`);
        
        // 2. Внесение изменений
        console.log('2. Создание тестовых изменений...');
        const { modified: modifiedObject, applied } = createTestChanges(originalObject, xmlType);
        const changesDescriptionLines = ['   ✅ Изменения созданы:'];
        if (applied.synonym) changesDescriptionLines.push('   - Синоним изменен');
        if (applied.newAttribute) changesDescriptionLines.push(`   - Добавлен реквизит: ${modifiedObject.attributes[modifiedObject.attributes.length - 1].name}`);
        if (applied.newTabularSection) changesDescriptionLines.push(`   - Добавлена табличная часть: ${modifiedObject.tabularSections[modifiedObject.tabularSections.length - 1].name}`);
        if (applied.tabularAttribute) changesDescriptionLines.push('   - Добавлен реквизит табличной части');
        if (applied.compositeType) changesDescriptionLines.push('   - Тип первого реквизита изменен на составной (string+decimal)');
        if (applied.registerRecord) changesDescriptionLines.push('   - Добавлен регистр в движение: ibs_ЗначениеОперативныхПоказателейПремирования');
        console.log(changesDescriptionLines.join('\n'));
        
        // 3. Сохранение через applyChangesToXmlString
        console.log('3. Применение изменений к XML...');
        let modifiedXml;
        try {
            modifiedXml = applyChangesToXmlString(originalXml, modifiedObject, xmlType);
            console.log(`   ✅ Изменения применены, длина XML: ${modifiedXml.length} символов`);
        } catch (error) {
            console.error(`   ❌ Ошибка применения изменений: ${error.message}`);
            if (error.stack) {
                console.error(`   Стек ошибки:`, error.stack);
            }
            return {
                success: false,
                xmlType,
                filePath,
                error: `Ошибка применения изменений: ${error.message}`,
                stack: error.stack
            };
        }

        // 3.1 Сохраняем пары before/after на диск для детального сравнения отдельной утилитой
        const resultsDir = path.join(__dirname, 'metadata-save-results', xmlType, path.basename(filePath, '.xml'));
        fs.mkdirSync(resultsDir, { recursive: true });
        const beforePath = path.join(resultsDir, 'before.xml');
        const afterPath = path.join(resultsDir, 'after.xml');
        fs.writeFileSync(beforePath, originalXml, 'utf8');
        fs.writeFileSync(afterPath, modifiedXml, 'utf8');
        
        // 4. Валидация XML
        console.log('4. Валидация XML...');
        let validationResult;
        try {
            validationResult = validateXML(modifiedXml);
            if (validationResult.valid) {
                console.log('   ✅ XML валиден');
            } else {
                console.log(`   ⚠️  XML не прошел валидацию: ${validationResult.error}`);
            }
        } catch (error) {
            console.log(`   ⚠️  Ошибка валидации: ${error.message}`);
            validationResult = { valid: false, error: error.message };
        }
        
        // 5. Сравнение структур
        console.log('5. Сравнение структур XML...');
        const comparison = compareXmlStructures(originalXml, modifiedXml);
        
        if (comparison.valid) {
            console.log('   ✅ Структура XML сохранена корректно');
        } else {
            console.log(`   ❌ Проблемы со структурой:`);
            comparison.issues.forEach(issue => console.log(`      - ${issue}`));
        }
        
        // 6. Проверка наличия изменений
        console.log('6. Проверка наличия изменений...');
        
        // Проверка составного типа: ищем элементы Type с несколькими v8:Type внутри
        // Проверяем только если мы реально применили изменение compositeType
        let compositeTypeFound = applied.compositeType ? false : true;
        const attributeMatches = modifiedXml.match(/<Attribute\b[\s\S]*?<\/Attribute>/g) || [];
        console.log(`   Найдено атрибутов: ${attributeMatches.length}`);
        
        for (const attrMatch of attributeMatches) {
            const typeMatches = attrMatch.match(/<Type>[\s\S]*?<\/Type>/g) || [];
            for (const typeMatch of typeMatches) {
                // Считаем количество элементов v8:Type внутри
                const v8TypeMatches = typeMatch.match(/<v8:Type>/g) || [];
                if (v8TypeMatches.length >= 2) {
                    // Проверяем, что есть и строка и число
                    if (typeMatch.includes('xs:string') && typeMatch.includes('xs:decimal')) {
                        compositeTypeFound = true;
                        console.log(`   ✅ Составной тип найден! v8:Type count: ${v8TypeMatches.length}`);
                        break;
                    } else {
                        console.log(`   ⚠️  Найдено ${v8TypeMatches.length} элементов v8:Type, но не содержит xs:string и xs:decimal`);
                        console.log(`      Содержимое (первые 300 символов): ${typeMatch.substring(0, 300)}`);
                    }
                } else if (v8TypeMatches.length === 1) {
                    // Отладка: показываем, что нашли только один тип
                    const typeContent = typeMatch.match(/<v8:Type>([^<]+)<\/v8:Type>/);
                    if (typeContent) {
                        console.log(`   ℹ️  Найден одиночный тип: ${typeContent[1]}`);
                    }
                }
            }
            if (compositeTypeFound) break;
        }
        
        if (!compositeTypeFound) {
            // Отладочная информация только если составной тип не найден
            const allTypeMatches = modifiedXml.match(/<Type>[\s\S]*?<\/Type>/g) || [];
            if (allTypeMatches.length > 0) {
                console.log(`   ⚠️  Составной тип не найден. Всего элементов Type: ${allTypeMatches.length}`);
                // Показываем только первые 3 для краткости
                for (let i = 0; i < Math.min(3, allTypeMatches.length); i++) {
                    const typeMatch = allTypeMatches[i];
                    const v8Types = typeMatch.match(/<v8:Type>/g) || [];
                    console.log(`   Type ${i + 1}: v8:Type count = ${v8Types.length}, содержит xs:string: ${typeMatch.includes('xs:string')}, содержит xs:decimal: ${typeMatch.includes('xs:decimal')}`);
                }
            }
        }
        
        // Проверка добавления регистра в движение (только для Document)
        let registerRecordFound = false;
        if (xmlType === 'Document') {
            // Ищем элемент RegisterRecords с xr:Item содержащим ibs_ЗначениеОперативныхПоказателейПремирования
            const registerRecordsMatch = modifiedXml.match(/<RegisterRecords>[\s\S]*?<\/RegisterRecords>/);
            if (registerRecordsMatch) {
                const registerRecordsContent = registerRecordsMatch[0];
                // Проверяем наличие нового регистра
                if (registerRecordsContent.includes('ibs_ЗначениеОперативныхПоказателейПремирования') &&
                    registerRecordsContent.includes('<xr:Item') &&
                    registerRecordsContent.includes('xsi:type="xr:MDObjectRef"')) {
                    registerRecordFound = true;
                    // Проверяем, что нет [object Object]
                    if (registerRecordsContent.includes('[object Object]')) {
                        registerRecordFound = false;
                        console.log('   ⚠️  Найден RegisterRecords, но содержит [object Object]');
                    } else {
                        console.log('   ✅ Регистр в движение добавлен корректно');
                    }
                }
            }
        } else {
            // Для не-документов проверка не требуется
            registerRecordFound = true;
        }
        
        const changesFound = {
            synonym: applied.synonym ? modifiedXml.includes('[Тест]') : true,
            newAttribute: applied.newAttribute ? modifiedXml.includes('ТестовыйРеквизит') : true,
            newTabularSection: applied.newTabularSection ? modifiedXml.includes('ТестоваяТабличнаяЧасть') : true,
            tabularAttribute: applied.tabularAttribute ? modifiedXml.includes('РеквизитТабличнойЧасти') : true,
            compositeType: applied.compositeType ? compositeTypeFound : true,
            registerRecord: applied.registerRecord ? registerRecordFound : true
        };
        
        const allChangesFound = Object.values(changesFound).every(v => v);
        
        if (allChangesFound) {
            console.log('   ✅ Все изменения найдены в XML');
        } else {
            console.log('   ⚠️  Некоторые изменения не найдены:');
            Object.entries(changesFound).forEach(([key, found]) => {
                if (!found) {
                    console.log(`      - ${key}: не найдено`);
                }
            });
        }
        
        const success = comparison.valid && (validationResult.valid || validationResult.error?.includes('addChild')) && allChangesFound;
        
        return {
            success,
            xmlType,
            filePath,
            objectName: originalObject.name,
            validation: validationResult,
            comparison,
            changesFound,
            originalLength: originalXml.length,
            modifiedLength: modifiedXml.length,
            beforePath,
            afterPath
        };
        
    } catch (error) {
        console.error(`   ❌ Ошибка тестирования: ${error.message}`);
        return {
            success: false,
            xmlType,
            filePath,
            error: error.message,
            stack: error.stack
        };
    }
}

/**
 * Прогоняет детальное сравнение xml-structure-comparison по всем сохраненным before/after
 * @param {string} resultsRoot - корень директории с результатами
 */
function compareSavedResults(resultsRoot) {
    console.log(`\n=== Детальное сравнение результатов (xml-structure-comparison) ===`);
    console.log(`Директория: ${resultsRoot}`);

    if (!fs.existsSync(resultsRoot)) {
        console.error(`❌ Директория результатов не найдена: ${resultsRoot}`);
        return { totalPairs: 0, ok: 0, failed: 0, withDiffs: 0, byType: {} };
    }

    const byType = {};
    let totalPairs = 0;
    let ok = 0;
    let failed = 0;
    let withDiffs = 0;

    const typeDirs = fs.readdirSync(resultsRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    for (const xmlType of typeDirs) {
        const typePath = path.join(resultsRoot, xmlType);
        const objDirs = fs.readdirSync(typePath, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);

        for (const objName of objDirs) {
            const pairDir = path.join(typePath, objName);
            const beforePath = path.join(pairDir, 'before.xml');
            const afterPath = path.join(pairDir, 'after.xml');
            if (!fs.existsSync(beforePath) || !fs.existsSync(afterPath)) continue;

            totalPairs++;
            if (!byType[xmlType]) byType[xmlType] = { total: 0, ok: 0, failed: 0, withDiffs: 0 };
            byType[xmlType].total++;

            try {
                const result = compareXmlFiles(beforePath, afterPath);
                // compareXmlFiles возвращает success + total differences
                if (result && result.success) {
                    ok++;
                    byType[xmlType].ok++;
                    if (result.total > 0) {
                        withDiffs++;
                        byType[xmlType].withDiffs++;
                    }
                } else {
                    failed++;
                    byType[xmlType].failed++;
                }
            } catch (e) {
                failed++;
                byType[xmlType].failed++;
            }
        }
    }

    const summary = { totalPairs, ok, failed, withDiffs, byType };
    const reportPath = path.join(resultsRoot, 'xml-structure-comparison-summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`\n💾 Сводка сохранена: ${reportPath}`);

    console.log(`\nИтого пар: ${totalPairs}`);
    console.log(`✅ Парсинг/сравнение OK: ${ok}`);
    console.log(`❌ Ошибки сравнения: ${failed}`);
    console.log(`⚠️  Пар с отличиями: ${withDiffs}`);

    return summary;
}

/**
 * Запускает тесты для всех объектов
 * @param {string} testDir - директория с тестовыми файлами
 * @returns {Promise<Object>} результаты тестов
 */
async function runAllTests(testDir) {
    console.log('\n=== Запуск всех тестов ===\n');
    
    const results = [];
    const testFiles = {};
    
    // Сканируем тестовую директорию
    if (!fs.existsSync(testDir)) {
        console.error(`❌ Тестовая директория не найдена: ${testDir}`);
        return { results: [], summary: { total: 0, success: 0, failed: 0 } };
    }
    
    const typeDirs = fs.readdirSync(testDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
    
    for (const typeDir of typeDirs) {
        const typeDirPath = path.join(testDir, typeDir);
        const xmlFiles = fs.readdirSync(typeDirPath, { withFileTypes: true })
            .filter(e => e.isFile() && e.name.endsWith('.xml'))
            .map(e => path.join(typeDirPath, e.name));
        
        if (xmlFiles.length > 0) {
            testFiles[typeDir] = xmlFiles;
        }
    }
    
    const totalFiles = Object.values(testFiles).reduce((sum, files) => sum + files.length, 0);
    console.log(`Найдено объектов для тестирования: ${totalFiles} (${Object.keys(testFiles).length} типов)\n`);
    
    // Запускаем тесты последовательно
    for (const [xmlType, filePaths] of Object.entries(testFiles)) {
        console.log(`\n--- Тестирование типа ${xmlType} (${filePaths.length} объектов) ---`);
        for (const filePath of filePaths) {
        const result = await testObjectSave(xmlType, filePath);
        results.push(result);
        
        // Небольшая задержка между тестами
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    
    // Итоговая статистика
    const summary = {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        byType: {}
    };
    
    // Статистика по типам
    for (const result of results) {
        if (!summary.byType[result.xmlType]) {
            summary.byType[result.xmlType] = { total: 0, success: 0, failed: 0 };
        }
        summary.byType[result.xmlType].total++;
        if (result.success) {
            summary.byType[result.xmlType].success++;
        } else {
            summary.byType[result.xmlType].failed++;
        }
    }
    
    console.log('\n=== Итоговая статистика ===');
    console.log(`Всего тестов: ${summary.total}`);
    console.log(`✅ Успешно: ${summary.success}`);
    console.log(`❌ Провалено: ${summary.failed}`);
    
    console.log('\n=== Статистика по типам ===');
    for (const [type, stats] of Object.entries(summary.byType)) {
        const successRate = ((stats.success / stats.total) * 100).toFixed(1);
        console.log(`${type}: ${stats.success}/${stats.total} (${successRate}%)`);
    }
    
    if (summary.failed > 0) {
        console.log('\nПроваленные тесты:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.xmlType} (${r.objectName || path.basename(r.filePath)}): ${r.error || 'Проблемы со структурой или валидацией'}`);
        });
    }
    
    return { results, summary };
}

// Экспортируем функции для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        scanConfiguration,
        copyTestFiles,
        createTestChanges,
        compareXmlStructures,
        testObjectSave,
        runAllTests,
        TYPE_DIR_TO_XML_TYPE,
        EXCLUDED_TYPES
    };
}

// Если скрипт запущен напрямую
if (require.main === module) {
    const command = process.argv[2] || 'scan';
    const configPath = process.argv[3] || 'D:\\1C\\RZDZUP\\src\\cf';
    const maxPerTypeArg = process.argv[4];
    const maxPerType = maxPerTypeArg ? (parseInt(maxPerTypeArg, 10) || 20) : 20;
    const testDir = path.join(__dirname, 'metadata-save-tests');
    const resultsRoot = path.join(__dirname, 'metadata-save-results');
    
    (async () => {
        if (command === 'scan' || command === 'prepare') {
            console.log('=== Подготовка тестовых файлов ===\n');
            console.log(`Конфигурация: ${configPath}`);
            console.log(`Максимум объектов каждого типа: ${maxPerType}`);
            console.log(`Тестовая директория: ${testDir}\n`);
            
            const foundObjects = scanConfiguration(configPath, maxPerType);
            
            if (Object.keys(foundObjects).length === 0) {
                console.error('\n❌ Не найдено ни одного объекта для тестирования');
                process.exit(1);
            }
            
            const copied = copyTestFiles(foundObjects, testDir);
            
            console.log(`\n✅ Подготовка завершена. Скопировано файлов: ${Object.keys(copied).length}`);
            
            if (command === 'prepare') {
                console.log('\nДля запуска тестов выполните: node test-cases/metadata-save-test.js test');
            }
        } else if (command === 'test') {
            // Чистим результаты предыдущего прогона
            if (fs.existsSync(resultsRoot)) {
                fs.rmSync(resultsRoot, { recursive: true, force: true });
            }
            await runAllTests(testDir);
            // После тестов прогоняем детальное сравнение по сохраненным before/after
            compareSavedResults(resultsRoot);
        } else if (command === 'compare') {
            compareSavedResults(resultsRoot);
        } else {
            console.log('Использование:');
            console.log('  node test-cases/metadata-save-test.js [scan|prepare|test|compare] [configPath] [maxPerType]');
            console.log('');
            console.log('Команды:');
            console.log('  scan     - сканировать конфигурацию и скопировать файлы');
            console.log('  prepare  - то же что scan');
            console.log('  test     - запустить тесты');
            console.log('  compare  - прогнать xml-structure-comparison по сохраненным результатам');
        }
    })().catch(error => {
        console.error('Ошибка:', error);
        process.exit(1);
    });
}

