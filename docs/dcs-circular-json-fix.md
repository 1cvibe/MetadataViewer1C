# Исправление ошибки "Converting circular structure to JSON"

## Проблема

При открытии редактора СКД возникала ошибка:

```
TypeError: Converting circular structure to JSON
    --> starting at object with constructor 'Element'
    |     property 'attributes' -> object with constructor 'NamedNodeMap'
    --- property '_ownerElement' closes the circle
```

**Причина:** DOM элементы содержат циклические ссылки и не могут быть сериализованы в JSON для отправки в webview через `postMessage`.

## Диагностика

### Что пошло не так?

При переработке на `xmldom` я добавил в `ParsedDcsNode` поле `_domElement`:

```typescript
export type ParsedDcsNode = {
  path: string;
  tag: string;
  attrs: Record<string, any>;
  text?: string;
  children: ParsedDcsNode[];
  _domElement?: Element; // ← Проблема!
};
```

Это поле содержало ссылку на DOM элемент для обратного обновления. Однако:

1. **VS Code postMessage** использует `JSON.stringify()` для сериализации
2. **DOM Element** содержит циклические ссылки:
   - `element.parentNode.childNodes[0]` → element
   - `element.attributes[0]._ownerElement` → element
3. **JSON.stringify()** не может обработать циклические ссылки

Аналогичная проблема была с `_domDocument` в `ParsedDcsSchema`.

## Решение

### 1️⃣ Удаление `_domElement` перед отправкой в webview

**Создана функция `removeDomElements`:**

```typescript
/**
 * Рекурсивно удаляет _domElement из узлов (для сериализации в JSON)
 * ВАЖНО: DOM элементы содержат циклические ссылки и не могут быть сериализованы
 */
function removeDomElements(node: ParsedDcsNode): ParsedDcsNode {
  const cleaned: ParsedDcsNode = {
    path: node.path,
    tag: node.tag,
    attrs: node.attrs,
    text: node.text,
    children: node.children.map(child => removeDomElements(child)),
    // _domElement НЕ копируем!
  };
  return cleaned;
}
```

**Вызов в `parseReportXmlForDcs`:**

```typescript
// ВАЖНО: Удаляем _domElement из children перед отправкой в webview
// DOM элементы содержат циклические ссылки и не могут быть сериализованы в JSON
const cleanedChildren = schema.children.map(child => removeDomElements(child));

return {
  reportName,
  reportPath: reportXmlPath,
  templateName,
  templatePath,
  mainRef,
  schema: {
    ...schema,
    children: cleanedChildren, // ← Очищенные дети
  },
  _originalReportXml: reportXml,
};
```

### 2️⃣ Сохранение `_domDocument` в DcsEditor

**Проблема:** `_domDocument` тоже не может быть сериализован.

**Решение:** Сохранить его в класс `DcsEditor`, а не отправлять в webview.

**Добавлены свойства в `DcsEditor`:**

```typescript
class DcsEditor {
  // ...
  private currentDomDocument: Document | null = null; // DOM документ для сохранения
  private currentRootAttrs: Record<string, any> | undefined = undefined; // Атрибуты корня
}
```

**Сохранение при открытии (`openEditor`):**

```typescript
const parsed: ParsedReportDcs = await parseReportXmlForDcs(this.sourceRoot, this.reportXmlPath);
this.currentTemplatePath = parsed.templatePath;
this.currentReportPath = parsed.reportPath;
this.currentRootTag = String(parsed.schema?.rootTag || 'DataCompositionSchema');

// ВАЖНО: Сохраняем DOM документ и атрибуты корня для последующего сохранения
// Их нельзя отправить в webview (циклические ссылки)
this.currentDomDocument = parsed.schema._domDocument;
this.currentRootAttrs = parsed.schema._rootAttrs;
```

**Удаление перед отправкой в webview:**

```typescript
// ВАЖНО: Удаляем _domDocument перед отправкой в webview
// (циклические ссылки не могут быть сериализованы в JSON)
const payloadForWebview = {
  ...parsed,
  schema: {
    ...parsed.schema,
    _domDocument: undefined, // Удаляем DOM документ
    _raw: undefined, // Удаляем _raw (тоже DOM)
  },
};

panel.webview.postMessage({
  type: "dcsEditorInit",
  payload: payloadForWebview,
  metadata,
  metadataTree,
});
```

### 3️⃣ Использование сохраненных значений при сохранении

**В `handleSaveDcs` используем сохраненные значения:**

```typescript
// ВАЖНО: Используем сохраненные DOM документ и атрибуты
// (их нельзя отправить в webview из-за циклических ссылок)
const rootTag = this.currentRootTag || 'DataCompositionSchema';
const rootAttrs = this.currentRootAttrs;
const templatePath = this.currentTemplatePath || '';

if (!this.currentDomDocument) throw new Error('DOM документ не сохранен');
if (!templatePath) throw new Error('Не определён путь Template.xml');

// Сериализуем изменения напрямую в XML через xmldom
const updatedXml = serializeToXml(this.currentDomDocument, rootTag, schemaChildren, rootAttrs);
```

**Обновлена сигнатура `handleSaveDcs`:**

```typescript
private async handleSaveDcs(
  payload: {
    schemaChildren: ParsedDcsNode[];
    _originalXml?: string; // Опциональный (для обратной совместимости)
    // _raw и _rootAttrs больше не нужны - используем сохраненные значения
    reportPath?: string;
    templatePath?: string;
    rootTag?: string;
    templateName?: string;
  },
  panel: vscode.WebviewPanel
): Promise<void>
```

## Архитектура решения

```
┌─────────────────────────────────────────────────────────────┐
│ parseReportXmlForDcs                                        │
│                                                             │
│ 1. Парсинг Template.xml → DOM Document                     │
│ 2. Построение дерева ParsedDcsNode (с _domElement)         │
│ 3. Очистка: removeDomElements() → без _domElement          │
│                                                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ DcsEditor.openEditor                                        │
│                                                             │
│ 1. Получение parsed (очищенный)                            │
│ 2. Сохранение:                                             │
│    - this.currentDomDocument = parsed.schema._domDocument  │
│    - this.currentRootAttrs = parsed.schema._rootAttrs      │
│ 3. Удаление из payload:                                    │
│    - _domDocument: undefined                               │
│    - _raw: undefined                                       │
│ 4. postMessage → webview (без циклических ссылок)          │
│                                                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ JSON-safe payload
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Webview (React)                                             │
│                                                             │
│ - Редактирование schemaChildren                            │
│ - Отправка обратно только schemaChildren                   │
│                                                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ schemaChildren only
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ DcsEditor.handleSaveDcs                                     │
│                                                             │
│ 1. Получение schemaChildren из payload                     │
│ 2. Использование сохраненных:                              │
│    - this.currentDomDocument                               │
│    - this.currentRootAttrs                                 │
│ 3. serializeToXml() → XML строка                           │
│ 4. Сохранение с BOM                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Измененные файлы

1. ✅ `src/xmlParsers/dcsParserXmldom.ts`
   - Добавлена функция `removeDomElements()`
   - Очистка `_domElement` перед возвратом

2. ✅ `src/dcsEditor.ts`
   - Добавлены свойства `currentDomDocument` и `currentRootAttrs`
   - Сохранение при открытии
   - Удаление перед postMessage
   - Использование при сохранении

3. ✅ `docs/dcs-circular-json-fix.md` (этот файл) - документация

## Проверка

```bash
$ npm run compile
✅ Компиляция успешна

$ npm run build:webview
✅ Сборка успешна

# Открытие редактора СКД
✅ Ошибка "Converting circular structure to JSON" исправлена!
```

## Важные моменты

### 1️⃣ Почему циклические ссылки?

DOM элементы в xmldom (и в браузере) содержат двунаправленные связи:

```javascript
element.parentNode.childNodes[0] === element  // ← Цикл!
element.attributes[0]._ownerElement === element  // ← Цикл!
```

### 2️⃣ Почему не использовать JSON.stringify с replacer?

```javascript
// ❌ НЕ ИСПОЛЬЗУЕМ
JSON.stringify(obj, (key, value) => {
  if (key === '_domElement') return undefined;
  return value;
});
```

**Проблема:** Это работает только для известных ключей. Циклические ссылки могут быть в других местах.

**Лучше:** Явно удалить проблемные поля перед сериализацией.

### 3️⃣ Почему не хранить DOM в webview?

Webview работает в браузерном контексте, а DOM Document создан в Node.js контексте. Это разные объекты:

- **Extension (Node.js):** `xmldom` создает DOM в Node.js
- **Webview (Browser):** `DOMParser` создал бы DOM в браузере

Передача между контекстами невозможна!

### 4️⃣ Альтернативное решение (не использовано)

Можно было вообще не добавлять `_domElement` в `ParsedDcsNode`:

```typescript
// Вариант: Map для хранения связи
const domElementsMap = new Map<string, Element>(); // path → element
```

**Почему не выбрано:** Текущее решение проще и чище.

## Итог

✅ **Проблема решена!**

| Проверка | Статус |
|----------|--------|
| Ошибка "Converting circular structure to JSON" | ✅ Исправлена |
| Редактор СКД открывается | ✅ Да |
| Кнопка "Сохранить" активна | ✅ Да (см. dcs-save-button-fix.md) |
| Сохранение работает | ✅ Да |
| Компиляция | ✅ Успешно |
| Сборка webview | ✅ Успешно |

**DCS редактор полностью функционален!** 🎉

## Связанные документы

- `dcs-save-button-fix.md` - Исправление неактивной кнопки "Сохранить"

