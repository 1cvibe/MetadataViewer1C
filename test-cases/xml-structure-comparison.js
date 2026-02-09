/**
 * Утилита для детального сравнения XML структур
 * Используется для выявления различий между исходным и измененным XML
 */

const fs = require('fs');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const path = require('path');

/**
 * Рекурсивное сравнение элементов XML
 */
function compareElements(elem1, elem2, path = '', differences = []) {
    if (!elem1 && !elem2) return differences;
    if (!elem1) {
        differences.push({
            type: 'missing_in_first',
            path,
            element: elem2.tagName,
            details: `Элемент ${elem2.tagName} отсутствует в первом файле`
        });
        return differences;
    }
    if (!elem2) {
        differences.push({
            type: 'missing_in_second',
            path,
            element: elem1.tagName,
            details: `Элемент ${elem1.tagName} отсутствует во втором файле`
        });
        return differences;
    }

    const currentPath = path ? `${path}/${elem1.tagName}` : elem1.tagName;

    // Сравниваем имена элементов
    if (elem1.tagName !== elem2.tagName) {
        differences.push({
            type: 'tag_name_mismatch',
            path: currentPath,
            first: elem1.tagName,
            second: elem2.tagName
        });
    }

    // Сравниваем атрибуты
    const attrs1 = {};
    const attrs2 = {};
    if (elem1.attributes) {
        for (let i = 0; i < elem1.attributes.length; i++) {
            const attr = elem1.attributes[i];
            attrs1[attr.name] = attr.value;
        }
    }
    if (elem2.attributes) {
        for (let i = 0; i < elem2.attributes.length; i++) {
            const attr = elem2.attributes[i];
            attrs2[attr.name] = attr.value;
        }
    }

    const allAttrNames = new Set([...Object.keys(attrs1), ...Object.keys(attrs2)]);
    for (const attrName of allAttrNames) {
        if (!(attrName in attrs1)) {
            differences.push({
                type: 'attribute_missing_in_first',
                path: currentPath,
                attribute: attrName,
                value: attrs2[attrName]
            });
        } else if (!(attrName in attrs2)) {
            differences.push({
                type: 'attribute_missing_in_second',
                path: currentPath,
                attribute: attrName,
                value: attrs1[attrName]
            });
        } else if (attrs1[attrName] !== attrs2[attrName]) {
            differences.push({
                type: 'attribute_value_mismatch',
                path: currentPath,
                attribute: attrName,
                first: attrs1[attrName],
                second: attrs2[attrName]
            });
        }
    }

    // Сравниваем текстовое содержимое (если элемент не имеет дочерних элементов)
    const children1 = Array.from(elem1.childNodes).filter(n => n.nodeType === 1);
    const children2 = Array.from(elem2.childNodes).filter(n => n.nodeType === 1);
    const text1 = Array.from(elem1.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
    const text2 = Array.from(elem2.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');

    if (children1.length === 0 && children2.length === 0) {
        if (text1 !== text2) {
            differences.push({
                type: 'text_content_mismatch',
                path: currentPath,
                first: text1,
                second: text2
            });
        }
    }

    // Группируем дочерние элементы по имени и индексу
    const childrenMap1 = new Map();
    const childrenMap2 = new Map();

    children1.forEach((child, idx) => {
        const key = `${child.tagName}_${idx}`;
        childrenMap1.set(key, child);
    });

    children2.forEach((child, idx) => {
        const key = `${child.tagName}_${idx}`;
        childrenMap2.set(key, child);
    });

    // Сравниваем дочерние элементы
    const allChildKeys = new Set([...childrenMap1.keys(), ...childrenMap2.keys()]);
    for (const key of allChildKeys) {
        const child1 = childrenMap1.get(key);
        const child2 = childrenMap2.get(key);
        compareElements(child1, child2, currentPath, differences);
    }

    return differences;
}

/**
 * Сравнение XML файлов
 */
function compareXmlFiles(file1Path, file2Path) {
    try {
        const xml1 = fs.readFileSync(file1Path, 'utf8');
        const xml2 = fs.readFileSync(file2Path, 'utf8');

        const parser = new DOMParser();
        const doc1 = parser.parseFromString(xml1, 'text/xml');
        const doc2 = parser.parseFromString(xml2, 'text/xml');

        // Проверяем ошибки парсинга
        const error1 = doc1.getElementsByTagName('parsererror')[0];
        const error2 = doc2.getElementsByTagName('parsererror')[0];
        if (error1) {
            throw new Error(`Ошибка парсинга первого файла: ${error1.textContent}`);
        }
        if (error2) {
            throw new Error(`Ошибка парсинга второго файла: ${error2.textContent}`);
        }

        const root1 = doc1.documentElement;
        const root2 = doc2.documentElement;

        if (!root1 || !root2) {
            throw new Error('Не удалось найти корневой элемент в одном из файлов');
        }

        const differences = compareElements(root1, root2);

        return {
            success: true,
            differences,
            total: differences.length
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            differences: [],
            total: 0
        };
    }
}

/**
 * Детальный анализ различий с группировкой по типам
 */
function analyzeDifferences(differences) {
    const analysis = {
        critical: [],
        warnings: [],
        info: [],
        byType: {}
    };

    differences.forEach(diff => {
        // Группируем по типу
        if (!analysis.byType[diff.type]) {
            analysis.byType[diff.type] = [];
        }
        analysis.byType[diff.type].push(diff);

        // Классифицируем по важности
        const path = diff.path || '';
        const isCritical = 
            diff.type === 'structure_incorrect' ||
            (diff.type === 'structure_change' && (
                path.includes('/Type') ||
                path.includes('/TypeSet') ||
                path.includes('OneOf')
            )) ||
            (diff.type === 'attribute_missing_in_second' && diff.attribute === 'uuid') ||
            (diff.type === 'text_content_mismatch' && path.includes('GeneratedType'));

        if (isCritical) {
            analysis.critical.push(diff);
        } else if (diff.type.includes('missing') || diff.type.includes('mismatch')) {
            analysis.warnings.push(diff);
        } else {
            analysis.info.push(diff);
        }
    });

    return analysis;
}

/**
 * Форматированный вывод результатов сравнения
 */
function printComparisonResults(result, options = {}) {
    const { maxItems = 50, showDetails = true } = options;

    if (!result.success) {
        console.error(`❌ Ошибка при сравнении: ${result.error}`);
        return;
    }

    if (result.total === 0) {
        console.log('✅ Файлы идентичны по структуре.');
        return;
    }

    console.log(`\n📊 Найдено различий: ${result.total}\n`);

    const analysis = analyzeDifferences(result.differences);

    // Выводим критические ошибки
    if (analysis.critical.length > 0) {
        console.log(`\n🔴 КРИТИЧЕСКИЕ ОШИБКИ (${analysis.critical.length}):`);
        analysis.critical.slice(0, maxItems).forEach((diff, idx) => {
            console.log(`\n  ${idx + 1}. ${diff.path || 'Корневой элемент'}`);
            console.log(`     Тип: ${diff.type}`);
            if (diff.element) console.log(`     Элемент: ${diff.element}`);
            if (diff.attribute) console.log(`     Атрибут: ${diff.attribute}`);
            if (diff.first !== undefined) console.log(`     Было: ${diff.first}`);
            if (diff.second !== undefined) console.log(`     Стало: ${diff.second}`);
            if (diff.details) console.log(`     Детали: ${diff.details}`);
        });
        if (analysis.critical.length > maxItems) {
            console.log(`\n     ... и еще ${analysis.critical.length - maxItems} критических ошибок`);
        }
    }

    // Выводим предупреждения
    if (analysis.warnings.length > 0) {
        console.log(`\n⚠️  ПРЕДУПРЕЖДЕНИЯ (${analysis.warnings.length}):`);
        analysis.warnings.slice(0, maxItems).forEach((diff, idx) => {
            console.log(`\n  ${idx + 1}. ${diff.path || 'Корневой элемент'}`);
            console.log(`     Тип: ${diff.type}`);
            if (showDetails) {
                if (diff.element) console.log(`     Элемент: ${diff.element}`);
                if (diff.attribute) console.log(`     Атрибут: ${diff.attribute}`);
                if (diff.first !== undefined) console.log(`     Было: ${diff.first}`);
                if (diff.second !== undefined) console.log(`     Стало: ${diff.second}`);
            }
        });
        if (analysis.warnings.length > maxItems) {
            console.log(`\n     ... и еще ${analysis.warnings.length - maxItems} предупреждений`);
        }
    }

    // Выводим статистику по типам
    if (Object.keys(analysis.byType).length > 0) {
        console.log(`\n📈 СТАТИСТИКА ПО ТИПАМ:`);
        for (const [type, diffs] of Object.entries(analysis.byType)) {
            console.log(`   ${type}: ${diffs.length}`);
        }
    }
}

/**
 * Экспорт результатов в JSON
 */
function exportToJson(result, outputPath) {
    const analysis = analyzeDifferences(result.differences);
    const exportData = {
        timestamp: new Date().toISOString(),
        total: result.total,
        critical: analysis.critical.length,
        warnings: analysis.warnings.length,
        info: analysis.info.length,
        byType: Object.fromEntries(
            Object.entries(analysis.byType).map(([type, diffs]) => [type, diffs.length])
        ),
        differences: result.differences,
        analysis: {
            critical: analysis.critical,
            warnings: analysis.warnings,
            info: analysis.info
        }
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf8');
    console.log(`\n💾 Результаты экспортированы в: ${outputPath}`);
}

// Если скрипт запущен напрямую
if (require.main === module) {
    const args = process.argv.slice(2);
    const file1 = args[0] || 'Untitled-1.xml';
    const file2 = args[1] || 'Untitled-2.xml';
    const exportPath = args[2]; // Опциональный путь для экспорта JSON

    console.log(`\n🔍 Сравнение XML файлов:`);
    console.log(`   Файл 1: ${file1}`);
    console.log(`   Файл 2: ${file2}\n`);

    const result = compareXmlFiles(file1, file2);
    printComparisonResults(result, { maxItems: 20, showDetails: true });

    if (exportPath && result.success) {
        exportToJson(result, exportPath);
    }

    // Возвращаем код выхода в зависимости от результата
    process.exit(result.success && result.total === 0 ? 0 : 1);
}

module.exports = {
    compareXmlFiles,
    compareElements,
    analyzeDifferences,
    printComparisonResults,
    exportToJson
};

