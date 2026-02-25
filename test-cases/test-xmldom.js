/**
 * Тест работы с xmldom для сохранения структуры Properties
 */

const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Constant uuid="test">
		<Properties>
			<Name>TestName</Name>
			<Comment>TestComment</Comment>
			<Type>
				<v8:Type>xs:decimal</v8:Type>
			</Type>
		</Properties>
	</Constant>
</MetaDataObject>`;

console.log('=== Тест xmldom ===\n');

// Парсим XML
const parser = new DOMParser();
const doc = parser.parseFromString(testXml, 'text/xml');

// Находим Properties
const propertiesElement = doc.getElementsByTagName('Properties')[0];
if (!propertiesElement) {
    console.error('❌ Properties не найден');
    process.exit(1);
}

console.log('✅ Properties найден');
console.log('Дочерние элементы Properties:', propertiesElement.childNodes.length);

// Проверяем структуру
for (let i = 0; i < propertiesElement.childNodes.length; i++) {
    const child = propertiesElement.childNodes[i];
    if (child.nodeType === 1) { // ELEMENT_NODE
        console.log(`  - ${child.nodeName}: ${child.textContent}`);
    }
}

// Модифицируем Properties (например, изменяем Name)
const nameElement = propertiesElement.getElementsByTagName('Name')[0];
if (nameElement) {
    nameElement.textContent = 'ModifiedName';
    console.log('\n✅ Name изменен на: ModifiedName');
}

// Добавляем новое свойство
const newProperty = doc.createElement('NewProperty');
newProperty.textContent = 'NewValue';
propertiesElement.appendChild(newProperty);
console.log('✅ Добавлено новое свойство NewProperty');

// Сериализуем обратно в XML
const serializer = new XMLSerializer();
const rebuiltXml = serializer.serializeToString(doc);

console.log('\n=== Результат ===');
console.log(rebuiltXml.substring(0, 800));

// Проверяем результат
if (rebuiltXml.includes('<Properties>') && rebuiltXml.includes('</Properties>')) {
    console.log('\n✅ Properties остался элементом');
} else {
    console.log('\n❌ Properties стал атрибутом или потерян');
}

if (rebuiltXml.includes('<Name>') && rebuiltXml.includes('</Name>')) {
    console.log('✅ Name остался элементом');
} else {
    console.log('❌ Name стал атрибутом или потерян');
}

if (rebuiltXml.includes('ModifiedName')) {
    console.log('✅ Изменение Name применено');
} else {
    console.log('❌ Изменение Name не применено');
}

if (rebuiltXml.includes('<NewProperty>')) {
    console.log('✅ Новое свойство добавлено');
} else {
    console.log('❌ Новое свойство не добавлено');
}

