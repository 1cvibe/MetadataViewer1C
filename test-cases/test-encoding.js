const fs = require('fs');
const path = require('path');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

const file1 = path.join(__dirname, 'compare', 'Template1.xml');

console.log('=== Тест кодировки UTF-8 ===\n');

// Читаем файл
const xmlUtf8 = fs.readFileSync(file1, 'utf8');

console.log('1. Исходный файл (первые 500 символов):');
console.log(xmlUtf8.substring(0, 500));

// Парсим
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: true,
});

const parsed = parser.parse(xmlUtf8);

// Сериализуем обратно
const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '\t',
  preserveOrder: true,
  suppressEmptyNode: true,
});

const rebuilt = '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(parsed);

console.log('\n2. После парсинга и сериализации (первые 500 символов):');
console.log(rebuilt.substring(0, 500));

// Ищем кириллицу в исходном
const cyrillicMatch1 = xmlUtf8.match(/ИсточникДанных|Сотрудник|НаборДанных/);
console.log('\n3. Кириллица в исходном:', cyrillicMatch1 ? cyrillicMatch1[0] : 'НЕ НАЙДЕНА');

// Ищем кириллицу в результате
const cyrillicMatch2 = rebuilt.match(/ИсточникДанных|Сотрудник|НаборДанных/);
console.log('4. Кириллица в результате:', cyrillicMatch2 ? cyrillicMatch2[0] : 'НЕ НАЙДЕНА');

// Проверяем "кракозябры"
const badMatch1 = xmlUtf8.match(/РСЃС‚РѕС‡РЅРёРєР"Р°РЅРЅС‹С…|РЎРѕС‚СЂСѓРґРЅРёРє/);
console.log('5. Испорченная кириллица в исходном:', badMatch1 ? '✗ НАЙДЕНА!' : '✓ НЕТ');

const badMatch2 = rebuilt.match(/РСЃС‚РѕС‡РЅРёРєР"Р°РЅРЅС‹С…|РЎРѕС‚СЂСѓРґРЅРёРє/);
console.log('6. Испорченная кириллица в результате:', badMatch2 ? '✗ НАЙДЕНА!' : '✓ НЕТ');

// Сравниваем байты
const bytes1 = Buffer.from('ИсточникДанных', 'utf8');
const bytes2 = Buffer.from(rebuilt.match(/ИсточникДанных/) ? rebuilt.match(/ИсточникДанных/)[0] : '', 'utf8');

console.log('\n7. Байты "ИсточникДанных":');
console.log('   Правильно:', bytes1.toString('hex'));
console.log('   В результате:', bytes2.toString('hex'));
console.log('   Совпадают:', bytes1.equals(bytes2) ? '✓ ДА' : '✗ НЕТ');

// Сохраняем результат и проверяем
const testOutput = path.join(__dirname, 'test-encoding-output.xml');
fs.writeFileSync(testOutput, rebuilt, 'utf8');

console.log('\n8. Тестовый файл сохранен:', testOutput);

// Читаем обратно и проверяем
const reread = fs.readFileSync(testOutput, 'utf8');
const cyrillicMatch3 = reread.match(/ИсточникДанных|Сотрудник|НаборДанных/);
console.log('9. После сохранения и чтения:', cyrillicMatch3 ? cyrillicMatch3[0] : 'НЕ НАЙДЕНА');

const badMatch3 = reread.match(/РСЃС‚РѕС‡РЅРёРєР"Р°РЅРЅС‹С…|РЎРѕС‚СЂСѓРґРЅРёРє/);
console.log('10. Испорченная кириллица после сохранения:', badMatch3 ? '✗ НАЙДЕНА!' : '✓ НЕТ');

console.log('\n=== ДИАГНОЗ ===');
if (badMatch2) {
  console.log('❌ ПРОБЛЕМА: fast-xml-parser портит кодировку при сериализации!');
  console.log('   Нужно использовать другой метод или исправить конфигурацию.');
} else if (badMatch3) {
  console.log('❌ ПРОБЛЕМА: fs.writeFileSync портит кодировку!');
  console.log('   Нужно проверить настройки Node.js или системы.');
} else {
  console.log('✅ Кодировка в порядке!');
  console.log('   Проблема должна быть в исходном файле Template2.xml');
}

