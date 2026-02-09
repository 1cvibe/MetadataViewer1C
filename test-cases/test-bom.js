const fs = require('fs');
const path = require('path');

const file1 = path.join(__dirname, 'compare', 'Template1.xml');
const file2 = path.join(__dirname, 'compare', 'Template2.xml');

console.log('=== Проверка BOM (Byte Order Mark) ===\n');

// Читаем первые байты файлов
const buffer1 = fs.readFileSync(file1);
const buffer2 = fs.readFileSync(file2);

console.log('Template1.xml:');
console.log(`  Первые 3 байта: ${buffer1.slice(0, 3).toString('hex')}`);
console.log(`  Начало файла: ${buffer1.slice(0, 50).toString('utf8')}`);

const hasBom1 = buffer1[0] === 0xEF && buffer1[1] === 0xBB && buffer1[2] === 0xBF;
console.log(`  BOM: ${hasBom1 ? '✓ ПРИСУТСТВУЕТ (EF BB BF)' : '✗ ОТСУТСТВУЕТ'}`);

console.log('\nTemplate2.xml:');
console.log(`  Первые 3 байта: ${buffer2.slice(0, 3).toString('hex')}`);
console.log(`  Начало файла: ${buffer2.slice(0, 50).toString('utf8')}`);

const hasBom2 = buffer2[0] === 0xEF && buffer2[1] === 0xBB && buffer2[2] === 0xBF;
console.log(`  BOM: ${hasBom2 ? '✓ ПРИСУТСТВУЕТ (EF BB BF)' : '✗ ОТСУТСТВУЕТ'}`);

console.log('\n=== Рекомендация ===');

if (hasBom1 !== hasBom2) {
  console.log('⚠️  НЕСООТВЕТСТВИЕ: Один файл с BOM, другой без BOM!');
  console.log('   1С конфигуратор может быть чувствителен к этому.');
  console.log('   Рекомендуется: сохранять файлы БЕЗ BOM');
} else if (hasBom1 && hasBom2) {
  console.log('✓ Оба файла с BOM');
  console.log('  Это стандартно для 1С');
} else {
  console.log('✓ Оба файла без BOM');
}

// Проверяем, нужно ли удалять BOM при сохранении
console.log('\n=== Проверка функции saveDcs ===');
console.log('Текущий код:');
console.log('  fs.writeFileSync(templatePath, updatedXml, \'utf8\');');
console.log('\nПроблема:');
console.log('  writeFileSync с \'utf8\' НЕ добавляет BOM автоматически');
console.log('  Если оригинал был с BOM, а результат без BOM - может быть ошибка!');

console.log('\nРешение:');
if (hasBom1) {
  console.log('  ✓ Нужно добавить BOM при сохранении:');
  console.log('    const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);');
  console.log('    const contentBuffer = Buffer.from(updatedXml, \'utf8\');');
  console.log('    fs.writeFileSync(path, Buffer.concat([bomBuffer, contentBuffer]));');
} else {
  console.log('  ✓ Сохранять без BOM (как сейчас)');
}

