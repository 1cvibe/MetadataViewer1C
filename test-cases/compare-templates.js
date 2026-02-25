const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const file1 = path.join(__dirname, 'compare', 'Template1.xml');
const file2 = path.join(__dirname, 'compare', 'Template2.xml');

console.log('=== Сравнение Template1.xml и Template2.xml ===\n');

const xml1 = fs.readFileSync(file1, 'utf8');
const xml2 = fs.readFileSync(file2, 'utf8');

console.log(`Template1.xml: ${xml1.length} символов, ${xml1.split(/\r?\n/).length} строк`);
console.log(`Template2.xml: ${xml2.length} символов, ${xml2.split(/\r?\n/).length} строк`);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: true,
});

const parsed1 = parser.parse(xml1);
const parsed2 = parser.parse(xml2);

// Извлекаем структуру корневых элементов
function getRootTags(parsed) {
  const top = Array.isArray(parsed) ? parsed : [parsed];
  const rootEntry = top.find(n => n && typeof n === 'object' && !Array.isArray(n) && 'DataCompositionSchema' in n);
  
  if (!rootEntry) return [];
  
  const rootBody = rootEntry['DataCompositionSchema'] || [];
  const tags = [];
  
  for (const item of rootBody) {
    if (!item || typeof item !== 'object') continue;
    const tag = Object.keys(item).find(k => k !== ':@' && k !== '#text');
    if (tag) {
      const localTag = tag.includes(':') ? tag.split(':').pop() : tag;
      tags.push(localTag);
    }
  }
  
  return tags;
}

const tags1 = getRootTags(parsed1);
const tags2 = getRootTags(parsed2);

console.log('\n=== Структура Template1.xml (исходный) ===');
tags1.forEach((tag, i) => console.log(`  ${i + 1}. ${tag}`));

console.log('\n=== Структура Template2.xml (после изменений) ===');
tags2.forEach((tag, i) => console.log(`  ${i + 1}. ${tag}`));

// Сравнение порядка
console.log('\n=== Анализ изменений ===');

// Подсчитываем количество каждого тега
function countTags(tags) {
  const counts = new Map();
  tags.forEach(tag => {
    counts.set(tag, (counts.get(tag) || 0) + 1);
  });
  return counts;
}

const counts1 = countTags(tags1);
const counts2 = countTags(tags2);

const allTags = new Set([...counts1.keys(), ...counts2.keys()]);

console.log('\nКоличество тегов:');
for (const tag of allTags) {
  const c1 = counts1.get(tag) || 0;
  const c2 = counts2.get(tag) || 0;
  const diff = c2 - c1;
  const diffStr = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0';
  console.log(`  ${tag.padEnd(25)} ${c1} → ${c2} (${diffStr})`);
}

// Проверяем порядок
console.log('\n=== Проверка порядка ===');

const expectedOrder = ['dataSource', 'dataSet', 'dataSetLink', 'totalField', 'calculatedField', 'parameter', 'template', 'groupTemplate', 'settingsVariant'];

function checkOrder(tags, label) {
  console.log(`\n${label}:`);
  
  let orderCorrect = true;
  for (let i = 0; i < tags.length - 1; i++) {
    const current = tags[i];
    const next = tags[i + 1];
    
    const currentIdx = expectedOrder.indexOf(current);
    const nextIdx = expectedOrder.indexOf(next);
    
    if (currentIdx >= 0 && nextIdx >= 0 && currentIdx > nextIdx) {
      console.log(`  ✗ Неправильный порядок: ${current} (поз. ${currentIdx}) ПОСЛЕ ${next} (поз. ${nextIdx})`);
      orderCorrect = false;
    }
  }
  
  if (orderCorrect) {
    console.log('  ✓ Порядок тегов правильный');
  }
  
  return orderCorrect;
}

checkOrder(tags1, 'Template1.xml');
checkOrder(tags2, 'Template2.xml');

// Проверяем форматирование
console.log('\n=== Проверка форматирования ===');

const lines1 = xml1.split(/\r?\n/).length;
const lines2 = xml2.split(/\r?\n/).length;

if (lines2 < 10) {
  console.log(`✗ Template2.xml потерял форматирование!`);
  console.log(`  Исходный: ${lines1} строк`);
  console.log(`  Результат: ${lines2} строк`);
  console.log(`  ПРОБЛЕМА: Весь XML в одной строке!`);
} else {
  console.log(`✓ Форматирование сохранено`);
}

// Анализируем изменения в dataSet
console.log('\n=== Изменения в dataSet ===');

function getDataSetFields(parsed) {
  const top = Array.isArray(parsed) ? parsed : [parsed];
  const rootEntry = top.find(n => n && typeof n === 'object' && !Array.isArray(n) && 'DataCompositionSchema' in n);
  
  if (!rootEntry) return [];
  
  const rootBody = rootEntry['DataCompositionSchema'] || [];
  const dataSet = rootBody.find(item => {
    if (!item || typeof item !== 'object') return false;
    return 'dataSet' in item;
  });
  
  if (!dataSet) return [];
  
  const dataSetBody = dataSet['dataSet'] || [];
  const fields = [];
  
  for (const item of dataSetBody) {
    if (!item || typeof item !== 'object') continue;
    if ('field' in item) {
      const fieldBody = item['field'] || [];
      let dataPath = '';
      for (const f of fieldBody) {
        if (f && typeof f === 'object' && 'dataPath' in f) {
          const dp = f['dataPath'] || [];
          for (const d of dp) {
            if (d && typeof d === 'object' && '#text' in d) {
              dataPath = d['#text'];
              break;
            }
          }
        }
      }
      if (dataPath) fields.push(dataPath);
    }
  }
  
  return fields;
}

const fields1 = getDataSetFields(parsed1);
const fields2 = getDataSetFields(parsed2);

console.log(`\nПоля в Template1: ${fields1.length}`);
console.log(`Поля в Template2: ${fields2.length}`);

const added = fields2.filter(f => !fields1.includes(f));
const removed = fields1.filter(f => !fields2.includes(f));

if (added.length > 0) {
  console.log('\n✓ Добавленные поля:');
  added.forEach(f => console.log(`  + ${f}`));
}

if (removed.length > 0) {
  console.log('\n✗ Удаленные поля:');
  removed.forEach(f => console.log(`  - ${f}`));
}

console.log('\n=== ИТОГО ===');
console.log(`1. Форматирование: ${lines2 < 10 ? '✗ ПОТЕРЯНО' : '✓ ОК'}`);
console.log(`2. Порядок тегов: ${checkOrder(tags2, '') ? '✓ ОК' : '✗ НАРУШЕН'}`);
console.log(`3. Изменений полей: +${added.length}, -${removed.length}`);

