/**
 * Тест для проверки редактирования запросов в DCS схеме
 * Проверяет:
 * 1. Автоматическое добавление новых полей при изменении запроса
 * 2. Сохранение существующих полей при редактировании запроса
 * 3. Корректную вставку новых полей после существующих
 */

const fs = require('fs');
const path = require('path');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

// Настройки парсера (упрощенные для тестирования)
const parserOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    allowBooleanAttributes: true,
    parseAttributeValue: false,
    trimValues: false,
    parseTrueNumberOnly: false,
    preserveOrder: false, // Упрощенная структура для тестов
    commentPropName: "#comment"
};

const builderOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    indentBy: "\t",
    suppressEmptyNode: false,
    preserveOrder: false
};

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(builderOptions);

/**
 * Создает тестовую DCS схему с простым запросом
 */
function createTestDcsSchema(queryText, fields = []) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<DataCompositionSchema xmlns="http://v8.1c.ru/8.1/data-composition-system/schema" 
                       xmlns:dcscom="http://v8.1c.ru/8.1/data-composition-system/common" 
                       xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" 
                       xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" 
                       xmlns:v8="http://v8.1c.ru/8.1/data/core" 
                       xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" 
                       xmlns:xs="http://www.w3.org/2001/XMLSchema" 
                       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <dataSource>
        <name>ИсточникДанных1</name>
        <dataSourceType>Local</dataSourceType>
    </dataSource>
    <dataSet xsi:type="DataSetQuery">
        <name>НаборДанных1</name>
        ${fields.map(field => `<field xsi:type="DataSetFieldField">
            <dataPath>${field}</dataPath>
            <field>${field}</field>
        </field>`).join('\n        ')}
        <query>${queryText}</query>
        <autoFillAvailableFields>true</autoFillAvailableFields>
    </dataSet>
</DataCompositionSchema>`;
}

/**
 * Извлекает имена полей из запроса (имитация логики extractFieldNamesFromQuery)
 */
function extractFieldNamesFromQuery(query) {
    const text = String(query || '').trim();
    if (!text) return [];
    
    // Находим индекс последней точки с запятой (разделитель пакетов в 1С)
    const lastSemicolonIndex = text.lastIndexOf(';');
    const lastPackage = lastSemicolonIndex >= 0 
        ? text.substring(lastSemicolonIndex + 1).trim() 
        : text;
    
    if (!lastPackage) return [];
    
    // Находим последний SELECT/ВЫБРАТЬ в пакете
    const selectPattern = /(ВЫБРАТЬ|SELECT)/gi;
    const matches = Array.from(lastPackage.matchAll(selectPattern));
    
    if (matches.length === 0) return [];
    
    // Берем последний SELECT
    let lastSelectIndex = matches[matches.length - 1].index;
    let selectBlock = lastPackage.substring(lastSelectIndex);
    
    // ВАЖНО: Сначала проверяем наличие ПОМЕСТИТЬ во всем блоке SELECT
    // Если есть ПОМЕСТИТЬ, это временная таблица - нужно найти следующий SELECT
    const placeIntoPattern = /ПОМЕСТИТЬ/i;
    const placeIntoMatch = selectBlock.match(placeIntoPattern);
    
    if (placeIntoMatch && placeIntoMatch.index !== undefined) {
        // Обнаружено ПОМЕСТИТЬ - это не финальный SELECT
        // Ищем следующий SELECT после ПОМЕСТИТЬ
        const afterPlaceInto = selectBlock.substring(placeIntoMatch.index);
        const nextSelectMatch = afterPlaceInto.match(/(ВЫБРАТЬ|SELECT)/i);
        
        if (nextSelectMatch && nextSelectMatch.index !== undefined) {
            // Нашли следующий SELECT - рекурсивно обрабатываем
            const nextSelectStart = lastSelectIndex + placeIntoMatch.index + nextSelectMatch.index;
            const remainingQuery = lastPackage.substring(nextSelectStart);
            return extractFieldNamesFromQuery(remainingQuery);
        }
        
        // Нет следующего SELECT после ПОМЕСТИТЬ - возвращаем пустой массив
        return [];
    }
    
    // Нет ПОМЕСТИТЬ - это финальный SELECT
    // Ищем конец списка полей (до FROM/ИЗ)
    const endPattern = /(ИЗ|FROM)/i;
    const endMatch = selectBlock.match(endPattern);
    
    if (!endMatch || !endMatch.index) {
        // Если нет FROM, берем весь оставшийся текст
        selectBlock = selectBlock;
    } else {
        // Обрезаем до FROM/ИЗ
        selectBlock = selectBlock.substring(0, endMatch.index);
    }
    
    const out = [];
    const push = (s) => {
        const v = String(s || '').trim();
        if (v && !out.includes(v)) out.push(v);
    };

    // Извлекаем алиасы полей (КАК/AS) из блока SELECT
    const ruPattern = /КАК\s+([A-Za-zА-Яа-я_][0-9A-Za-zА-Яа-я_]*)/gi;
    const enPattern = /AS\s+([A-Za-z_][0-9A-Za-z_]*)/gi;
    
    const ruMatches = Array.from(selectBlock.matchAll(ruPattern));
    const enMatches = Array.from(selectBlock.matchAll(enPattern));
    
    ruMatches.forEach(m => push(m[1]));
    enMatches.forEach(m => push(m[1]));

    return out;
}

/**
 * Имитация логики handleChangeDataSetQuery
 */
function updateDataSetQuery(dataSetNode, newQuery) {
    if (!dataSetNode) return null;
    
    // Обновляем query
    dataSetNode.query = newQuery;
    
    // Находим текущие поля
    const existingFieldNodes = dataSetNode.field ? (Array.isArray(dataSetNode.field) ? dataSetNode.field : [dataSetNode.field]) : [];
    const existingFieldNames = new Set();
    
    existingFieldNodes.forEach(fieldNode => {
        if (fieldNode['@_xsi:type'] === 'DataSetFieldField') {
            // Используем field (короткое имя) для сравнения с запросом
            // Если field нет, fallback на dataPath
            const fieldName = fieldNode.field || fieldNode.dataPath;
            if (fieldName) {
                existingFieldNames.add(fieldName);
            }
        }
    });

    // Извлекаем поля из нового запроса
    const newFieldNames = extractFieldNamesFromQuery(newQuery);
    
    // Если не удалось извлечь поля, не трогаем существующие
    if (newFieldNames.length === 0) {
        console.log('  ℹ Поля не извлечены из запроса, оставляем существующие');
        return dataSetNode;
    }

    // Находим новые поля (которых нет в существующих)
    const fieldsToAdd = newFieldNames.filter(name => !existingFieldNames.has(name));
    
    if (fieldsToAdd.length === 0) {
        console.log('  ℹ Новых полей не обнаружено');
        return dataSetNode;
    }

    console.log(`  ✓ Добавляем новые поля: ${fieldsToAdd.join(', ')}`);

    // Создаем новые узлы полей
    const newFieldNodes = fieldsToAdd.map(fieldName => ({
        '@_xsi:type': 'DataSetFieldField',
        dataPath: fieldName,
        field: fieldName
    }));

    // Добавляем новые поля к существующим
    if (!dataSetNode.field) {
        dataSetNode.field = [];
    } else if (!Array.isArray(dataSetNode.field)) {
        dataSetNode.field = [dataSetNode.field];
    }
    
    dataSetNode.field = [...dataSetNode.field, ...newFieldNodes];

    return dataSetNode;
}

/**
 * Извлекает dataSet из распарсенного XML (с preserveOrder: false)
 */
function findDataSet(parsed) {
    return parsed?.DataCompositionSchema?.dataSet || null;
}

/**
 * Извлекает список полей из dataSet узла (с preserveOrder: false)
 */
function getFieldsList(dataSetNode) {
    if (!dataSetNode || !dataSetNode.field) return [];
    
    const fields = [];
    const fieldNodes = Array.isArray(dataSetNode.field) ? dataSetNode.field : [dataSetNode.field];
    
    fieldNodes.forEach(fieldNode => {
        if (fieldNode['@_xsi:type'] === 'DataSetFieldField') {
            // Используем field (короткое имя) для сравнения с запросом
            // Если field нет, fallback на dataPath
            const fieldName = fieldNode.field || fieldNode.dataPath;
            if (fieldName) {
                fields.push(fieldName);
            }
        }
    });
    return fields;
}

/**
 * ТЕСТ 1: Добавление нового поля в запрос
 */
function test1_AddNewField() {
    console.log('\n=== ТЕСТ 1: Добавление нового поля в запрос ===');
    
    const initialQuery = `ВЫБРАТЬ
    Поле1 КАК Поле1,
    Поле2 КАК Поле2
ИЗ Справочник.Номенклатура`;

    const updatedQuery = `ВЫБРАТЬ
    Поле1 КАК Поле1,
    Поле2 КАК Поле2,
    Поле3 КАК Поле3
ИЗ Справочник.Номенклатура`;

    const xml = createTestDcsSchema(initialQuery, ['Поле1', 'Поле2']);
    const parsed = parser.parse(xml);
    
    const dataSet = findDataSet(parsed);
    if (!dataSet) {
        console.log('  ❌ FAILED: Не удалось найти dataSet в XML');
        return false;
    }
    
    console.log('  Исходные поля:', getFieldsList(dataSet).join(', '));
    
    // Применяем логику обновления полей (она сама обновит query)
    const updated = updateDataSetQuery(dataSet, updatedQuery);
    
    const finalFields = getFieldsList(updated);
    console.log('  Финальные поля:', finalFields.join(', '));
    
    // Проверка
    const expected = ['Поле1', 'Поле2', 'Поле3'];
    const success = JSON.stringify(finalFields) === JSON.stringify(expected);
    
    if (success) {
        console.log('  ✅ PASSED: Поле3 успешно добавлено');
    } else {
        console.log('  ❌ FAILED: Ожидалось', expected, 'получено', finalFields);
    }
    
    return success;
}

/**
 * ТЕСТ 2: Редактирование середины запроса (не должно удалять поля)
 */
function test2_EditMiddleOfQuery() {
    console.log('\n=== ТЕСТ 2: Редактирование середины запроса ===');
    
    const initialQuery = `ВЫБРАТЬ
    Поле1 КАК Поле1,
    Поле2 КАК Поле2,
    Поле3 КАК Поле3
ИЗ Справочник.Номенклатура`;

    // Добавляем комментарий в середину (regex не найдет все поля)
    const updatedQuery = `ВЫБРАТЬ
    Поле1 КАК Поле1,
    // Комментарий
    Поле2 КАК Поле2,
    Поле3 КАК Поле3
ИЗ Справочник.Номенклатура`;

    const xml = createTestDcsSchema(initialQuery, ['Поле1', 'Поле2', 'Поле3']);
    const parsed = parser.parse(xml);
    
    const dataSet = findDataSet(parsed);
    if (!dataSet) {
        console.log('  ❌ FAILED: Не удалось найти dataSet в XML');
        return false;
    }
    
    console.log('  Исходные поля:', getFieldsList(dataSet).join(', '));
    
    // Применяем логику обновления полей (она сама обновит query)
    const updated = updateDataSetQuery(dataSet, updatedQuery);
    
    const finalFields = getFieldsList(updated);
    console.log('  Финальные поля:', finalFields.join(', '));
    
    // Проверка: все поля должны остаться
    const expected = ['Поле1', 'Поле2', 'Поле3'];
    const success = JSON.stringify(finalFields) === JSON.stringify(expected);
    
    if (success) {
        console.log('  ✅ PASSED: Все поля сохранены при редактировании');
    } else {
        console.log('  ❌ FAILED: Ожидалось', expected, 'получено', finalFields);
    }
    
    return success;
}

/**
 * ТЕСТ 3: Добавление нескольких полей одновременно
 */
function test3_AddMultipleFields() {
    console.log('\n=== ТЕСТ 3: Добавление нескольких полей одновременно ===');
    
    const initialQuery = `ВЫБРАТЬ
    Поле1 КАК Поле1
ИЗ Справочник.Номенклатура`;

    const updatedQuery = `ВЫБРАТЬ
    Поле1 КАК Поле1,
    Поле2 КАК Поле2,
    Поле3 КАК Поле3,
    Поле4 КАК Поле4
ИЗ Справочник.Номенклатура`;

    const xml = createTestDcsSchema(initialQuery, ['Поле1']);
    const parsed = parser.parse(xml);
    
    const dataSet = findDataSet(parsed);
    if (!dataSet) {
        console.log('  ❌ FAILED: Не удалось найти dataSet в XML');
        return false;
    }
    
    console.log('  Исходные поля:', getFieldsList(dataSet).join(', '));
    
    // Применяем логику обновления полей (она сама обновит query)
    const updated = updateDataSetQuery(dataSet, updatedQuery);
    
    const finalFields = getFieldsList(updated);
    console.log('  Финальные поля:', finalFields.join(', '));
    
    // Проверка
    const expected = ['Поле1', 'Поле2', 'Поле3', 'Поле4'];
    const success = JSON.stringify(finalFields) === JSON.stringify(expected);
    
    if (success) {
        console.log('  ✅ PASSED: Все новые поля добавлены');
    } else {
        console.log('  ❌ FAILED: Ожидалось', expected, 'получено', finalFields);
    }
    
    return success;
}

/**
 * ТЕСТ 4: Запрос с несколькими пакетами (через ";")
 */
function test4_MultiPackageQuery() {
    console.log('\n=== ТЕСТ 4: Запрос с несколькими пакетами ===');
    
    const initialQuery = `ВЫБРАТЬ
    Поле1 КАК Поле1
ПОМЕСТИТЬ ВТ_Данные
ИЗ Справочник.Номенклатура;

ВЫБРАТЬ
    ВТ_Данные.Поле1 КАК Поле1,
    ВТ_Данные.Поле2 КАК Поле2
ИЗ ВТ_Данные`;

    const updatedQuery = `ВЫБРАТЬ
    Поле1 КАК Поле1
ПОМЕСТИТЬ ВТ_Данные
ИЗ Справочник.Номенклатура;

ВЫБРАТЬ
    ВТ_Данные.Поле1 КАК Поле1,
    ВТ_Данные.Поле2 КАК Поле2,
    ВТ_Данные.Поле3 КАК Поле3
ИЗ ВТ_Данные`;

    const xml = createTestDcsSchema(initialQuery, ['Поле1', 'Поле2']);
    const parsed = parser.parse(xml);
    
    const dataSet = findDataSet(parsed);
    if (!dataSet) {
        console.log('  ❌ FAILED: Не удалось найти dataSet в XML');
        return false;
    }
    
    console.log('  Исходные поля:', getFieldsList(dataSet).join(', '));
    console.log('  Изменение: добавлено Поле3 в ПОСЛЕДНИЙ пакет запроса');
    
    // Применяем логику обновления полей (она сама обновит query)
    const updated = updateDataSetQuery(dataSet, updatedQuery);
    
    const finalFields = getFieldsList(updated);
    console.log('  Финальные поля:', finalFields.join(', '));
    
    // Проверка: должно добавиться только Поле3 из последнего пакета
    const expected = ['Поле1', 'Поле2', 'Поле3'];
    const success = JSON.stringify(finalFields) === JSON.stringify(expected);
    
    if (success) {
        console.log('  ✅ PASSED: Поле3 добавлено из последнего пакета');
    } else {
        console.log('  ❌ FAILED: Ожидалось', expected, 'получено', finalFields);
    }
    
    return success;
}

/**
 * ТЕСТ 5: Пустой запрос (не должно удалять существующие поля)
 */
function test5_EmptyQuery() {
    console.log('\n=== ТЕСТ 5: Пустой запрос ===');
    
    const initialQuery = `ВЫБРАТЬ
    Поле1 КАК Поле1,
    Поле2 КАК Поле2
ИЗ Справочник.Номенклатура`;

    const updatedQuery = ``;

    const xml = createTestDcsSchema(initialQuery, ['Поле1', 'Поле2']);
    const parsed = parser.parse(xml);
    
    const dataSet = findDataSet(parsed);
    if (!dataSet) {
        console.log('  ❌ FAILED: Не удалось найти dataSet в XML');
        return false;
    }
    
    console.log('  Исходные поля:', getFieldsList(dataSet).join(', '));
    console.log('  Изменение: запрос очищен');
    
    // Применяем логику обновления полей (она сама обновит query)
    const updated = updateDataSetQuery(dataSet, updatedQuery);
    
    const finalFields = getFieldsList(updated);
    console.log('  Финальные поля:', finalFields.join(', '));
    
    // Проверка: поля должны остаться
    const expected = ['Поле1', 'Поле2'];
    const success = JSON.stringify(finalFields) === JSON.stringify(expected);
    
    if (success) {
        console.log('  ✅ PASSED: Поля сохранены при пустом запросе');
    } else {
        console.log('  ❌ FAILED: Ожидалось', expected, 'получено', finalFields);
    }
    
    return success;
}

/**
 * Запуск всех тестов
 */
function runAllTests() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ТЕСТЫ РЕДАКТИРОВАНИЯ ЗАПРОСОВ В DCS СХЕМЕ                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    const results = {
        test1: test1_AddNewField(),
        test2: test2_EditMiddleOfQuery(),
        test3: test3_AddMultipleFields(),
        test4: test4_MultiPackageQuery(),
        test5: test5_EmptyQuery()
    };

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ИТОГИ                                                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    console.log(`\n  Пройдено: ${passed}/${total}`);
    
    Object.entries(results).forEach(([name, success]) => {
        const status = success ? '✅ PASSED' : '❌ FAILED';
        console.log(`  ${status}: ${name}`);
    });

    console.log('\n' + (passed === total ? '🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!' : '⚠️  ЕСТЬ НЕПРОЙДЕННЫЕ ТЕСТЫ'));
    
    process.exit(passed === total ? 0 : 1);
}

// Запуск тестов
if (require.main === module) {
    runAllTests();
}

module.exports = {
    extractFieldNamesFromQuery,
    updateDataSetQuery,
    getFieldsList,
    createTestDcsSchema
};

