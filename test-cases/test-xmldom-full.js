/**
 * Полный тест xmldom с реальным XML и применением изменений
 */

const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const fs = require('fs');
const path = require('path');

// Читаем реальный XML файл
const xmlPath = path.join(__dirname, 'metadata-save-tests', 'Constant', 'ibs_ГлубинаСообщенийЦНСИ.xml');
if (!fs.existsSync(xmlPath)) {
    console.error('❌ XML файл не найден:', xmlPath);
    process.exit(1);
}

const originalXml = fs.readFileSync(xmlPath, 'utf8');
console.log('=== Тест xmldom с реальным XML ===\n');
console.log('Исходный XML длина:', originalXml.length);

// Парсим XML
const parser = new DOMParser();
const doc = parser.parseFromString(originalXml, 'text/xml');

// Проверяем ошибки парсинга
const parserError = doc.getElementsByTagName('parsererror')[0];
if (parserError) {
    console.error('❌ Ошибка парсинга:', parserError.textContent);
    process.exit(1);
}

console.log('✅ XML успешно распарсен');

// Находим Properties
const propertiesElement = doc.getElementsByTagName('Properties')[0];
if (!propertiesElement) {
    console.error('❌ Properties не найден');
    process.exit(1);
}

console.log('✅ Properties найден');

// Получаем текущие свойства
const nameElement = propertiesElement.getElementsByTagName('Name')[0];
const synonymElement = propertiesElement.getElementsByTagName('Synonym')[0];

console.log('Текущий Name:', nameElement?.textContent || 'не найден');
console.log('Текущий Synonym:', synonymElement?.textContent || 'не найден');

// Применяем изменения
if (nameElement) {
    // Изменяем Name (если нужно)
    // nameElement.textContent = 'ModifiedName';
}

// Добавляем новое свойство (если его нет)
let newProperty = propertiesElement.getElementsByTagName('NewProperty')[0];
if (!newProperty) {
    newProperty = doc.createElement('NewProperty');
    newProperty.textContent = 'NewValue';
    propertiesElement.appendChild(newProperty);
    console.log('✅ Добавлено новое свойство NewProperty');
}

// Проверяем структуру Properties после изменений
console.log('\nСтруктура Properties после изменений:');
for (let i = 0; i < propertiesElement.childNodes.length; i++) {
    const child = propertiesElement.childNodes[i];
    if (child.nodeType === 1) { // ELEMENT_NODE
        const textContent = child.textContent?.trim() || '';
        const preview = textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent;
        console.log(`  - ${child.nodeName}: ${preview}`);
    }
}

// Сериализуем обратно в XML
const serializer = new XMLSerializer();
const rebuiltXml = serializer.serializeToString(doc);

console.log('\n=== Результат ===');
console.log('Длина исходного XML:', originalXml.length);
console.log('Длина пересобранного XML:', rebuiltXml.length);

// Проверяем структуру
const checks = {
    'Properties остался элементом': rebuiltXml.includes('<Properties>') && rebuiltXml.includes('</Properties>'),
    'Name остался элементом': rebuiltXml.includes('<Name>') && rebuiltXml.includes('</Name>'),
    'Synonym остался элементом': rebuiltXml.includes('<Synonym>') && rebuiltXml.includes('</Synonym>'),
    'Type остался элементом': rebuiltXml.includes('<Type>') && rebuiltXml.includes('</Type>'),
    'NewProperty добавлен': rebuiltXml.includes('<NewProperty>'),
    'XML декларация сохранена': rebuiltXml.includes('<?xml version="1.0"'),
    'Namespace сохранен': rebuiltXml.includes('xmlns="http://v8.1c.ru/8.3/MDClasses"')
};

console.log('\n=== Проверки ===');
let allPassed = true;
for (const [check, passed] of Object.entries(checks)) {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${check}`);
    if (!passed) allPassed = false;
}

// Сохраняем результат для проверки
const resultPath = path.join(__dirname, 'metadata-save-tests', 'Constant', 'ibs_ГлубинаСообщенийЦНСИ_xmldom_result.xml');
fs.writeFileSync(resultPath, rebuiltXml, 'utf8');
console.log(`\nРезультат сохранен в: ${resultPath}`);

// Сравниваем структуру Properties
console.log('\n=== Сравнение Properties ===');
const originalDoc = parser.parseFromString(originalXml, 'text/xml');
const originalProperties = originalDoc.getElementsByTagName('Properties')[0];
const rebuiltDoc = parser.parseFromString(rebuiltXml, 'text/xml');
const rebuiltProperties = rebuiltDoc.getElementsByTagName('Properties')[0];

if (originalProperties && rebuiltProperties) {
    const originalChildren = Array.from(originalProperties.childNodes)
        .filter(n => n.nodeType === 1)
        .map(n => n.nodeName);
    const rebuiltChildren = Array.from(rebuiltProperties.childNodes)
        .filter(n => n.nodeType === 1)
        .map(n => n.nodeName);
    
    console.log('Исходные элементы Properties:', originalChildren.length);
    console.log('Пересобранные элементы Properties:', rebuiltChildren.length);
    
    const missing = originalChildren.filter(name => !rebuiltChildren.includes(name));
    const added = rebuiltChildren.filter(name => !originalChildren.includes(name));
    
    if (missing.length > 0) {
        console.log('❌ Потерянные элементы:', missing);
    } else {
        console.log('✅ Все исходные элементы сохранены');
    }
    
    if (added.length > 0) {
        console.log('✅ Добавленные элементы:', added);
    }
}

if (allPassed) {
    console.log('\n✅ Все проверки пройдены!');
} else {
    console.log('\n❌ Некоторые проверки не пройдены');
    process.exit(1);
}

