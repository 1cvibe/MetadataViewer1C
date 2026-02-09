const fs = require('fs');
const { createXMLParser } = require('../src/utils/xmlUtils');

// Найдем файл с StandardAttributes
const testFile = 'E:\\DATA1C\\RZDZUP\\src\\cf\\ChartOfAccounts\\Управленческий.xml';

if (!fs.existsSync(testFile)) {
    console.log('Файл не найден, пробуем найти другой...');
    const { execSync } = require('child_process');
    const result = execSync(`powershell -Command "Get-ChildItem -Path 'E:\\DATA1C\\RZDZUP\\src\\cf' -Recurse -Filter '*.xml' | Where-Object { (Select-String -Path $_.FullName -Pattern 'StandardAttribute' -Quiet) } | Select-Object -First 1 | ForEach-Object { $_.FullName }"`, { encoding: 'utf8' });
    const file = result.trim();
    if (file) {
        console.log(`Найден файл: ${file}`);
        parseFile(file);
    } else {
        console.log('Не удалось найти файл с StandardAttributes');
    }
} else {
    parseFile(testFile);
}

function parseFile(filePath) {
    try {
        const xml = fs.readFileSync(filePath, 'utf8');
        const parser = createXMLParser();
        const parsed = parser.parse(xml);
        
        // Ищем StandardAttributes
        const findStandardAttributes = (obj) => {
            if (!obj || typeof obj !== 'object') return null;
            if (obj.StandardAttributes) return obj.StandardAttributes;
            if (obj.Properties && obj.Properties.StandardAttributes) return obj.Properties.StandardAttributes;
            for (const key in obj) {
                const result = findStandardAttributes(obj[key]);
                if (result) return result;
            }
            return null;
        };
        
        const standardAttrs = findStandardAttributes(parsed);
        if (!standardAttrs) {
            console.log('StandardAttributes не найдены в файле');
            return;
        }
        
        console.log('Найдены StandardAttributes:');
        const attrs = Array.isArray(standardAttrs) ? standardAttrs : [standardAttrs];
        attrs.forEach((attr, idx) => {
            console.log(`\nАтрибут ${idx + 1}:`);
            console.log('  Структура:', JSON.stringify(Object.keys(attr), null, 2));
            if (attr['xr:StandardAttribute']) {
                console.log('  xr:StandardAttribute keys:', Object.keys(attr['xr:StandardAttribute']));
            }
            // Показываем все ключи, включая вложенные
            const allKeys = new Set();
            const collectKeys = (obj, prefix = '') => {
                if (!obj || typeof obj !== 'object') return;
                for (const key in obj) {
                    if (key.startsWith('@') || key === 'text' || key === '#text') continue;
                    const fullKey = prefix ? `${prefix}.${key}` : key;
                    allKeys.add(fullKey);
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        collectKeys(obj[key], fullKey);
                    }
                }
            };
            collectKeys(attr);
            console.log('  Все ключи:', Array.from(allKeys).sort());
        });
    } catch (error) {
        console.error('Ошибка при парсинге:', error.message);
    }
}
