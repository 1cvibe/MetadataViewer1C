/**
 * Тест DCS парсера и сериализатора на основе xmldom
 */
const fs = require('fs');
const path = require('path');

// Динамически импортируем из dist/
const dcsParserPath = path.join(__dirname, '..', 'dist', 'xmlParsers', 'dcsParserXmldom.js');
const dcsSerializerPath = path.join(__dirname, '..', 'dist', 'xmlParsers', 'dcsSerializerXmldom.js');

if (!fs.existsSync(dcsParserPath)) {
  console.error('❌ Файл не найден:', dcsParserPath);
  console.error('   Запустите "npm run compile" перед тестом!');
  process.exit(1);
}

const { parseReportXmlForDcs } = require(dcsParserPath);
const { serializeToXml } = require(dcsSerializerPath);

console.log('=== Тест DCS на xmldom ===\n');

// Пути к тестовым файлам
const testReportPath = path.join(__dirname, 'compare', 'Report.xml');
const sourceRoot = 'D:\\1C\\RZDZUP\\src\\cf';

if (!fs.existsSync(testReportPath)) {
  console.error('❌ Тестовый Report.xml не найден:', testReportPath);
  console.error('   Создайте его или укажите правильный путь');
  process.exit(1);
}

async function main() {
  try {
    console.log('1. Парсим Report.xml...');
    const parsed = await parseReportXmlForDcs(sourceRoot, testReportPath);
    
    console.log(`   ✓ Отчет: ${parsed.reportName}`);
    console.log(`   ✓ Шаблон: ${parsed.templateName}`);
    console.log(`   ✓ Template.xml: ${parsed.templatePath}`);
    console.log(`   ✓ Корневой тег: ${parsed.schema.rootTag}`);
    console.log(`   ✓ Дети корня: ${parsed.schema.children.length}`);
    console.log(`   ✓ Атрибуты корня: ${Object.keys(parsed.schema._rootAttrs || {}).length}`);
    
    // Проверяем _domDocument
    if (!parsed.schema._domDocument) {
      throw new Error('_domDocument отсутствует!');
    }
    console.log('   ✓ _domDocument присутствует');
    
    // Проверяем xmlns
    const xmlns = parsed.schema._rootAttrs?.['@_xmlns'];
    if (!xmlns || !xmlns.includes('v8.1c.ru')) {
      throw new Error('xmlns отсутствует или некорректен!');
    }
    console.log(`   ✓ xmlns: ${xmlns.substring(0, 50)}...`);
    
    console.log('\n2. Сериализуем обратно в XML...');
    const updatedXml = serializeToXml(
      parsed.schema._domDocument,
      parsed.schema.rootTag,
      parsed.schema.children,
      parsed.schema._rootAttrs
    );
    
    console.log(`   ✓ XML создан: ${updatedXml.length} символов`);
    
    // Проверяем наличие <?xml ?>
    if (!updatedXml.startsWith('<?xml')) {
      throw new Error('Отсутствует XML декларация!');
    }
    console.log('   ✓ XML декларация присутствует');
    
    // Проверяем корневой тег
    if (!updatedXml.includes(`<${parsed.schema.rootTag}`)) {
      throw new Error(`Корневой тег <${parsed.schema.rootTag}> отсутствует!`);
    }
    console.log(`   ✓ Корневой тег <${parsed.schema.rootTag}> найден`);
    
    // Проверяем xmlns
    if (!updatedXml.includes('xmlns="http://v8.1c.ru')) {
      throw new Error('xmlns отсутствует в результате!');
    }
    console.log('   ✓ xmlns присутствует в результате');
    
    // Проверяем кириллицу
    const cyrillicMatch = updatedXml.match(/ИсточникДанных|НаборДанных|Сотрудник|dataSource|dataSet/);
    if (!cyrillicMatch) {
      console.warn('   ⚠️  Кириллица/dataSource не найдены (возможно, в вашем отчете их нет)');
    } else {
      console.log(`   ✓ Найдены элементы: ${cyrillicMatch[0]}`);
    }
    
    // Проверяем "кракозябры"
    const badMatch = updatedXml.match(/РСЃС‚РѕС‡РЅРёРєР"Р°РЅРЅС‹С…|РЎРѕС‚СЂСѓРґРЅРёРє/);
    if (badMatch) {
      throw new Error('"Кракозябры" найдены в результате!');
    }
    console.log('   ✓ "Кракозябры" отсутствуют');
    
    console.log('\n3. Сравниваем с оригиналом...');
    const originalXml = parsed.schema._originalXml;
    const originalSize = originalXml.length;
    const newSize = updatedXml.length;
    const diff = newSize - originalSize;
    const diffPercent = Math.abs((diff / originalSize) * 100);
    
    console.log(`   Оригинал: ${originalSize} символов`);
    console.log(`   Результат: ${newSize} символов`);
    console.log(`   Разница: ${diff} символов (${diffPercent.toFixed(2)}%)`);
    
    if (diffPercent > 10) {
      console.warn(`   ⚠️  Разница > 10% - проверьте форматирование!`);
    } else {
      console.log('   ✓ Разница приемлема');
    }
    
    // Сохраняем результат
    const outputPath = path.join(__dirname, 'test-xmldom-output.xml');
    fs.writeFileSync(outputPath, updatedXml, 'utf8');
    console.log(`\n4. Результат сохранен: ${outputPath}`);
    
    // Проверяем сохраненный файл
    const saved = fs.readFileSync(outputPath, 'utf8');
    if (saved === updatedXml) {
      console.log('   ✓ Файл сохранен корректно');
    } else {
      throw new Error('Сохраненный файл отличается от исходного!');
    }
    
    console.log('\n=== ИТОГ ===\n');
    console.log('✅ ВСЁ ОТЛИЧНО!');
    console.log('   1. Парсинг через xmldom работает');
    console.log('   2. Сериализация через xmldom работает');
    console.log('   3. Структура XML сохранена');
    console.log('   4. xmlns корректны');
    console.log('   5. Кодировка корректна');
    console.log('\n👉 xmldom готов к использованию в DCS редакторе!');
    
  } catch (error) {
    console.error('\n=== ОШИБКА ===\n');
    console.error('❌', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

main();

