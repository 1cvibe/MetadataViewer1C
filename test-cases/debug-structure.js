/**
 * Скрипт для анализа структуры парсинга XML с preserveOrder: true
 */

const fs = require('fs');
const path = require('path');

// Загружаем скомпилированные модули
const parseMetadataXml = require('../out/xmlParsers/metadataParser').parseMetadataXml;
const applyChangesToXmlString = require('../out/utils/xmlStringPatcher').applyChangesToXmlString;

async function analyzeStructure() {
    // Берем один простой файл для анализа
    const testFile = path.join(__dirname, 'metadata-save-tests', 'Constant', 'ibs_ГлубинаСообщенийЦНСИ.xml');
    
    if (!fs.existsSync(testFile)) {
        console.error('Тестовый файл не найден:', testFile);
        return;
    }
    
    console.log('=== Анализ структуры парсинга ===\n');
    console.log('Файл:', testFile);
    
    try {
        // Парсим XML
        const originalObject = await parseMetadataXml(testFile);
        console.log('\n✅ Объект распарсен:', originalObject.name);
        
        // Пробуем применить изменения (это вызовет логирование структуры)
        const modifiedObject = JSON.parse(JSON.stringify(originalObject));
        if (modifiedObject.properties && modifiedObject.properties.Synonym) {
            if (typeof modifiedObject.properties.Synonym === 'object' && modifiedObject.properties.Synonym['v8:item']) {
                const item = Array.isArray(modifiedObject.properties.Synonym['v8:item']) 
                    ? modifiedObject.properties.Synonym['v8:item'][0]
                    : modifiedObject.properties.Synonym['v8:item'];
                
                if (item && item['v8:content']) {
                    item['v8:content'] = (item['v8:content'] || '') + ' [Тест]';
                }
            }
        }
        
        console.log('\n=== Применение изменений (логирование структуры) ===\n');
        try {
            await applyChangesToXmlString(originalObject._originalXml, modifiedObject, 'Constant');
        } catch (error) {
            console.log('\n❌ Ошибка (ожидаемая):', error.message);
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

analyzeStructure().catch(console.error);

