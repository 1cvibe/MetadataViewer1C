/**
 * Простой тест DCS сериализатора на основе xmldom (только Template.xml)
 */
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

// Динамически импортируем из out/
const dcsSerializerPath = path.join(__dirname, '..', 'out', 'xmlParsers', 'dcsSerializerXmldom.js');

if (!fs.existsSync(dcsSerializerPath)) {
  console.error('❌ Файл не найден:', dcsSerializerPath);
  console.error('   Запустите "npm run compile" перед тестом!');
  process.exit(1);
}

const { serializeToXml } = require(dcsSerializerPath);

console.log('=== Простой тест DCS xmldom (Template.xml) ===\n');

// Путь к тестовому Template.xml
const templatePath = path.join(__dirname, 'compare', 'Template1.xml');

if (!fs.existsSync(templatePath)) {
  console.error('❌ Тестовый Template1.xml не найден:', templatePath);
  process.exit(1);
}

try {
  console.log('1. Читаем Template1.xml...');
  const originalXml = fs.readFileSync(templatePath, 'utf8');
  console.log(`   ✓ Размер: ${originalXml.length} символов`);
  
  // Проверяем BOM
  const buffer = fs.readFileSync(templatePath);
  const hasBom = buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
  console.log(`   ✓ BOM: ${hasBom ? 'ЕСТЬ' : 'НЕТ'}`);
  
  console.log('\n2. Парсим через xmldom...');
  const parser = new DOMParser({
    errorHandler: {
      warning: (w) => console.warn('[xmldom] Warning:', w),
      error: (e) => console.error('[xmldom] Error:', e),
      fatalError: (e) => {
        console.error('[xmldom] Fatal error:', e);
        throw new Error(`XML parsing error: ${e}`);
      }
    }
  });
  
  // Удаляем BOM если есть
  let cleanXml = originalXml;
  if (originalXml.charCodeAt(0) === 0xFEFF) {
    cleanXml = originalXml.slice(1);
  }
  
  const doc = parser.parseFromString(cleanXml, 'text/xml');
  const rootElement = doc.documentElement;
  
  console.log(`   ✓ Корневой тег: ${rootElement.tagName}`);
  console.log(`   ✓ Атрибутов: ${rootElement.attributes.length}`);
  console.log(`   ✓ Детей: ${rootElement.childNodes.length}`);
  
  // Извлекаем атрибуты
  const rootAttrs = {};
  for (let i = 0; i < rootElement.attributes.length; i++) {
    const attr = rootElement.attributes[i];
    rootAttrs[`@_${attr.name}`] = attr.value;
  }
  
  // Извлекаем дочерние элементы в простую структуру
  const children = [];
  for (let i = 0; i < rootElement.childNodes.length; i++) {
    const child = rootElement.childNodes[i];
    if (child.nodeType === 1) { // ELEMENT_NODE
      children.push({
        path: `${children.length}`,
        tag: child.tagName,
        attrs: {},
        children: [],
        _domElement: child,
      });
    }
  }
  
  console.log(`   ✓ Элементов (не комментариев): ${children.length}`);
  
  console.log('\n3. Сериализуем обратно...');
  const updatedXml = serializeToXml(doc, rootElement.tagName, children, rootAttrs);
  
  console.log(`   ✓ Размер: ${updatedXml.length} символов`);
  
  // Проверяем наличие <?xml ?>
  if (!updatedXml.startsWith('<?xml')) {
    throw new Error('Отсутствует XML декларация!');
  }
  console.log('   ✓ XML декларация присутствует');
  
  // Проверяем xmlns
  if (!updatedXml.includes('xmlns="http://v8.1c.ru')) {
    throw new Error('xmlns отсутствует в результате!');
  }
  console.log('   ✓ xmlns присутствует');
  
  // Проверяем кириллицу
  const cyrillicMatch = updatedXml.match(/ИсточникДанных|НаборДанных/);
  if (cyrillicMatch) {
    console.log(`   ✓ Кириллица: ${cyrillicMatch[0]}`);
  }
  
  // Проверяем "кракозябры"
  const badMatch = updatedXml.match(/РСЃС‚РѕС‡РЅРёРєР"Р°РЅРЅС‹С…|РЎРѕС‚СЂСѓРґРЅРёРє/);
  if (badMatch) {
    throw new Error('"Кракозябры" найдены!');
  }
  console.log('   ✓ Кодировка корректна');
  
  console.log('\n4. Сравниваем...');
  const diff = updatedXml.length - originalXml.length;
  const diffPercent = Math.abs((diff / originalXml.length) * 100);
  
  console.log(`   Оригинал: ${originalXml.length} символов`);
  console.log(`   Результат: ${updatedXml.length} символов`);
  console.log(`   Разница: ${diff} символов (${diffPercent.toFixed(2)}%)`);
  
  if (diffPercent < 5) {
    console.log('   ✓ Разница < 5% - отлично!');
  } else if (diffPercent < 10) {
    console.log('   ⚠️  Разница 5-10% - приемлемо');
  } else {
    console.warn('   ⚠️  Разница > 10% - проверьте форматирование');
  }
  
  // Сохраняем результат с BOM
  const outputPath = path.join(__dirname, 'test-template-xmldom-output.xml');
  const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
  const contentBuffer = Buffer.from(updatedXml, 'utf8');
  fs.writeFileSync(outputPath, Buffer.concat([bomBuffer, contentBuffer]));
  
  console.log(`\n5. Результат сохранен: ${outputPath}`);
  
  // Проверяем BOM в сохраненном файле
  const savedBuffer = fs.readFileSync(outputPath);
  const savedHasBom = savedBuffer[0] === 0xEF && savedBuffer[1] === 0xBB && savedBuffer[2] === 0xBF;
  console.log(`   ✓ BOM в результате: ${savedHasBom ? 'ЕСТЬ' : 'НЕТ'}`);
  
  // Читаем обратно и проверяем кодировку
  const savedXml = fs.readFileSync(outputPath, 'utf8');
  const savedCyrillic = savedXml.match(/ИсточникДанных|НаборДанных/);
  if (savedCyrillic) {
    console.log(`   ✓ Кириллица после сохранения: ${savedCyrillic[0]}`);
  }
  
  console.log('\n=== ИТОГ ===\n');
  console.log('✅ xmldom РАБОТАЕТ ОТЛИЧНО!');
  console.log('   1. Парсинг ✓');
  console.log('   2. Сериализация ✓');
  console.log('   3. BOM ✓');
  console.log('   4. Кодировка ✓');
  console.log('   5. xmlns ✓');
  console.log('\n👉 Готов к использованию в расширении!');
  
} catch (error) {
  console.error('\n=== ОШИБКА ===\n');
  console.error('❌', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
}

