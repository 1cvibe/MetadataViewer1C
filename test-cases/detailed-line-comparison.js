const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const file1 = path.join(__dirname, 'compare', 'Form1.xml');
const file2 = path.join(__dirname, 'compare', 'Form2.xml');

const xml1 = fs.readFileSync(file1, 'utf8');
const xml2 = fs.readFileSync(file2, 'utf8');

console.log('=== Детальное построчное сравнение ===\n');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: true,
});

const parsed1 = parser.parse(xml1);
const parsed2 = parser.parse(xml2);

// Функция для извлечения порядка дочерних элементов
function getChildrenOrder(node, parentPath = '') {
  const results = [];
  
  if (!node || typeof node !== 'object') return results;
  
  if (Array.isArray(node)) {
    node.forEach((item, idx) => {
      results.push(...getChildrenOrder(item, `${parentPath}[${idx}]`));
    });
    return results;
  }
  
  const keys = Object.keys(node).filter(k => k !== ':@' && k !== '#text');
  
  for (const key of keys) {
    const localTag = key.includes(':') ? key.split(':').pop() : key;
    const value = node[key];
    
    if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        const itemPath = `${parentPath}/${localTag}[${idx}]`;
        results.push({ path: itemPath, tag: localTag, attrs: item[':@'] || {} });
        
        if (item && typeof item === 'object') {
          results.push(...getChildrenOrder(item, itemPath));
        }
      });
    } else if (value && typeof value === 'object') {
      const itemPath = `${parentPath}/${localTag}`;
      results.push({ path: itemPath, tag: localTag, attrs: value[':@'] || {} });
      results.push(...getChildrenOrder(value, itemPath));
    }
  }
  
  return results;
}

const order1 = getChildrenOrder(parsed1, '');
const order2 = getChildrenOrder(parsed2, '');

// Проверяем, это форма или DCS
// fast-xml-parser с preserveOrder возвращает массив, первый элемент - корневой
const rootKey1 = parsed1[0] ? Object.keys(parsed1[0])[0] : Object.keys(parsed1)[0];
const rootKey2 = parsed2[0] ? Object.keys(parsed2[0])[0] : Object.keys(parsed2)[0];
const isForm = rootKey1 === 'Form' || rootKey2 === 'Form' || (rootKey1 && rootKey1.includes('Form')) || (rootKey2 && rootKey2.includes('Form')) || order1.some(o => o.tag === 'Form') || order2.some(o => o.tag === 'Form');

console.log('Элементов в Form1:', order1.length);
console.log('Элементов в Form2:', order2.length);

// Проверяем порядок тегов внутри dataSet (только для DCS)
console.log('\n=== Порядок тегов внутри dataSet ===\n');

const ds1Children = order1.filter(o => o.path.includes('/dataSet[0]/') && o.path.split('/').length === 3);
const ds2Children = order2.filter(o => o.path.includes('/dataSet[0]/') && o.path.split('/').length === 3);

if (isForm) {
  // Для форм анализируем корневые элементы
  console.log('\n=== Порядок корневых элементов формы ===\n');
  
  const root1 = order1.filter(o => o.path.split('/').length === 2);
  const root2 = order2.filter(o => o.path.split('/').length === 2);
  
  console.log('Form1 корневые элементы:');
  root1.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.tag}`);
  });
  
  console.log('\nForm2 корневые элементы:');
  root2.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.tag}`);
  });
  
  // Проверяем ChildItems
  const ci1Children = order1.filter(o => o.path.includes('/ChildItems/') && o.path.split('/').length === 3);
  const ci2Children = order2.filter(o => o.path.includes('/ChildItems/') && o.path.split('/').length === 3);
  
  console.log('\n=== Порядок элементов в ChildItems ===\n');
  console.log(`Form1 ChildItems: ${ci1Children.length} элементов`);
  console.log(`Form2 ChildItems: ${ci2Children.length} элементов`);
  
  if (ci1Children.length > 0) {
    console.log('\nForm1 ChildItems (первые 10):');
    ci1Children.slice(0, 10).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.tag}`);
    });
  }
  
  if (ci2Children.length > 0) {
    console.log('\nForm2 ChildItems (первые 10):');
    ci2Children.slice(0, 10).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.tag}`);
    });
  }
  
  console.log('\n=== ИТОГОВЫЙ ДИАГНОЗ ===\n');
  console.log('✓ Анализ структуры формы завершен');
  
} else {
  // Для DCS (оригинальный код)
  console.log('Template1 dataSet children:');
  ds1Children.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.tag}`);
  });

  console.log('\nTemplate2 dataSet children:');
  ds2Children.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.tag}`);
  });

// Ожидаемый порядок в dataSet согласно 1С
const expectedDsOrder = ['name', 'field', 'dataSource', 'query'];

console.log('\n=== Проверка порядка в dataSet ===');

function checkDataSetOrder(children, label) {
  console.log(`\n${label}:`);
  
  const uniqueTags = [...new Set(children.map(c => c.tag))];
  const tagPositions = {};
  
  uniqueTags.forEach(tag => {
    const positions = children
      .map((c, idx) => c.tag === tag ? idx : -1)
      .filter(idx => idx >= 0);
    tagPositions[tag] = positions;
  });
  
  // Проверяем порядок
  let hasError = false;
  
  // name должно быть первым
  if (tagPositions['name'] && tagPositions['name'][0] !== 0) {
    console.log(`  ✗ name не на первом месте (позиция ${tagPositions['name'][0] + 1})`);
    hasError = true;
  }
  
  // field должны быть после name, но до dataSource и query
  if (tagPositions['field']) {
    const maxFieldIdx = Math.max(...tagPositions['field']);
    const minDataSourceIdx = tagPositions['dataSource'] ? Math.min(...tagPositions['dataSource']) : Infinity;
    const minQueryIdx = tagPositions['query'] ? Math.min(...tagPositions['query']) : Infinity;
    
    if (maxFieldIdx > minDataSourceIdx) {
      console.log(`  ✗ field после dataSource (field на ${maxFieldIdx + 1}, dataSource на ${minDataSourceIdx + 1})`);
      hasError = true;
    }
    
    if (maxFieldIdx > minQueryIdx) {
      console.log(`  ✗ field после query (field на ${maxFieldIdx + 1}, query на ${minQueryIdx + 1})`);
      hasError = true;
    }
  }
  
  // dataSource должно быть перед query
  if (tagPositions['dataSource'] && tagPositions['query']) {
    const maxDsIdx = Math.max(...tagPositions['dataSource']);
    const minQIdx = Math.min(...tagPositions['query']);
    
    if (maxDsIdx > minQIdx) {
      console.log(`  ✗ dataSource после query (dataSource на ${maxDsIdx + 1}, query на ${minQIdx + 1})`);
      hasError = true;
    }
  }
  
  if (!hasError) {
    console.log('  ✓ Порядок правильный');
  }
  
  return !hasError;
}

let ds1Ok = true;
let ds2Ok = true;

if (!isForm && ds1Children.length > 0 && ds2Children.length > 0) {
  ds1Ok = checkDataSetOrder(ds1Children, 'Template1');
  ds2Ok = checkDataSetOrder(ds2Children, 'Template2');
}

// Проверяем порядок внутри field элементов (только для DCS)
if (!isForm) {
  console.log('\n=== Порядок тегов внутри field ===\n');

  const fields2 = order2.filter(o => o.path.match(/\/dataSet\[0\]\/field\[\d+\]$/));

  console.log(`Полей в Template2 dataSet: ${fields2.length}`);

// Берем несколько полей для проверки
fields2.slice(0, 5).forEach((field, idx) => {
  const fieldPath = field.path;
  const fieldChildren = order2.filter(o => 
    o.path.startsWith(fieldPath + '/') && 
    o.path.split('/').length === fieldPath.split('/').length + 1
  );
  
  console.log(`\nПоле ${idx + 1}: ${fieldPath}`);
  console.log(`  Атрибуты: ${JSON.stringify(field.attrs)}`);
  console.log(`  Дочерние теги (${fieldChildren.length}):`);
  fieldChildren.forEach((c, i) => {
    console.log(`    ${i + 1}. ${c.tag}`);
  });
});

// Проверяем последнее поле (НовоеПоле6)
const lastField = fields2[fields2.length - 1];
if (lastField) {
  const lastFieldChildren = order2.filter(o => 
    o.path.startsWith(lastField.path + '/') && 
    o.path.split('/').length === lastField.path.split('/').length + 1
  );
  
  console.log(`\n⚠️ ПОСЛЕДНЕЕ ПОЛЕ (НовоеПоле6): ${lastField.path}`);
  console.log(`  Атрибуты: ${JSON.stringify(lastField.attrs)}`);
  console.log(`  Дочерние теги (${lastFieldChildren.length}):`);
  lastFieldChildren.forEach((c, i) => {
    console.log(`    ${i + 1}. ${c.tag}`);
  });
}

    // Анализируем структуру всего файла
    console.log('\n=== ИТОГОВЫЙ ДИАГНОЗ ===\n');

    if (!ds2Ok) {
      console.log('✗ НАЙДЕНА ПРОБЛЕМА: Нарушен порядок тегов внутри dataSet!');
      console.log('  Правильный порядок в dataSet:');
      console.log('  1. <name>');
      console.log('  2. <field> (все поля)');
      console.log('  3. <dataSource>');
      console.log('  4. <query>');
    } else {
      console.log('✓ Порядок внутри dataSet правильный');
    }
  }
}

