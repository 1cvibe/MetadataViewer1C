# Исправление неактивной кнопки "Сохранить" в DCS редакторе

## Проблема

После исправления циклических ссылок JSON, кнопка "Сохранить" в редакторе СКД стала неактивной (disabled).

## Причина

При исправлении циклических ссылок мы удалили `_raw` (DOM документ) перед отправкой в webview:

```typescript
// src/dcsEditor.ts
const payloadForWebview = {
  ...parsed,
  schema: {
    ...parsed.schema,
    _domDocument: undefined,
    _raw: undefined, // ← Удаляем для избежания циклических ссылок
  },
};
```

Однако в `DcsEditorApp.tsx` логика активации кнопки требовала наличие **ОБОИХ** полей:

```typescript
// ❌ БЫЛО
if (payload?.schema?._originalXml && payload?.schema?._raw) {
  setOriginalSchema({ 
    _originalXml: payload.schema._originalXml, 
    _raw: payload.schema._raw, // ← Всегда undefined!
    _rootAttrs: payload.schema._rootAttrs
  });
} else {
  setOriginalSchema(null); // ← Всегда попадаем сюда!
}
```

**Результат:** `originalSchema` всегда `null` → кнопка всегда `disabled`!

```typescript
<button disabled={!originalSchema}> // ← Всегда disabled!
  Сохранить
</button>
```

## Решение

### 1️⃣ Убрать проверку `_raw` при инициализации

**`src/webview/components/DcsEditor/DcsEditorApp.tsx`:**

```typescript
// ✅ СТАЛО
// ВАЖНО: _raw больше не отправляется из extension (циклические ссылки DOM)
// Проверяем только _originalXml
if (payload?.schema?._originalXml) {
  setOriginalSchema({ 
    _originalXml: payload.schema._originalXml, 
    _raw: null, // Не используется, DOM хранится на стороне extension
    _rootAttrs: payload.schema._rootAttrs
  });
} else {
  setOriginalSchema(null);
}
```

**Теперь:** `originalSchema` устанавливается корректно → кнопка активна!

### 2️⃣ Не отправлять `_raw` при сохранении

```typescript
// ✅ СТАЛО
vscode.postMessage({
  type: 'saveDcs',
  payload: {
    schemaChildren,
    _originalXml: originalSchema._originalXml,
    // _raw НЕ отправляем - DOM хранится на стороне extension
    _rootAttrs: originalSchema._rootAttrs,
    reportPath: report.reportPath,
    templatePath: report.templatePath,
    rootTag: report.schema?.rootTag || 'DataCompositionSchema',
    templateName: report.templateName,
  },
});
```

### 3️⃣ Обновить типы

**`ParsedDcsSchema`:**

```typescript
type ParsedDcsSchema = {
  sourcePath: string;
  rootTag: string;
  children: DcsNode[];
  _originalXml: string;
  _raw?: any; // ← Опциональный
  _rootAttrs?: Record<string, any>;
};
```

**State `originalSchema`:**

```typescript
const [originalSchema, setOriginalSchema] = useState<{ 
  _originalXml: string; 
  _raw?: any; // ← Опциональный
  _rootAttrs?: Record<string, any> 
} | null>(null);
```

## Архитектура

### Поток данных

```
Extension (Node.js)                      Webview (React)
┌──────────────────────────────────┐    ┌─────────────────────────┐
│ parseReportXmlForDcs             │    │ DcsEditorApp            │
│                                  │    │                         │
│ 1. Парсинг → DOM Document        │    │                         │
│ 2. Сохранение:                   │    │                         │
│    currentDomDocument = doc      │    │                         │
│    currentRootAttrs = attrs      │    │                         │
│                                  │    │                         │
│ 3. Удаление перед отправкой:     │    │                         │
│    _domDocument: undefined       │    │                         │
│    _raw: undefined               │    │                         │
│                                  │    │                         │
└─────────────┬────────────────────┘    └────────────┬────────────┘
              │                                      │
              │ JSON-safe payload                   │
              │ { _originalXml, _rootAttrs }        │
              └────────────────────────────────────>│
                                                     │
                      ┌──────────────────────────────┘
                      │
                      ▼
              ┌───────────────────────┐
              │ if (_originalXml) {   │
              │   setOriginalSchema   │ ← ✅ Активна!
              │   → Кнопка АКТИВНА    │
              │ }                     │
              └───────────────────────┘
                      │
                      │ Редактирование
                      │ schemaChildren
                      ▼
              ┌───────────────────────┐
              │ handleSave()          │
              │                       │
              │ postMessage({         │
              │   schemaChildren,     │
              │   _originalXml,       │
              │   // _raw НЕ шлем    │
              │ })                    │
              └───────────┬───────────┘
                          │
                          ▼
┌──────────────────────────────────┐
│ handleSaveDcs                    │
│                                  │
│ 1. Получение schemaChildren     │
│ 2. Использование:                │
│    currentDomDocument (saved)    │ ← Использует сохраненный
│    currentRootAttrs (saved)      │
│ 3. serializeToXml()              │
│ 4. Сохранение с BOM              │
└──────────────────────────────────┘
```

### Почему это работает?

1. **Extension сохраняет DOM:** `currentDomDocument` хранится в классе `DcsEditor`
2. **Webview получает только JSON-safe данные:** `_originalXml`, `_rootAttrs`, `children` (без `_domElement`)
3. **Проверка упрощена:** Только `_originalXml` (который всегда есть)
4. **Сохранение использует сохраненный DOM:** Из `currentDomDocument`, не из payload

## Измененные файлы

1. ✅ `src/webview/components/DcsEditor/DcsEditorApp.tsx`
   - Убрана проверка `_raw` при инициализации
   - Не отправляется `_raw` при сохранении
   - Обновлены типы (`_raw?: any`)

2. ✅ `docs/dcs-save-button-fix.md` (этот файл) - документация

## Проверка

```bash
$ npm run compile
✅ Компиляция успешна

$ npm run build:webview
✅ Сборка успешна

# Открытие редактора СКД
✅ Кнопка "Сохранить" АКТИВНА!
```

## Итог

✅ **Кнопка "Сохранить" теперь активна!**

| Проверка | До | После |
|----------|-----|-------|
| `_raw` в payload | ❌ undefined | ❌ undefined (не нужен) |
| Проверка `_raw` | ✅ Требовалась | ❌ Убрана |
| `originalSchema` | ❌ null | ✅ { _originalXml, ... } |
| Кнопка "Сохранить" | ❌ Неактивна | ✅ Активна |
| Сохранение работает | ❌ Нет | ✅ Да |

**Редактор СКД полностью функционален!** 🎉

---

## Важные моменты

### 1️⃣ Почему `_raw` не нужен в webview?

- `_raw` содержал DOM Document
- DOM Document содержит циклические ссылки
- JSON.stringify() не может обработать циклические ссылки
- **Решение:** Хранить DOM на стороне extension, не отправлять в webview

### 2️⃣ Почему не использовать `_originalXml` для сохранения?

`_originalXml` - это исходный XML в виде строки. Для применения изменений через xmldom нужен DOM Document, который содержит структуру.

**Вариант 1 (не используем):** Парсить `_originalXml` заново при сохранении
- ❌ Медленно
- ❌ Дублирование парсинга

**Вариант 2 (используем):** Сохранить DOM в extension
- ✅ Быстро
- ✅ Парсинг один раз
- ✅ Нет циклических ссылок в JSON

### 3️⃣ Что если нужно отменить изменения?

Для этого есть `_originalXml` - исходный XML. Можно:
1. Заново распарсить его
2. Заново построить дерево `schemaChildren`
3. Заменить состояние

**Примечание:** Функция отмены еще не реализована в UI.

