/**
 * Скрипт для тестирования round-trip (парсинг → сохранение → сравнение)
 * Проверяет, что структура XML сохраняется идентичной после парсинга и сохранения
 */

const fs = require('fs');
const path = require('path');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

// Настройки парсера и билдера (как в проекте)
const parserOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "text",
    allowBooleanAttributes: true,
    preserveOrder: false
};

const builderOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: "",
    suppressEmptyNode: false,
    format: true,
    indentBy: "\t",
    suppressBooleanAttributes: false,
    processEntities: true,
    preserveOrder: false,
    alwaysCreateTextNode: true
};

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(builderOptions);

/**
 * Нормализует XML для сравнения (удаляет пробелы, приводит к единому формату)
 */
function normalizeXmlForComparison(xml) {
    return xml
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
}

/**
 * Извлекает структуру Properties (атрибуты vs элементы)
 */
function extractPropertiesStructure(xml) {
    const propsMatch = xml.match(/<Properties([^>]*)>([\s\S]*?)<\/Properties>/);
    if (!propsMatch) return null;
    
    const attrs = propsMatch[1]; // Атрибуты Properties
    const content = propsMatch[2]; // Содержимое Properties
    
    const structure = {
        hasAttributes: attrs.trim().length > 0,
        attributes: {},
        elements: {}
    };
    
    // Извлекаем атрибуты
    const attrMatches = attrs.match(/(\w+)="([^"]*)"/g);
    if (attrMatches) {
        attrMatches.forEach(attr => {
            const match = attr.match(/(\w+)="([^"]*)"/);
            if (match) {
                structure.attributes[match[1]] = match[2];
            }
        });
    }
    
    // Извлекаем элементы
    const elementMatches = content.match(/<(\w+)>([^<]*)<\/\1>/g);
    if (elementMatches) {
        elementMatches.forEach(elem => {
            const match = elem.match(/<(\w+)>([^<]*)<\/\1>/);
            if (match) {
                structure.elements[match[1]] = match[2];
            }
        });
    }
    
    return structure;
}

/**
 * Сравнивает две структуры Properties
 */
function compareStructures(original, restored) {
    const issues = [];
    
    // Проверяем атрибуты
    for (const [key, value] of Object.entries(original.attributes || {})) {
        if (!restored.attributes || !(key in restored.attributes)) {
            issues.push(`Атрибут "${key}" потерян (был атрибутом, стал элементом или удален)`);
        } else if (restored.attributes[key] !== value) {
            issues.push(`Значение атрибута "${key}" изменилось: "${value}" → "${restored.attributes[key]}"`);
        }
    }
    
    // Проверяем, что не появились новые атрибуты там, где были элементы
    for (const [key, value] of Object.entries(restored.attributes || {})) {
        if (!original.attributes || !(key in original.attributes)) {
            if (original.elements && key in original.elements) {
                issues.push(`Элемент "${key}" стал атрибутом`);
            }
        }
    }
    
    // Проверяем элементы
    for (const [key, value] of Object.entries(original.elements || {})) {
        if (!restored.elements || !(key in restored.elements)) {
            if (!original.attributes || !(key in original.attributes)) {
                issues.push(`Элемент "${key}" потерян (стал атрибутом или удален)`);
            }
        } else if (restored.elements[key] !== value) {
            issues.push(`Значение элемента "${key}" изменилось: "${value}" → "${restored.elements[key]}"`);
        }
    }
    
    // Проверяем, что не появились новые элементы там, где были атрибуты
    for (const [key, value] of Object.entries(restored.elements || {})) {
        if (!original.elements || !(key in original.elements)) {
            if (original.attributes && key in original.attributes) {
                issues.push(`Атрибут "${key}" стал элементом`);
            }
        }
    }
    
    return issues;
}

/**
 * Тестирует один XML файл
 */
function testXmlFile(filePath) {
    console.log(`\n=== Тестирование: ${path.basename(filePath)} ===`);
    
    try {
        const originalXml = fs.readFileSync(filePath, 'utf8');
        const parsed = parser.parse(originalXml);
        const restoredXml = builder.build(parsed);
        
        // Нормализуем для сравнения
        const normalizedOriginal = normalizeXmlForComparison(originalXml);
        const normalizedRestored = normalizeXmlForComparison(restoredXml);
        
        // Извлекаем структуры Properties
        const originalStructure = extractPropertiesStructure(normalizedOriginal);
        const restoredStructure = extractPropertiesStructure(normalizedRestored);
        
        if (!originalStructure || !restoredStructure) {
            console.log("⚠️  Не удалось извлечь структуру Properties");
            return { success: false, issues: ["Не удалось извлечь структуру"] };
        }
        
        // Сравниваем структуры
        const issues = compareStructures(originalStructure, restoredStructure);
        
        if (issues.length === 0) {
            console.log("✅ Структура сохранена корректно");
            return { success: true, issues: [] };
        } else {
            console.log("❌ Обнаружены проблемы:");
            issues.forEach(issue => console.log(`   - ${issue}`));
            return { success: false, issues };
        }
        
    } catch (error) {
        console.log(`❌ Ошибка: ${error.message}`);
        return { success: false, issues: [error.message] };
    }
}

/**
 * Запускает все тесты
 */
function runTests() {
    const testDir = path.join(__dirname, 'xml-structure-tests');
    const testFiles = fs.readdirSync(testDir)
        .filter(f => f.endsWith('.xml'))
        .map(f => path.join(testDir, f));
    
    console.log(`Найдено тестовых файлов: ${testFiles.length}`);
    
    const results = [];
    for (const file of testFiles) {
        const result = testXmlFile(file);
        results.push({ file: path.basename(file), ...result });
    }
    
    // Итоговая статистика
    console.log('\n=== Итоговая статистика ===');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Успешно: ${successful}`);
    console.log(`Провалено: ${failed}`);
    
    if (failed > 0) {
        console.log('\nПроваленные тесты:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.file}`);
            r.issues.forEach(issue => console.log(`    ${issue}`));
        });
    }
    
    return results;
}

// Запускаем тесты, если скрипт вызван напрямую
if (require.main === module) {
    runTests();
}

module.exports = { testXmlFile, runTests };












