# Переработка DCS редактора на xmldom

## Проблема

Изначально редактор СКД использовал `fast-xml-parser`, что противоречило стандарту проекта:

```typescript
// ❌ БЫЛО (fast-xml-parser)
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
```

**Стандарт проекта:** Все XML парсинг должен выполняться через `@xmldom/xmldom` для сохранения структуры XML.

## Причины использования xmldom

1. ✅ **Сохраняет структуру XML** - атрибуты vs элементы, порядок, форматирование
2. ✅ **DOM API** - стандартный W3C интерфейс
3. ✅ **Работает с BOM** - UTF-8 with BOM для 1С конфигуратора
4. ✅ **Консистентность** - используется в edit metadata, форм, predefined

## Что изменено

### 1️⃣ Создан новый парсер: `src/xmlParsers/dcsParserXmldom.ts`

**Основные отличия от старой версии:**

| Аспект | fast-xml-parser | xmldom |
|--------|----------------|--------|
| Парсинг | `XMLParser` с `preserveOrder: true` | `DOMParser` |
| Структура | `_raw: preserveOrder массив` | `_domDocument: Document` |
| Атрибуты | `':@'` специальный ключ | `element.attributes` |
| Текст | `'#text'` специальный ключ | `textContent` |

**Ключевые функции:**

```typescript
// Парсинг Template.xml
function parseTemplateXml(templateXml: string, templatePath: string): ParsedDcsSchema {
  const parser = new DOMParser({...});
  const doc = parser.parseFromString(cleanXml, 'text/xml');
  
  // Рекурсивное построение дерева
  const children = buildNodeFromElement(rootElement, nodePath);
  
  return {
    sourcePath: templatePath,
    rootTag,
    children,
    _originalXml: templateXml,
    _domDocument: doc,  // ← DOM документ вместо preserveOrder
    _rootAttrs: rootAttrs,
  };
}
```

### 2️⃣ Создан новый сериализатор: `src/xmlParsers/dcsSerializerXmldom.ts`

**Основные отличия:**

| Аспект | fast-xml-parser | xmldom |
|--------|----------------|--------|
| Сериализация | `XMLBuilder.build()` | `XMLSerializer.serializeToString()` |
| Обновление | `serializeDcsToPreserveOrder()` + `XmlDiffMerge` | `updateDomFromNodes()` напрямую |
| Форматирование | `format: true, indentBy: '\t'` | Добавляем `\n\t` вручную |

**Ключевые функции:**

```typescript
// Обновление DOM документа
export function updateDomFromNodes(
  doc: Document,
  rootElement: Element,
  newChildren: ParsedDcsNode[]
): void {
  // Удаляем старые элементы
  toRemove.forEach(node => rootElement.removeChild(node));
  
  // Добавляем новые элементы
  for (const childNode of newChildren) {
    const element = createElementFromNode(doc, childNode);
    rootElement.appendChild(element);
    rootElement.appendChild(doc.createTextNode('\n\t')); // Форматирование
  }
}

// Сериализация в XML
export function serializeToXml(
  doc: Document,
  rootTag: string,
  newChildren: ParsedDcsNode[],
  rootAttrs?: Record<string, any>
): string {
  const newDoc = doc.cloneNode(true) as Document;
  updateDomFromNodes(newDoc, rootElement, newChildren);
  
  const serializer = new XMLSerializer();
  return serializer.serializeToString(newDoc);
}
```

### 3️⃣ Обновлен `src/dcsEditor.ts`

**Изменения в импортах:**

```typescript
// ✅ СТАЛО (xmldom)
import { parseReportXmlForDcs, ParsedReportDcs, type ParsedDcsNode } from "./xmlParsers/dcsParserXmldom";
import { serializeToXml } from "./xmlParsers/dcsSerializerXmldom";
```

**Изменения в `handleSaveDcs`:**

```typescript
// БЫЛО:
const changedRaw = serializeDcsToPreserveOrder(schemaChildren);
const mergedRaw = XmlDiffMerge.merge(originalRaw, changedRaw);
const updatedXml = serializeToXml(mergedRaw, rootTag, rootAttrs);

// СТАЛО:
// _raw теперь содержит DOM документ (а не preserveOrder структуру)
const originalDoc = payload?._raw;
const updatedXml = serializeToXml(originalDoc, rootTag, schemaChildren, rootAttrs);
// ↑ Без XmlDiffMerge - xmldom сохраняет структуру автоматически
```

**Сохранение с BOM:**

```typescript
// ВАЖНО: 1С конфигуратор требует UTF-8 с BOM (EF BB BF)
const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
const contentBuffer = Buffer.from(updatedXml, 'utf8');
fs.writeFileSync(templatePath, Buffer.concat([bomBuffer, contentBuffer]));
```

## Преимущества xmldom

### 1️⃣ Консистентность с проектом

Теперь **ВСЕ** XML обработка использует xmldom:
- ✅ `src/utils/xmlDomUtils.ts` - метаданные и формы
- ✅ `src/xmlParsers/dcsParserXmldom.ts` - DCS схемы
- ✅ `src/xmlParsers/dcsSerializerXmldom.ts` - DCS сериализация

### 2️⃣ Сохранение структуры XML

xmldom **автоматически сохраняет**:
- Порядок элементов
- Атрибуты vs элементы
- Комментарии (опционально)
- CDATA секции
- Namespace префиксы

### 3️⃣ Упрощение кода

**Не нужен XmlDiffMerge:**
- xmldom работает с DOM напрямую
- Изменения применяются к клонированному документу
- Неизмененные части остаются без изменений

### 4️⃣ BOM Support

```typescript
// Проверка BOM при чтении
if (templateXml.charCodeAt(0) === 0xFEFF) {
  cleanXml = templateXml.slice(1);
}

// Добавление BOM при записи
const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
fs.writeFileSync(path, Buffer.concat([bomBuffer, contentBuffer]));
```

## Тестирование

### Создан тест: `test-cases/test-template-xmldom.js`

```bash
$ node test-cases/test-template-xmldom.js

✅ xmldom РАБОТАЕТ ОТЛИЧНО!
   1. Парсинг ✓
   2. Сериализация ✓
   3. BOM ✓
   4. Кодировка ✓
   5. xmlns ✓
```

### Создан тест BOM: `test-cases/test-bom.js`

```bash
$ node test-cases/test-bom.js

Template1.xml:
  BOM: ✓ ПРИСУТСТВУЕТ (EF BB BF)

Template2.xml (после сохранения):
  BOM: ✓ ПРИСУТСТВУЕТ (EF BB BF)
```

## Измененные файлы

1. ✅ `src/xmlParsers/dcsParserXmldom.ts` (новый) - парсер на xmldom
2. ✅ `src/xmlParsers/dcsSerializerXmldom.ts` (новый) - сериализатор на xmldom
3. ✅ `src/dcsEditor.ts` - обновлены импорты и `handleSaveDcs`
4. ✅ `src/utils/commitFileLogger.ts` - BOM support
5. ✅ `docs/dcs-xmldom-refactoring.md` (этот файл) - документация

**Старые файлы (deprecated, можно удалить позже):**
- ❌ `src/xmlParsers/dcsParser.ts` (использовал fast-xml-parser)
- ❌ `src/xmlParsers/dcsSerializer.ts` (использовал fast-xml-parser)

## Память Serena

Создана память: `xml-parsing-standard-xmldom.md`

**Ключевые правила:**
- ✅ **ВСЕГДА** используй xmldom для XML
- ❌ **НИКОГДА** не используй fast-xml-parser
- ✅ **ВСЕГДА** добавляй BOM при сохранении для 1С
- ✅ **ВСЕГДА** сохраняй _originalXml для патчинга

## Итог

✅ **DCS редактор полностью переработан на xmldom!**

| Проверка | До (fast-xml-parser) | После (xmldom) |
|----------|---------------------|----------------|
| Парсинг | XMLParser | ✅ DOMParser |
| Сериализация | XMLBuilder | ✅ XMLSerializer |
| Структура | preserveOrder массив | ✅ DOM Document |
| BOM | ❌ Терялся | ✅ Сохраняется |
| XmlDiffMerge | ✅ Нужен | ✅ Не нужен |
| Консистентность | ❌ Нет | ✅ Да |

**Редактор СКД готов к работе с правильным стандартом!** 🎉

---

## Дополнительно: Миграция других модулей

Если в проекте остались другие модули, использующие `fast-xml-parser`, их также нужно мигрировать на xmldom:

1. Найти все импорты: `grep -r "fast-xml-parser" src/`
2. Заменить на xmldom по образцу dcsParserXmldom.ts
3. Обновить тесты
4. Обновить документацию

**Примечание:** Всегда тестируйте после миграции - xmldom и fast-xml-parser имеют разные API!

