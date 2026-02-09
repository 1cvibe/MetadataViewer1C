// Тест функции reorderRootSectionsForSave

// Создаем тестовые узлы в неправильном порядке
const testNodes = [
  { path: '0', tag: 'parameter', attrs: {}, children: [] },
  { path: '1', tag: 'calculatedField', attrs: {}, children: [] },
  { path: '2', tag: 'settingsVariant', attrs: {}, children: [] },
  { path: '3', tag: 'totalField', attrs: {}, children: [] },
  { path: '4', tag: 'template', attrs: {}, children: [] },
  { path: '5', tag: 'dataSet', attrs: {}, children: [] },
  { path: '6', tag: 'dataSource', attrs: {}, children: [] },
  { path: '7', tag: 'dataSetLink', attrs: {}, children: [] },
];

console.log('=== Тест reorderRootSectionsForSave ===\n');
console.log('Исходный порядок (неправильный):');
testNodes.forEach((n, i) => console.log(`  ${i + 1}. ${n.tag}`));

// Реализация логики reorderRootSectionsForSave (как в исправленном коде)
function reorderRootSectionsForSave(nodes) {
  const list = Array.isArray(nodes) ? nodes.slice() : [];

  const localTag = (tag) => {
    const t = String(tag || '');
    const idx = t.lastIndexOf(':');
    return idx >= 0 ? t.slice(idx + 1) : t;
  };

  const dataSources = [];
  const dataSets = [];
  const links = [];
  const totals = [];
  const calcs = [];
  const params = [];
  const templates = [];
  const settings = [];
  const others = [];

  for (const n of list) {
    const lt = localTag(n?.tag);
    if (lt === 'dataSource') dataSources.push(n);
    else if (lt === 'dataSet') dataSets.push(n);
    else if (lt === 'dataSetLink') links.push(n);
    else if (lt === 'totalField') totals.push(n);
    else if (lt === 'calculatedField') calcs.push(n);
    else if (lt === 'parameter') params.push(n);
    else if (lt === 'template' || lt === 'groupTemplate' || lt === 'totalFieldsTemplate') templates.push(n);
    else if (lt === 'settingsVariant') settings.push(n);
    else others.push(n);
  }

  return [
    ...dataSources,
    ...dataSets,
    ...links,
    ...totals,
    ...calcs,
    ...params,
    ...templates,
    ...settings,
    ...others
  ];
}

const reordered = reorderRootSectionsForSave(testNodes);

console.log('\nПолученный порядок (правильный):');
reordered.forEach((n, i) => console.log(`  ${i + 1}. ${n.tag}`));

// Проверяем правильность
const expectedOrder = ['dataSource', 'dataSet', 'dataSetLink', 'totalField', 'calculatedField', 'parameter', 'template', 'settingsVariant'];
const actualTags = reordered.map(n => n.tag);

console.log('\n=== Проверка ===');

let correct = true;
for (let i = 0; i < actualTags.length - 1; i++) {
  const current = actualTags[i];
  const next = actualTags[i + 1];
  
  const currentIdx = expectedOrder.indexOf(current);
  const nextIdx = expectedOrder.indexOf(next);
  
  if (currentIdx > nextIdx) {
    console.log(`✗ ${current} НЕ ДОЛЖЕН быть перед ${next}`);
    correct = false;
  } else {
    console.log(`✓ ${current} → ${next}`);
  }
}

if (correct) {
  console.log('\n✓ Порядок полностью правильный!');
  console.log('\nИтоговая последовательность соответствует 1С:');
  expectedOrder.forEach((tag, i) => {
    console.log(`  ${i + 1}. ${tag}`);
  });
} else {
  console.log('\n✗ Порядок нарушен!');
  process.exit(1);
}

