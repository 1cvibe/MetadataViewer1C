const fs = require('fs');

// Читаем файл
const content = fs.readFileSync('src/Metadata/field-values.ts', 'utf8');
const match = content.match(/export const FIELD_LABELS[^=]*=\s*\{([\s\S]*?)\};/);

if (!match) {
    console.error('Не найден FIELD_LABELS');
    process.exit(1);
}

const labels = match[1];
const keys = [];
const regex = /['"]([A-Za-z][A-Za-z0-9_]*)['"]:/g;
let m;
while ((m = regex.exec(labels)) !== null) {
    keys.push(m[1]);
}

// Проверяем на дубликаты
const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);

// Требуемые переводы
const required = [
    'Posted', 'Ref', 'DeletionMark', 'Date', 'Number', 'Owner', 'Parent', 
    'Code', 'Level', 'IsFolder', 'DataVersion', 'LockedByDBMS', 'ReadOnly', 
    'TypeReductionMode'
];

const found = required.filter(r => keys.includes(r));

console.log('Проверка переводов:');
console.log(`Всего ключей: ${keys.length}`);
console.log(`Дубликаты: ${duplicates.length > 0 ? duplicates.join(', ') : 'нет'}`);
console.log(`Найдено требуемых переводов: ${found.length} из ${required.length}`);

if (found.length < required.length) {
    const missing = required.filter(r => !keys.includes(r));
    console.log(`Отсутствуют: ${missing.join(', ')}`);
    process.exit(1);
} else {
    console.log('Все требуемые переводы добавлены!');
    console.log('\nДобавленные переводы:');
    required.forEach(key => {
        const valueMatch = labels.match(new RegExp(`['"]${key}['"]:\\s*['"]([^'"]+)['"]`));
        if (valueMatch) {
            console.log(`  ${key}: ${valueMatch[1]}`);
        }
    });
}
