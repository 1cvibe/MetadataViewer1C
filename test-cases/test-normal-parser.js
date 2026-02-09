/**
 * Тест парсинга с preserveOrder: false и специальной обработкой Properties
 */

const { createXMLParser, createXMLBuilder } = require('../out/utils/xmlUtils');

const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Constant uuid="test">
		<Properties>
			<Name>TestName</Name>
			<Comment>TestComment</Comment>
		</Properties>
	</Constant>
</MetaDataObject>`;

const parser = createXMLParser();
const parsed = parser.parse(testXml);

console.log('Parsed structure:');
console.log(JSON.stringify(parsed, null, 2).substring(0, 1500));

// Проверяем структуру Properties
const properties = parsed?.MetaDataObject?.Constant?.Properties;
console.log('\nProperties структура:');
console.log('Тип:', typeof properties);
console.log('Массив?', Array.isArray(properties));
if (typeof properties === 'object' && properties !== null) {
    console.log('Ключи:', Object.keys(properties));
    console.log('Name:', properties.Name);
    console.log('Comment:', properties.Comment);
}

// Преобразуем Properties в формат { '#text': '...' } для каждого свойства
function convertPropertiesForBuilder(properties) {
    if (!properties || typeof properties !== 'object') return properties;
    
    const result = {};
    for (const [key, value] of Object.entries(properties)) {
        if (key.startsWith('@')) {
            result[key] = value;
        } else if (typeof value === 'string') {
            // Простое текстовое значение - используем формат { '#text': '...' }
            result[key] = { '#text': value };
        } else if (typeof value === 'object' && value !== null) {
            // Сложное значение - рекурсивно обрабатываем
            result[key] = convertPropertiesForBuilder(value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

// Преобразуем Properties
if (parsed?.MetaDataObject?.Constant?.Properties) {
    parsed.MetaDataObject.Constant.Properties = convertPropertiesForBuilder(parsed.MetaDataObject.Constant.Properties);
}

console.log('\nПреобразованный Properties:');
console.log(JSON.stringify(parsed?.MetaDataObject?.Constant?.Properties, null, 2));

// Собираем XML
const builder = createXMLBuilder();
const rebuilt = builder.build(parsed);

console.log('\nRebuilt XML:');
console.log(rebuilt.substring(0, 500));

// Проверяем результат
if (rebuilt.includes('<Properties>') && rebuilt.includes('</Properties>')) {
    console.log('\n✅ Properties остался элементом');
} else {
    console.log('\n❌ Properties стал атрибутом или потерян');
}

if (rebuilt.includes('<Name>') && rebuilt.includes('</Name>')) {
    console.log('✅ Name остался элементом');
} else {
    console.log('❌ Name стал атрибутом или потерян');
}

