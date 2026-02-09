/**
 * Тест builder с preserveOrder: true
 */

const { createPreserveOrderParser, createPreserveOrderBuilder } = require('../out/utils/xmlUtils');

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

console.log('Parsed structure (first 1000 chars):');
console.log(JSON.stringify(parsed, null, 2).substring(0, 1000));

// Преобразуем структуру preserveOrder в формат для builder с preserveOrder: true
function convertToPreserveOrderBuilderFormat(parsed) {
    if (Array.isArray(parsed)) {
        return parsed.map(item => {
            if (typeof item === 'object' && item !== null) {
                const result = {};
                for (const [key, value] of Object.entries(item)) {
                    if (key === ':@') {
                        result[':@'] = value;
                    } else {
                        if (Array.isArray(value)) {
                            result[key] = value.map(v => convertToPreserveOrderBuilderFormat(v));
                        } else {
                            result[key] = convertToPreserveOrderBuilderFormat(value);
                        }
                    }
                }
                // Добавляем tagName для builder
                const keys = Object.keys(result).filter(k => k !== ':@');
                if (keys.length === 1) {
                    return {
                        tagName: keys[0],
                        children: convertToPreserveOrderBuilderFormat(result[keys[0]]),
                        ...(result[':@'] ? { ':@': result[':@'] } : {})
                    };
                }
                return result;
            }
            return item;
        });
    } else if (typeof parsed === 'object' && parsed !== null) {
        const result = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (key === ':@') {
                result[':@'] = value;
            } else {
                result[key] = convertToPreserveOrderBuilderFormat(value);
            }
        }
        return result;
    }
    return parsed;
}

// Упрощенная версия - просто используем структуру как есть
const builder = createPreserveOrderBuilder();
try {
    const rebuilt = builder.build(parsed);
    console.log('\nRebuilt XML (first 500 chars):');
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
} catch (error) {
    console.error('\n❌ Ошибка при сборке:', error.message);
    console.error('Stack:', error.stack?.substring(0, 500));
}

