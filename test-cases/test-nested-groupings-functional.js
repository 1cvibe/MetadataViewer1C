/**
 * Функциональный тест вложенных группировок
 * Тестирует логику добавления вложенных группировок на тестовых данных
 */

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  ФУНКЦИОНАЛЬНЫЙ ТЕСТ ВЛОЖЕННЫХ ГРУППИРОВОК                    ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

/**
 * Создает тестовую DCS схему с простой группировкой
 */
function createTestDcsWithGrouping() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<DataCompositionSchema xmlns="http://v8.1c.ru/8.1/data-composition-system/schema" 
                       xmlns:dcscom="http://v8.1c.ru/8.1/data-composition-system/common" 
                       xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" 
                       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <dataSource>
        <name>ИсточникДанных1</name>
        <dataSourceType>Local</dataSourceType>
    </dataSource>
    <dataSet xsi:type="DataSetQuery">
        <name>НаборДанных1</name>
        <query>ВЫБРАТЬ Поле1, Поле2 ИЗ Таблица</query>
    </dataSet>
    <settingsVariant>
        <name>Вариант1</name>
        <settings>
            <structure>
                <item xsi:type="dcsset:StructureItemGroup">
                    <groupItems>
                        <item xsi:type="dcsset:GroupItemField">
                            <field>Поле1</field>
                            <groupType>Items</groupType>
                        </item>
                    </groupItems>
                </item>
            </structure>
        </settings>
    </settingsVariant>
</DataCompositionSchema>`;
}

/**
 * Имитирует логику getAllGroupingsForParent из DcsEditorApp
 */
function getAllGroupingsForParent(structureNode) {
  const result = [];
  
  const localTag = (tag) => {
    const t = String(tag || '');
    const idx = t.lastIndexOf(':');
    return idx >= 0 ? t.slice(idx + 1) : t;
  };
  
  const walkNode = (node, prefix = '') => {
    if (!node || node.nodeType !== 1) return; // ELEMENT_NODE
    
    const nodeType = node.getAttribute('xsi:type') || '';
    const isGroup = nodeType.includes('StructureItemGroup');
    const isTable = nodeType.includes('StructureItemTable');
    const isColumn = localTag(node.tagName) === 'column';
    const isRow = localTag(node.tagName) === 'row';
    
    if (isGroup || isTable) {
      const label = prefix + (isTable ? '📊 Таблица' : '📁 Группировка');
      result.push({ path: node.tagName, label, node });
    } else if (isColumn || isRow) {
      const label = prefix + (isColumn ? '📋 Колонки' : '📊 Строки');
      result.push({ path: node.tagName, label, node });
    }
    
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === 1) {
        walkNode(child, prefix + '  ');
      }
    }
  };
  
  if (structureNode) {
    walkNode(structureNode, '');
  }
  
  return result;
}

/**
 * Тест 1: Поиск существующих группировок
 */
function test1_FindExistingGroupings() {
  console.log('=== ТЕСТ 1: Поиск существующих группировок ===');
  
  const xml = createTestDcsWithGrouping();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  // Находим structure
  const structure = doc.getElementsByTagName('structure')[0];
  if (!structure) {
    console.log('  ❌ FAILED: structure не найден');
    return false;
  }
  
  const groupings = getAllGroupingsForParent(structure);
  console.log(`  Найдено группировок: ${groupings.length}`);
  
  if (groupings.length === 0) {
    console.log('  ❌ FAILED: Не найдено группировок');
    return false;
  }
  
  console.log(`  ✅ PASSED: Найдена группировка "${groupings[0].label}"`);
  return true;
}

/**
 * Тест 2: Добавление вложенной группировки
 */
function test2_AddNestedGrouping() {
  console.log('\n=== ТЕСТ 2: Добавление вложенной группировки ===');
  
  const xml = createTestDcsWithGrouping();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  // Находим structure и первую группировку
  const structure = doc.getElementsByTagName('structure')[0];
  const firstGroup = doc.getElementsByTagName('item')[0]; // Первая StructureItemGroup
  
  if (!firstGroup) {
    console.log('  ❌ FAILED: Группировка не найдена');
    return false;
  }
  
  // Находим или создаем groupItems
  let groupItems = null;
  for (let i = 0; i < firstGroup.childNodes.length; i++) {
    const child = firstGroup.childNodes[i];
    if (child.nodeType === 1 && child.tagName === 'groupItems') {
      groupItems = child;
      break;
    }
  }
  
  if (!groupItems) {
    console.log('  ❌ FAILED: groupItems не найден');
    return false;
  }
  
  // Создаем вложенную группировку
  const nestedGroup = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:item');
  nestedGroup.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcsset:StructureItemGroup');
  
  const nestedGroupItems = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupItems');
  const nestedField = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:item');
  nestedField.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcsset:GroupItemField');
  
  const fieldNode = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:field');
  fieldNode.textContent = 'Поле2';
  nestedField.appendChild(fieldNode);
  
  const groupTypeNode = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupType');
  groupTypeNode.textContent = 'Items';
  nestedField.appendChild(groupTypeNode);
  
  nestedGroupItems.appendChild(nestedField);
  nestedGroup.appendChild(nestedGroupItems);
  
  // Добавляем вложенную группировку в groupItems
  groupItems.appendChild(nestedGroup);
  
  // Проверяем результат (ищем по локальному имени и namespace)
  const allItems = [];
  for (let i = 0; i < groupItems.childNodes.length; i++) {
    const child = groupItems.childNodes[i];
    if (child.nodeType === 1 && (child.localName === 'item' || child.tagName.includes('item'))) {
      allItems.push(child);
    }
  }
  
  const nestedGroups = allItems.filter(item => {
    const type = item.getAttribute('xsi:type') || item.getAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'type') || '';
    return type.includes('StructureItemGroup');
  });
  
  console.log(`  Всего item в groupItems: ${allItems.length}`);
  console.log(`  Вложенных группировок: ${nestedGroups.length}`);
  
  if (nestedGroups.length === 0) {
    console.log('  ❌ FAILED: Вложенная группировка не добавлена');
    return false;
  }
  
  // Проверяем структуру (ищем field по локальному имени)
  let nestedFieldValue = null;
  for (let i = 0; i < nestedGroups[0].childNodes.length; i++) {
    const groupItemsNode = nestedGroups[0].childNodes[i];
    if (groupItemsNode.nodeType === 1 && (groupItemsNode.localName === 'groupItems' || groupItemsNode.tagName.includes('groupItems'))) {
      for (let j = 0; j < groupItemsNode.childNodes.length; j++) {
        const fieldItem = groupItemsNode.childNodes[j];
        if (fieldItem.nodeType === 1 && (fieldItem.localName === 'item' || fieldItem.tagName.includes('item'))) {
          for (let k = 0; k < fieldItem.childNodes.length; k++) {
            const fieldNode = fieldItem.childNodes[k];
            if (fieldNode.nodeType === 1 && (fieldNode.localName === 'field' || fieldNode.tagName.includes('field'))) {
              nestedFieldValue = fieldNode.textContent;
              break;
            }
          }
        }
      }
    }
  }
  
  if (nestedFieldValue !== 'Поле2') {
    console.log(`  ❌ FAILED: Неправильное поле (ожидалось Поле2, получено ${nestedFieldValue || 'null'})`);
    return false;
  }
  
  console.log('  ✅ PASSED: Вложенная группировка успешно добавлена');
  
  // Сериализуем для проверки
  const serializer = new XMLSerializer();
  const resultXml = serializer.serializeToString(doc);
  
  // Проверяем, что вложенная группировка есть в XML
  if (!resultXml.includes('Поле2') || !resultXml.includes('StructureItemGroup')) {
    console.log('  ⚠️  WARNING: Вложенная группировка может быть некорректно сериализована');
  }
  
  return true;
}

/**
 * Тест 3: Поиск вложенных группировок после добавления
 */
function test3_FindNestedGroupings() {
  console.log('\n=== ТЕСТ 3: Поиск вложенных группировок ===');
  
  const xml = createTestDcsWithGrouping();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  // Добавляем вложенную группировку (как в тесте 2)
  const structure = doc.getElementsByTagName('structure')[0];
  const firstGroup = doc.getElementsByTagName('item')[0];
  let groupItems = null;
  for (let i = 0; i < firstGroup.childNodes.length; i++) {
    const child = firstGroup.childNodes[i];
    if (child.nodeType === 1 && child.tagName === 'groupItems') {
      groupItems = child;
      break;
    }
  }
  
  if (!groupItems) {
    console.log('  ❌ FAILED: groupItems не найден');
    return false;
  }
  
  // Создаем и добавляем вложенную группировку
  const nestedGroup = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:item');
  nestedGroup.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcsset:StructureItemGroup');
  const nestedGroupItems = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupItems');
  const nestedField = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:item');
  nestedField.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcsset:GroupItemField');
  const fieldNode = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:field');
  fieldNode.textContent = 'Поле2';
  nestedField.appendChild(fieldNode);
  nestedGroupItems.appendChild(nestedField);
  nestedGroup.appendChild(nestedGroupItems);
  groupItems.appendChild(nestedGroup);
  
  // Ищем все группировки
  const groupings = getAllGroupingsForParent(structure);
  
  console.log(`  Найдено группировок: ${groupings.length}`);
  
  if (groupings.length < 2) {
    console.log('  ❌ FAILED: Не найдены вложенные группировки');
    return false;
  }
  
  // Проверяем, что есть вложенная группировка
  const hasNested = groupings.some(g => g.label.includes('  ')); // Вложенные имеют отступ
  
  if (!hasNested) {
    console.log('  ❌ FAILED: Вложенные группировки не найдены');
    return false;
  }
  
  console.log('  ✅ PASSED: Вложенные группировки найдены');
  groupings.forEach((g, idx) => {
    console.log(`    ${idx + 1}. ${g.label}`);
  });
  
  return true;
}

/**
 * Основная функция
 */
function main() {
  const results = [];
  
  results.push({ name: 'test1', passed: test1_FindExistingGroupings() });
  results.push({ name: 'test2', passed: test2_AddNestedGrouping() });
  results.push({ name: 'test3', passed: test3_FindNestedGroupings() });
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  ИТОГИ                                                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`Пройдено: ${passed}/${total}\n`);
  
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`  ${icon} ${r.name}`);
  });
  
  if (passed === total) {
    console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!');
    process.exit(0);
  } else {
    console.log('\n⚠️  ЕСТЬ НЕПРОЙДЕННЫЕ ТЕСТЫ');
    process.exit(1);
  }
}

main();

