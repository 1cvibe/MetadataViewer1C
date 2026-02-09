/**
 * Интеграционный тест редактирования запросов на реальных отчетах
 * Берет 10 реальных отчетов из D:\1C\RZDZUP\src\cf\Reports
 * и тестирует логику обновления полей
 */

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

// Импортируем функции из основного теста
const { extractFieldNamesFromQuery, updateDataSetQuery, getFieldsList } = require('./test-dcs-query-editing.js');

const parserOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    allowBooleanAttributes: true,
    parseAttributeValue: false,
    trimValues: false,
    parseTrueNumberOnly: false,
    preserveOrder: false,
    commentPropName: "#comment"
};

const parser = new XMLParser(parserOptions);

/**
 * Находит отчеты с DCS схемами
 */
function findReportsWithDCS(reportsDir, limit = 10) {
    const reports = [];
    
    try {
        const reportDirs = fs.readdirSync(reportsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        for (const reportName of reportDirs) {
            if (reports.length >= limit) break;
            
            const dcsPath = path.join(reportsDir, reportName, 'Templates', 'ОсновнаяСхемаКомпоновкиДанных', 'Ext', 'Template.xml');
            
            if (fs.existsSync(dcsPath)) {
                reports.push({
                    name: reportName,
                    path: dcsPath
                });
            }
        }
    } catch (err) {
        console.error('Ошибка при поиске отчетов:', err.message);
    }
    
    return reports;
}

/**
 * Тестирует DCS схему отчета
 */
function testReportDCS(reportInfo) {
    console.log(`\n=== ${reportInfo.name} ===`);
    
    try {
        // Читаем XML
        const xmlContent = fs.readFileSync(reportInfo.path, 'utf-8');
        const parsed = parser.parse(xmlContent);
        
        // Находим dataSet
        const dataSet = parsed?.DataCompositionSchema?.dataSet;
        
        if (!dataSet) {
            console.log('  ⚠️  Нет dataSet в схеме');
            return { status: 'skipped', reason: 'no_dataset' };
        }
        
        // Проверяем наличие запроса
        const query = dataSet.query;
        if (!query) {
            console.log('  ⚠️  Нет запроса в dataSet');
            return { status: 'skipped', reason: 'no_query' };
        }
        
        // Получаем текущие поля
        const initialFields = getFieldsList(dataSet);
        console.log(`  Исходных полей: ${initialFields.length}`);
        
        if (initialFields.length === 0) {
            console.log('  ⚠️  Нет полей в dataSet');
            return { status: 'skipped', reason: 'no_fields' };
        }
        
        // Извлекаем поля из запроса
        const extractedFields = extractFieldNamesFromQuery(query);
        console.log(`  Извлечено из запроса: ${extractedFields.length} полей`);
        
        if (extractedFields.length === 0) {
            console.log('  ⚠️  Не удалось извлечь поля из запроса (возможно, сложный запрос)');
            return { status: 'skipped', reason: 'extraction_failed' };
        }
        
        // ТЕСТ 1: Имитация редактирования - добавляем пробел в запрос
        const modifiedQuery = query + ' ';
        const testDataSet = JSON.parse(JSON.stringify(dataSet)); // глубокая копия
        
        const updated = updateDataSetQuery(testDataSet, modifiedQuery);
        const finalFields = getFieldsList(updated);
        
        // Проверка: количество полей не должно измениться
        if (finalFields.length !== initialFields.length) {
            console.log(`  ❌ FAILED: Количество полей изменилось (${initialFields.length} → ${finalFields.length})`);
            return { 
                status: 'failed', 
                reason: 'field_count_changed',
                initialCount: initialFields.length,
                finalCount: finalFields.length
            };
        }
        
        // Проверка: все исходные поля должны остаться
        const missingFields = initialFields.filter(f => !finalFields.includes(f));
        if (missingFields.length > 0) {
            console.log(`  ❌ FAILED: Потеряны поля: ${missingFields.join(', ')}`);
            return { 
                status: 'failed', 
                reason: 'fields_lost',
                missingFields
            };
        }
        
        console.log(`  ✅ PASSED: Все ${initialFields.length} полей сохранены`);
        return { 
            status: 'passed',
            fieldCount: initialFields.length,
            extractedCount: extractedFields.length
        };
        
    } catch (err) {
        console.log(`  ❌ ERROR: ${err.message}`);
        return { status: 'error', error: err.message };
    }
}

/**
 * Запуск тестов на реальных отчетах
 */
function runRealReportsTests() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ИНТЕГРАЦИОННЫЙ ТЕСТ НА РЕАЛЬНЫХ ОТЧЕТАХ                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    
    const reportsDir = 'D:\\1C\\RZDZUP\\src\\cf\\Reports';
    
    if (!fs.existsSync(reportsDir)) {
        console.error(`\n❌ Папка не найдена: ${reportsDir}`);
        process.exit(1);
    }
    
    console.log(`\nПоиск отчетов в: ${reportsDir}`);
    
    const reports = findReportsWithDCS(reportsDir, 10);
    
    if (reports.length === 0) {
        console.error('\n❌ Не найдено отчетов с DCS схемами');
        process.exit(1);
    }
    
    console.log(`Найдено отчетов: ${reports.length}`);
    
    // Тестируем каждый отчет
    const results = {};
    reports.forEach(report => {
        results[report.name] = testReportDCS(report);
    });
    
    // Итоги
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ИТОГИ                                                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    
    const passed = Object.values(results).filter(r => r.status === 'passed').length;
    const failed = Object.values(results).filter(r => r.status === 'failed').length;
    const skipped = Object.values(results).filter(r => r.status === 'skipped').length;
    const errors = Object.values(results).filter(r => r.status === 'error').length;
    
    console.log(`\n  Пройдено: ${passed}/${reports.length}`);
    console.log(`  Пропущено: ${skipped}`);
    console.log(`  Ошибок: ${errors + failed}`);
    
    // Детали
    console.log('\n  Детальная статистика:');
    Object.entries(results).forEach(([name, result]) => {
        const statusIcon = {
            'passed': '✅',
            'failed': '❌',
            'skipped': '⚠️',
            'error': '❌'
        }[result.status] || '?';
        
        let details = '';
        if (result.status === 'passed') {
            details = ` (${result.fieldCount} полей)`;
        } else if (result.reason) {
            details = ` (${result.reason})`;
        }
        
        console.log(`  ${statusIcon} ${name}${details}`);
    });
    
    console.log('\n' + (passed === reports.length ? '🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!' : '⚠️  ЕСТЬ НЕПРОЙДЕННЫЕ ТЕСТЫ'));
    
    process.exit(passed === reports.length && errors === 0 && failed === 0 ? 0 : 1);
}

// Запуск
if (require.main === module) {
    runRealReportsTests();
}

module.exports = {
    findReportsWithDCS,
    testReportDCS
};

