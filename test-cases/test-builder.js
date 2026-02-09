/**
 * Тест работы XML builder
 */

const { createXMLBuilder, createPreserveOrderParser } = require('../out/utils/xmlUtils');

const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Constant uuid="test">
		<Properties>
			<Name>TestName</Name>
			<Comment>TestComment</Comment>
		</Properties>
	</Constant>
</MetaDataObject>`;

const parser = createPreserveOrderParser();
const parsed = parser.parse(testXml);

console.log('Parsed structure:');
console.log(JSON.stringify(parsed, null, 2).substring(0, 2000));

// Преобразуем структуру
function convertPreserveOrderToNormal(parsed) {
    if (Array.isArray(parsed)) {
        const result = {};
        for (const item of parsed) {
            if (typeof item === 'object' && item !== null) {
                for (const [key, value] of Object.entries(item)) {
                    if (key === ':@') {
                        if (typeof value === 'object' && value !== null) {
                            for (const [attrKey, attrValue] of Object.entries(value)) {
                                result[`@_${attrKey}`] = attrValue;
                            }
                        }
                    } else {
                        if (Array.isArray(value)) {
                            const convertedArray = value.map(v => convertPreserveOrderToNormal(v));
                            if (convertedArray.length === 1) {
                                const singleItem = convertedArray[0];
                                if (typeof singleItem === 'object' && singleItem !== null) {
                                    const keys = Object.keys(singleItem).filter(k => !k.startsWith('@'));
                                    if (keys.length === 1) {
                                        const propKey = keys[0];
                                        const propValue = singleItem[propKey];
                                        if (Array.isArray(propValue) && propValue.length > 0) {
                                            const firstValue = propValue[0];
                                            if (typeof firstValue === 'object' && firstValue !== null && 'text' in firstValue) {
                                                result[key] = { [propKey]: firstValue.text };
                                            } else {
                                                result[key] = singleItem;
                                            }
                                        } else {
                                            result[key] = singleItem;
                                        }
                                    } else {
                                        result[key] = singleItem;
                                    }
                                } else {
                                    result[key] = singleItem;
                                }
                            } else {
                                result[key] = convertedArray;
                            }
                        } else if (typeof value === 'object' && value !== null) {
                            result[key] = convertPreserveOrderToNormal(value);
                        } else {
                            result[key] = value;
                        }
                    }
                }
            }
        }
        return result;
    }
    return parsed;
}

const normalized = convertPreserveOrderToNormal(parsed);
console.log('\nNormalized structure:');
const normalizedStr = JSON.stringify(normalized, null, 2);
console.log(normalizedStr.substring(0, 2000));

// Проверяем, что Properties преобразован в объект
if (normalized.MetaDataObject && normalized.MetaDataObject.Constant) {
    const constant = Array.isArray(normalized.MetaDataObject.Constant) 
        ? normalized.MetaDataObject.Constant[0] 
        : normalized.MetaDataObject.Constant;
    if (constant && constant.Properties) {
        console.log('\nProperties type:', Array.isArray(constant.Properties) ? 'ARRAY ❌' : 'OBJECT ✅');
        console.log('Properties keys:', Object.keys(constant.Properties || {}));
    }
}

const builder = createXMLBuilder();
const rebuilt = builder.build(normalized);
console.log('\nRebuilt XML:');
console.log(rebuilt.substring(0, 1000));

// Проверяем, есть ли элементы Properties
if (rebuilt.includes('<Properties>') && rebuilt.includes('</Properties>')) {
    console.log('\n✅ Properties остался элементом');
} else {
    console.log('\n❌ Properties стал атрибутом или потерян');
}

// Проверяем Name
if (rebuilt.includes('<Name>') && rebuilt.includes('</Name>')) {
    console.log('✅ Name остался элементом');
} else {
    console.log('❌ Name стал атрибутом или потерян');
}

