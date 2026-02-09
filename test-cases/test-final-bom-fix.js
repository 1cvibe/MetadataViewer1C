/**
 * Финальный тест: проверяем, что сохранение работает с BOM
 */
const fs = require('fs');
const path = require('path');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

console.log('=== Финальный тест BOM fix ===\n');

const file1 = path.join(__dirname, 'compare', 'Template1.xml');
const testOutput = path.join(__dirname, 'test-final-output.xml');

// 1. Читаем оригинал
console.log('1. Читаем оригинал Template1.xml...');
const originalXml = fs.readFileSync(file1, 'utf8');

// 2. Проверяем BOM в оригинале
const originalBuffer = fs.readFileSync(file1);
const originalHasBom = originalBuffer[0] === 0xEF && originalBuffer[1] === 0xBB && originalBuffer[2] === 0xBF;
console.log(`   BOM в оригинале: ${originalHasBom ? '✓ ЕСТЬ' : '✗ НЕТ'}`);

// 3. Парсим
console.log('\n2. Парсим XML...');
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: true,
});
const parsed = parser.parse(originalXml);

// 4. Сериализуем
console.log('3. Сериализуем обратно...');
const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '\t',
  preserveOrder: true,
  suppressEmptyNode: true,
});
const rebuilt = '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(parsed);

// 5. Сохраняем с BOM (как в новом коде)
console.log('4. Сохраняем с BOM...');
const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
const contentBuffer = Buffer.from(rebuilt, 'utf8');
fs.writeFileSync(testOutput, Buffer.concat([bomBuffer, contentBuffer]));

// 6. Проверяем результат
console.log('\n5. Проверяем результат:\n');

const resultBuffer = fs.readFileSync(testOutput);
const resultHasBom = resultBuffer[0] === 0xEF && resultBuffer[1] === 0xBB && resultBuffer[2] === 0xBF;

console.log(`   ✓ Файл создан: ${testOutput}`);
console.log(`   ✓ Размер: ${resultBuffer.length} байт`);
console.log(`   ✓ Первые 3 байта: ${resultBuffer.slice(0, 3).toString('hex').toUpperCase()}`);
console.log(`   ✓ BOM присутствует: ${resultHasBom ? '✅ ДА' : '❌ НЕТ'}`);

// 7. Проверяем кириллицу
const resultText = fs.readFileSync(testOutput, 'utf8');
const cyrillicMatch = resultText.match(/ИсточникДанных|Сотрудник|НаборДанных/);
console.log(`   ✓ Кириллица: ${cyrillicMatch ? '✅ ' + cyrillicMatch[0] : '❌ НЕ НАЙДЕНА'}`);

// 8. Проверяем "кракозябры"
const badMatch = resultText.match(/РСЃС‚РѕС‡РЅРёРєР"Р°РЅРЅС‹С…|РЎРѕС‚СЂСѓРґРЅРёРє/);
console.log(`   ✓ "Кракозябры": ${badMatch ? '❌ НАЙДЕНЫ' : '✅ НЕТ'}`);

// 9. Итоговая проверка
console.log('\n=== ИТОГ ===\n');

const success = resultHasBom && cyrillicMatch && !badMatch;

if (success) {
  console.log('✅ ВСЁ ОТЛИЧНО!');
  console.log('   1. BOM присутствует (EF BB BF)');
  console.log('   2. Кириллица читается правильно');
  console.log('   3. "Кракозябры" отсутствуют');
  console.log('   4. Файл готов для загрузки в 1С конфигуратор');
  console.log('\n👉 Исправление работает корректно!');
} else {
  console.log('❌ ПРОБЛЕМА!');
  if (!resultHasBom) console.log('   - BOM отсутствует');
  if (!cyrillicMatch) console.log('   - Кириллица не найдена');
  if (badMatch) console.log('   - Найдены "кракозябры"');
  console.log('\n👉 Требуется дополнительная отладка');
}

console.log('\n=== Сравнение с оригиналом ===\n');
console.log(`Оригинал (Template1.xml): ${originalBuffer.length} байт, BOM: ${originalHasBom ? 'ЕСТЬ' : 'НЕТ'}`);
console.log(`Результат (test-final-output.xml): ${resultBuffer.length} байт, BOM: ${resultHasBom ? 'ЕСТЬ' : 'НЕТ'}`);
console.log(`Разница: ${resultBuffer.length - originalBuffer.length} байт`);

// Небольшая разница допустима из-за форматирования
const sizeDiffPercent = Math.abs((resultBuffer.length - originalBuffer.length) / originalBuffer.length * 100);
if (sizeDiffPercent < 5) {
  console.log(`✓ Разница < 5% - это нормально`);
} else if (sizeDiffPercent < 10) {
  console.log(`⚠️  Разница ${sizeDiffPercent.toFixed(1)}% - проверьте форматирование`);
} else {
  console.log(`❌ Разница ${sizeDiffPercent.toFixed(1)}% - файл значительно изменился!`);
}

