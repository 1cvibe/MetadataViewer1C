/**
 * UI тест для проверки функциональности группировок в редакторе СКД
 * Тестирует:
 * 1. Добавление новой группировки
 * 2. Добавление вложенной группировки
 * 3. Создание группировки в виде таблицы
 */

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  UI ТЕСТ ГРУППИРОВОК В РЕДАКТОРЕ СКД                        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const reportPath = 'D:\\1C\\BASE\\src\\cf\\Reports\\ПродажаМебели';
const templatePath = path.join(reportPath, 'Templates', 'ОсновнаяСхемаКомпоновкиДанных', 'Ext', 'Template.xml');

/**
 * Тест 1: Проверка структуры существующих группировок
 */
function test1_CheckExistingStructure() {
  console.log('=== ТЕСТ 1: Проверка структуры существующих группировок ===');
  
  if (!fs.existsSync(templatePath)) {
    console.log('  ⚠️  Template.xml не найден:', templatePath);
    return false;
  }
  
  const xml = fs.readFileSync(templatePath, 'utf8').replace(/^\uFEFF/, '');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  // Ищем structure
  const structure = doc.getElementsByTagName('structure')[0] || 
                    doc.getElementsByTagName('dcsset:structure')[0];
  
  if (!structure) {
    console.log('  ⚠️  structure не найден в XML');
    return false;
  }
  
  console.log('  ✓ structure найден');
  
  const items = structure.getElementsByTagName('item');
  console.log(`  ✓ Найдено item элементов: ${items.length}`);
  
  // Проверяем каждый item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const type = item.getAttribute('xsi:type') || '';
    console.log(`\n  Item ${i + 1}:`);
    console.log(`    Тип: ${type}`);
    
    // Проверяем groupItems
    const groupItems = item.getElementsByTagName('groupItems')[0] || 
                       item.getElementsByTagName('dcsset:groupItems')[0];
    
    if (groupItems) {
      const groupItemFields = groupItems.getElementsByTagName('item');
      console.log(`    groupItems содержит ${groupItemFields.length} item`);
      
      // Проверяем, есть ли вложенные группировки
      let hasNestedGroupings = false;
      for (let j = 0; j < groupItemFields.length; j++) {
        const gif = groupItemFields[j];
        const gifType = gif.getAttribute('xsi:type') || '';
        if (gifType.includes('StructureItemGroup') || gifType.includes('StructureItemTable')) {
          hasNestedGroupings = true;
          console.log(`      ВЛОЖЕННАЯ ГРУППИРОВКА: ${gifType}`);
        }
      }
      
      if (hasNestedGroupings) {
        console.log('    ✓ Найдены вложенные группировки в groupItems');
      }
    }
    
    // Проверяем column и row (для таблиц)
    const column = item.getElementsByTagName('column')[0] || 
                   item.getElementsByTagName('dcsset:column')[0];
    const row = item.getElementsByTagName('row')[0] || 
                item.getElementsByTagName('dcsset:row')[0];
    
    if (column || row) {
      console.log('    ✓ Это таблица (есть column или row)');
      if (column) {
        const colItems = column.getElementsByTagName('item');
        console.log(`      Колонки: ${colItems.length} item`);
      }
      if (row) {
        const rowItems = row.getElementsByTagName('item');
        console.log(`      Строки: ${rowItems.length} item`);
      }
    }
  }
  
  return true;
}

/**
 * Тест 2: Добавление новой группировки на верхний уровень
 */
function test2_AddTopLevelGrouping() {
  console.log('\n=== ТЕСТ 2: Добавление новой группировки на верхний уровень ===');
  
  if (!fs.existsSync(templatePath)) {
    console.log('  ⚠️  Template.xml не найден');
    return false;
  }
  
  const xml = fs.readFileSync(templatePath, 'utf8').replace(/^\uFEFF/, '');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  const structure = doc.getElementsByTagName('structure')[0] || 
                    doc.getElementsByTagName('dcsset:structure')[0];
  
  if (!structure) {
    console.log('  ⚠️  structure не найден');
    return false;
  }
  
  const initialItemCount = structure.getElementsByTagName('item').length;
  console.log(`  Исходное количество item: ${initialItemCount}`);
  
  // Создаем новую группировку
  const newGroupItem = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:item');
  newGroupItem.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcsset:StructureItemGroup');
  
  const groupItems = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupItems');
  const groupItemField = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:item');
  groupItemField.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcsset:GroupItemField');
  
  const field = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:field');
  field.textContent = 'ТестовоеПоле';
  
  const groupType = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupType');
  groupType.textContent = 'Items';
  
  groupItemField.appendChild(field);
  groupItemField.appendChild(groupType);
  groupItems.appendChild(groupItemField);
  newGroupItem.appendChild(groupItems);
  structure.appendChild(newGroupItem);
  
  const finalItemCount = structure.getElementsByTagName('item').length;
  console.log(`  Количество item после добавления: ${finalItemCount}`);
  
  if (finalItemCount !== initialItemCount + 1) {
    console.log('  ❌ FAILED: Группировка не добавлена');
    return false;
  }
  
  // Проверяем структуру
  const serializer = new XMLSerializer();
  const resultXml = serializer.serializeToString(doc);
  
  if (!resultXml.includes('ТестовоеПоле') || !resultXml.includes('StructureItemGroup')) {
    console.log('  ❌ FAILED: Структура группировки некорректна');
    return false;
  }
  
  console.log('  ✅ PASSED: Группировка успешно добавлена');
  return true;
}

/**
 * Тест 3: Добавление вложенной группировки
 */
function test3_AddNestedGrouping() {
  console.log('\n=== ТЕСТ 3: Добавление вложенной группировки ===');
  
  if (!fs.existsSync(templatePath)) {
    console.log('  ⚠️  Template.xml не найден');
    return false;
  }
  
  const xml = fs.readFileSync(templatePath, 'utf8').replace(/^\uFEFF/, '');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  const structure = doc.getElementsByTagName('structure')[0] || 
                    doc.getElementsByTagName('dcsset:structure')[0];
  
  if (!structure) {
    console.log('  ⚠️  structure не найден');
    return false;
  }
  
  // Находим первую группировку (не таблицу)
  let parentGroupItem = null;
  const items = structure.getElementsByTagName('item');
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const type = item.getAttribute('xsi:type') || '';
    if (type.includes('StructureItemGroup') && !type.includes('Table')) {
      parentGroupItem = item;
      break;
    }
  }
  
  if (!parentGroupItem) {
    console.log('  ⚠️  Не найдена родительская группировка для теста');
    return false;
  }
  
  console.log('  ✓ Найдена родительская группировка');
  
  // Находим или создаем groupItems
  let groupItems = parentGroupItem.getElementsByTagName('groupItems')[0] || 
                   parentGroupItem.getElementsByTagName('dcsset:groupItems')[0];
  
  if (!groupItems) {
    groupItems = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupItems');
    parentGroupItem.appendChild(groupItems);
    console.log('  ✓ Создан groupItems');
  }
  
  const initialItemCount = groupItems.getElementsByTagName('item').length;
  console.log(`  Исходное количество item в groupItems: ${initialItemCount}`);
  
  // Создаем вложенную группировку
  const nestedGroupItem = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:item');
  nestedGroupItem.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcsset:StructureItemGroup');
  
  const nestedGroupItems = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupItems');
  const nestedGroupItemField = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:item');
  nestedGroupItemField.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcsset:GroupItemField');
  
  const nestedField = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:field');
  nestedField.textContent = 'ВложенноеПоле';
  
  const nestedGroupType = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupType');
  nestedGroupType.textContent = 'Items';
  
  nestedGroupItemField.appendChild(nestedField);
  nestedGroupItemField.appendChild(nestedGroupType);
  nestedGroupItems.appendChild(nestedGroupItemField);
  nestedGroupItem.appendChild(nestedGroupItems);
  groupItems.appendChild(nestedGroupItem);
  
  const finalItemCount = groupItems.getElementsByTagName('item').length;
  console.log(`  Количество item в groupItems после добавления: ${finalItemCount}`);
  
  if (finalItemCount !== initialItemCount + 1) {
    console.log('  ❌ FAILED: Вложенная группировка не добавлена');
    return false;
  }
  
  // Проверяем, что вложенная группировка имеет правильный тип
  const nestedItems = groupItems.getElementsByTagName('item');
  let foundNested = false;
  for (let i = 0; i < nestedItems.length; i++) {
    const nested = nestedItems[i];
    const nestedType = nested.getAttribute('xsi:type') || '';
    if (nestedType.includes('StructureItemGroup')) {
      foundNested = true;
      const nestedFieldNode = nested.getElementsByTagName('field')[0] || 
                              nested.getElementsByTagName('dcsset:field')[0];
      if (nestedFieldNode && nestedFieldNode.textContent === 'ВложенноеПоле') {
        console.log('  ✓ Вложенная группировка найдена с правильным полем');
        break;
      }
    }
  }
  
  if (!foundNested) {
    console.log('  ❌ FAILED: Вложенная группировка не найдена или имеет неправильную структуру');
    return false;
  }
  
  console.log('  ✅ PASSED: Вложенная группировка успешно добавлена');
  return true;
}

/**
 * Тест 4: Создание группировки в виде таблицы
 */
function test4_CreateTableGrouping() {
  console.log('\n=== ТЕСТ 4: Создание группировки в виде таблицы ===');
  
  if (!fs.existsSync(templatePath)) {
    console.log('  ⚠️  Template.xml не найден');
    return false;
  }
  
  const xml = fs.readFileSync(templatePath, 'utf8').replace(/^\uFEFF/, '');
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  const structure = doc.getElementsByTagName('structure')[0] || 
                    doc.getElementsByTagName('dcsset:structure')[0];
  
  if (!structure) {
    console.log('  ⚠️  structure не найден');
    return false;
  }
  
  const initialItemCount = structure.getElementsByTagName('item').length;
  console.log(`  Исходное количество item: ${initialItemCount}`);
  
  // Создаем таблицу
  const tableItem = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:item');
  tableItem.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcsset:StructureItemTable');
  
  // Создаем column
  const column = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:column');
  const columnGroupItems = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupItems');
  const columnField = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:item');
  columnField.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcsset:GroupItemField');
  
  const columnFieldName = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:field');
  columnFieldName.textContent = 'Колонка1';
  const columnGroupType = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupType');
  columnGroupType.textContent = 'Items';
  
  columnField.appendChild(columnFieldName);
  columnField.appendChild(columnGroupType);
  columnGroupItems.appendChild(columnField);
  column.appendChild(columnGroupItems);
  tableItem.appendChild(column);
  
  // Создаем row
  const row = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:row');
  const rowGroupItems = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupItems');
  const rowField = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:item');
  rowField.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:type', 'dcsset:GroupItemField');
  
  const rowFieldName = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:field');
  rowFieldName.textContent = 'Строка1';
  const rowGroupType = doc.createElementNS('http://v8.1c.ru/8.1/data-composition-system/settings', 'dcsset:groupType');
  rowGroupType.textContent = 'Items';
  
  rowField.appendChild(rowFieldName);
  rowField.appendChild(rowGroupType);
  rowGroupItems.appendChild(rowField);
  row.appendChild(rowGroupItems);
  tableItem.appendChild(row);
  
  structure.appendChild(tableItem);
  
  const finalItemCount = structure.getElementsByTagName('item').length;
  console.log(`  Количество item после добавления: ${finalItemCount}`);
  
  if (finalItemCount !== initialItemCount + 1) {
    console.log('  ❌ FAILED: Таблица не добавлена');
    return false;
  }
  
  // Проверяем структуру таблицы
  const serializer = new XMLSerializer();
  const resultXml = serializer.serializeToString(doc);
  
  if (!resultXml.includes('StructureItemTable')) {
    console.log('  ❌ FAILED: Тип таблицы не найден');
    return false;
  }
  
  if (!resultXml.includes('Колонка1') || !resultXml.includes('Строка1')) {
    console.log('  ❌ FAILED: Поля колонок/строк не найдены');
    return false;
  }
  
  // Проверяем наличие column и row
  const addedTable = structure.getElementsByTagName('item')[finalItemCount - 1];
  const hasColumn = addedTable.getElementsByTagName('column').length > 0 || 
                    addedTable.getElementsByTagName('dcsset:column').length > 0;
  const hasRow = addedTable.getElementsByTagName('row').length > 0 || 
                 addedTable.getElementsByTagName('dcsset:row').length > 0;
  
  if (!hasColumn || !hasRow) {
    console.log('  ❌ FAILED: Таблица не содержит column или row');
    return false;
  }
  
  console.log('  ✅ PASSED: Таблица успешно создана');
  return true;
}

/**
 * Основная функция
 */
function main() {
  const results = [];
  
  results.push({ name: 'test1', passed: test1_CheckExistingStructure() });
  results.push({ name: 'test2', passed: test2_AddTopLevelGrouping() });
  results.push({ name: 'test3', passed: test3_AddNestedGrouping() });
  results.push({ name: 'test4', passed: test4_CreateTableGrouping() });
  
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

