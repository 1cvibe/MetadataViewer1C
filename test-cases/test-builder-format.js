/**
 * Тест разных форматов данных для builder
 */

const { createXMLBuilder } = require('../out/utils/xmlUtils');

console.log('=== Тест 1: Простая строка ===');
const test1 = {
    Properties: {
        Name: 'TestName',
        Comment: 'TestComment'
    }
};
const builder1 = createXMLBuilder();
const xml1 = builder1.build({ MetaDataObject: { Constant: { Properties: test1.Properties } } });
console.log(xml1);
console.log('Name как элемент:', xml1.includes('<Name>') && xml1.includes('</Name>'));
console.log('Name как атрибут:', xml1.includes('Name="') || xml1.includes("Name='"));
console.log('');

console.log('=== Тест 2: Объект с text ===');
const test2 = {
    Properties: {
        Name: { text: 'TestName' },
        Comment: { text: 'TestComment' }
    }
};
const builder2 = createXMLBuilder();
const xml2 = builder2.build({ MetaDataObject: { Constant: { Properties: test2.Properties } } });
console.log(xml2);
console.log('Name как элемент:', xml2.includes('<Name>') && xml2.includes('</Name>'));
console.log('Name как атрибут:', xml2.includes('Name="') || xml2.includes("Name='"));
console.log('');

console.log('=== Тест 3: Массив с text ===');
const test3 = {
    Properties: {
        Name: [{ text: 'TestName' }],
        Comment: [{ text: 'TestComment' }]
    }
};
const builder3 = createXMLBuilder();
const xml3 = builder3.build({ MetaDataObject: { Constant: { Properties: test3.Properties } } });
console.log(xml3);
console.log('Name как элемент:', xml3.includes('<Name>') && xml3.includes('</Name>'));
console.log('Name как атрибут:', xml3.includes('Name="') || xml3.includes("Name='"));
console.log('');

console.log('=== Тест 4: С #text ===');
const test4 = {
    Properties: {
        Name: { '#text': 'TestName' },
        Comment: { '#text': 'TestComment' }
    }
};
const builder4 = createXMLBuilder();
const xml4 = builder4.build({ MetaDataObject: { Constant: { Properties: test4.Properties } } });
console.log(xml4);
console.log('Name как элемент:', xml4.includes('<Name>') && xml4.includes('</Name>'));
console.log('Name как атрибут:', xml4.includes('Name="') || xml4.includes("Name='"));

