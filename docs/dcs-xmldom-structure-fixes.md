# Исправление структуры XML в DCS редакторе (xmldom)

## Проблемы (найдены в test-cases/compare)

При сравнении Template1.xml (до) и Template2.xml (после) были найдены **4 критические проблемы**:

### 1️⃣ Лишние пустые строки
```
Template2.xml имеет 37 пустых строк в начале файла (строки 3-40)
```

### 2️⃣ Потеряны отступы
```
Template1: "\t" (1 символ табуляции)
Template2: "" (0 символов)
```

### 3️⃣ Неправильный порядок корневых элементов
```
[29] parameter → totalField ❌
[35] settingsVariant → parameter ❌
```

### 4️⃣ field перед query в dataSet
```
❌ КРИТИЧЕСКАЯ ОШИБКА:
dataSet[0]: field на позиции 1, query на позиции 17
dataSet[1]: field на позиции 1, query на позиции 26

✅ ПРАВИЛЬНО:
name → query → field → dataSource
```

## Исправления

### 1️⃣ Форматирование XML (`src/xmlParsers/dcsSerializerXmldom.ts`)

#### Проблема
Функция `updateDomFromNodes` добавляла лишние пустые строки, а `createElementFromNode` неправильно рассчитывала отступы на основе `node.path`.

#### Решение

**`updateDomFromNodes`:**
```typescript
export function updateDomFromNodes(
  doc: Document,
  rootElement: Element,
  newChildren: ParsedDcsNode[]
): void {
  // ВАЖНО: Удаляем ВСЕ дочерние узлы (включая текстовые)
  // чтобы создать чистую структуру без лишних пустых строк
  while (rootElement.firstChild) {
    rootElement.removeChild(rootElement.firstChild);
  }
  
  // Добавляем начальный перенос строки
  rootElement.appendChild(doc.createTextNode('\n'));
  
  // Добавляем новые элементы
  for (const childNode of newChildren) {
    // Отступ (1 табуляция для корневых элементов)
    rootElement.appendChild(doc.createTextNode('\t'));
    
    // Сам элемент
    const element = createElementFromNode(doc, childNode, 1);
    rootElement.appendChild(element);
    
    // Перенос строки после элемента
    rootElement.appendChild(doc.createTextNode('\n'));
  }
}
```

**`createElementFromNode`:**
```typescript
function createElementFromNode(doc: Document, node: ParsedDcsNode, depth: number): Element {
  const element = doc.createElement(node.tag);
  
  // Устанавливаем атрибуты
  for (const [key, value] of Object.entries(node.attrs || {})) {
    const attrName = key.startsWith('@_') ? key.slice(2) : key;
    element.setAttribute(attrName, String(value));
  }
  
  // Если есть дочерние элементы
  if (node.children && node.children.length > 0) {
    element.appendChild(doc.createTextNode('\n'));
    
    const childIndent = '\t'.repeat(depth + 1);
    
    for (const child of node.children) {
      element.appendChild(doc.createTextNode(childIndent));
      const childElement = createElementFromNode(doc, child, depth + 1);
      element.appendChild(childElement);
      element.appendChild(doc.createTextNode('\n'));
    }
    
    element.appendChild(doc.createTextNode('\t'.repeat(depth)));
  }
  // Если нет детей, но есть текст
  else if (node.text) {
    element.appendChild(doc.createTextNode(node.text));
  }
  
  return element;
}
```

**Изменения:**
- ✅ Передаем `depth` явно (вместо расчета из `node.path`)
- ✅ Удаляем ВСЕ дочерние узлы (не только элементы)
- ✅ Добавляем отступы явно (`\t`.repeat(depth))

### 2️⃣ Переупорядочивание детей dataSet (`src/dcsEditor.ts`)

#### Проблема
В 1С СКД элементы внутри dataSet должны идти в строгом порядке:
```
name → query → field → dataSource → остальные
```

Но Template2.xml имел:
```
name → field → field → ... → query  ❌
```

#### Решение

**Новая функция `reorderDataSetChildren`:**
```typescript
private reorderDataSetChildren(dataSetNode: ParsedDcsNode): ParsedDcsNode {
  if (!dataSetNode.children || dataSetNode.children.length === 0) {
    return dataSetNode;
  }

  const localTag = (tag: string) => {
    const t = String(tag || '');
    const idx = t.lastIndexOf(':');
    return idx >= 0 ? t.slice(idx + 1) : t;
  };

  const children = dataSetNode.children.slice();
  
  const names: ParsedDcsNode[] = [];
  const queries: ParsedDcsNode[] = [];
  const fields: ParsedDcsNode[] = [];
  const dataSources: ParsedDcsNode[] = [];
  const others: ParsedDcsNode[] = [];

  for (const child of children) {
    const lt = localTag(child.tag);
    if (lt === 'name') names.push(child);
    else if (lt === 'query' || lt === 'items') queries.push(child);
    else if (lt === 'field') fields.push(child);
    else if (lt === 'dataSource') dataSources.push(child);
    else others.push(child);
  }

  // Правильный порядок: name, query, field, dataSource, others
  const reorderedChildren = [
    ...names,
    ...queries,
    ...fields,
    ...dataSources,
    ...others
  ];

  return {
    ...dataSetNode,
    children: reorderedChildren
  };
}
```

**Вызов в `reorderRootSectionsForSave`:**
```typescript
// Переупорядочиваем детей dataSet (query должен быть перед field)
const reorderedDataSets = dataSets.map(ds => this.reorderDataSetChildren(ds));

// Собираем в правильном порядке
return [
  ...dataSources,
  ...reorderedDataSets,  // ← Используем переупорядоченные!
  ...links,
  ...totals,
  ...calcs,
  ...params,
  ...templates,
  ...settings,
  ...others
];
```

## Тестирование

### Созданные тесты

1. ✅ `test-cases/compare-xmldom-structure.js` - Сравнение структуры Template1 и Template2
2. ✅ `test-cases/test-full-reparse.js` - Полный тест парсинга и сериализации
3. ✅ `test-cases/test-dataset-order.js` - Проверка порядка в dataSet
4. ✅ `test-cases/test-full-flow-with-reorder.js` - Полный flow как в редакторе
5. ✅ `test-cases/compare-final-result.js` - Сравнение финального результата

### Результаты тестирования

```bash
$ node test-cases/test-full-flow-with-reorder.js

=== ИТОГ ===

✅ ВСЕ dataSet имеют правильный порядок элементов!
   Функция reorderDataSetChildren работает корректно.
```

```bash
$ node test-cases/compare-final-result.js

=== Проверки ===

1. BOM: Оригинал ✓, Результат ✓ ✅
2. Отступы: Оригинал 1, Результат 1 ✅
3. Пустые строки (2-10): Оригинал 0, Результат 0 ✅
4. Кодировка: Оригинал ✓, Результат ✓ ✅
5. Порядок в dataSet: ✅ query перед field

=== ИТОГ ===

✅ ВСЁ ОТЛИЧНО!
👉 Файл готов для загрузки в 1С конфигуратор!
```

## Измененные файлы

1. ✅ `src/xmlParsers/dcsSerializerXmldom.ts`
   - Переработана функция `updateDomFromNodes`
   - Переработана функция `createElementFromNode` с параметром `depth`

2. ✅ `src/dcsEditor.ts`
   - Добавлена функция `reorderDataSetChildren`
   - Обновлена функция `reorderRootSectionsForSave`

3. ✅ `docs/dcs-xmldom-structure-fixes.md` (этот файл) - документация

## Правильная структура DCS

### Корневые элементы (DataCompositionSchema)
```xml
<DataCompositionSchema>
  <!-- 1. Источники данных -->
  <dataSource>...</dataSource>
  
  <!-- 2. Наборы данных -->
  <dataSet>...</dataSet>
  
  <!-- 3. Связи наборов -->
  <dataSetLink>...</dataSetLink>
  
  <!-- 4. Ресурсы (totalField) -->
  <totalField>...</totalField>
  
  <!-- 5. Вычисляемые поля -->
  <calculatedField>...</calculatedField>
  
  <!-- 6. Параметры -->
  <parameter>...</parameter>
  
  <!-- 7. Шаблоны -->
  <template>...</template>
  
  <!-- 8. Настройки -->
  <settingsVariant>...</settingsVariant>
</DataCompositionSchema>
```

### Элементы dataSet
```xml
<dataSet xsi:type="DataSetQuery">
  <!-- 1. Имя набора -->
  <name>НаборДанных1</name>
  
  <!-- 2. Запрос (ОБЯЗАТЕЛЬНО ПЕРЕД ПОЛЯМИ!) -->
  <query>SELECT ...</query>
  
  <!-- 3. Поля -->
  <field xsi:type="DataSetFieldField">...</field>
  <field xsi:type="DataSetFieldField">...</field>
  
  <!-- 4. Источник данных -->
  <dataSource>ИсточникДанных1</dataSource>
</dataSet>
```

## Итог

✅ **Все проблемы исправлены!**

| Проблема | До | После |
|----------|-----|-------|
| Пустые строки | ❌ 37 строк | ✅ 0 строк |
| Отступы | ❌ 0 символов | ✅ 1 табуляция |
| Порядок корневых | ❌ Неправильный | ✅ Правильный |
| Порядок в dataSet | ❌ field перед query | ✅ query перед field |
| BOM | ✅ Есть | ✅ Есть |
| Кодировка UTF-8 | ✅ Да | ✅ Да |

**DCS редактор полностью готов к работе с 1С конфигуратором!** 🎉

---

## Связанные документы

- `dcs-xmldom-refactoring.md` - Переработка на xmldom
- `dcs-encoding-bom-fix.md` - Исправление BOM и кодировки
- `dcs-circular-json-fix.md` - Исправление циклических ссылок
- `dcs-save-button-fix.md` - Исправление кнопки "Сохранить"

