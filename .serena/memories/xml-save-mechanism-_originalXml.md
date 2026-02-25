# Механизм сохранения XML через _originalXml

## КРИТИЧЕСКИ ВАЖНО
- **ЕДИНСТВЕННЫЙ механизм сохранения XML**: использование `_originalXml`
- **НЕ предлагать другие варианты** сохранения XML
- **Работать ТОЛЬКО с этим механизмом**
- **На вкладке XML всегда правильная структура данных**

## Принцип работы

### 1. Парсинг XML (`src/xmlParsers/metadataParser.ts`)
- При парсинге XML файла сохраняется исходный XML как строка в поле `_originalXml`
- `_originalXml` содержит полный исходный XML файл с правильной структурой (элементы остаются элементами, атрибуты остаются атрибутами)

```typescript
const parsed = {
    // ... другие поля ...
    _originalXml: xml  // Сохраняем исходный XML как строку для максимального сохранения структуры
};
```

### 2. Отображение XML в редакторе (`src/webview/components/MetadataEditor.tsx`)
- При загрузке объекта в редактор используется `_originalXml` для отображения на вкладке XML
- НЕ используется генерация через `createXMLBuilder()`, так как это меняет структуру
- При изменении `selectedObject` обновляется `xmlContent` из `_originalXml`

```typescript
if (firstObj._originalXml) {
    setXmlContent(firstObj._originalXml);
}
```

### 3. Сохранение изменений (`src/panels/MetadataPanel.ts`)
- При сохранении используется `applyChangesToXmlString()` из `src/utils/xmlStringPatcher.ts`
- Функция применяет изменения к исходному XML строке через регулярные выражения
- Сохраняется исходная структура XML (элементы/атрибуты)
- После сохранения обновляется `_originalXml` в объекте и отправляется сообщение `objectUpdated` в webview

```typescript
if (obj._originalXml) {
    updatedXml = applyChangesToXmlString(obj._originalXml, obj, xmlObjectType);
}
// ...
const updatedObj = {
    ...obj,
    _originalXml: updatedXml  // Обновляем исходный XML для правильного отображения в редакторе
};
this.panel.webview.postMessage({
    type: 'objectUpdated',
    payload: updatedObj
});
```

### 4. Применение изменений (`src/utils/xmlStringPatcher.ts`)
- Использует строковые замены через регулярные выражения
- Применяет изменения к Properties, Attributes, TabularSections
- Сохраняет исходную структуру XML (форматирование, отступы, элементы/атрибуты)

## Ключевые файлы

1. **`src/xmlParsers/metadataParser.ts`** - сохранение `_originalXml` при парсинге
2. **`src/webview/components/MetadataEditor.tsx`** - использование `_originalXml` для отображения
3. **`src/panels/MetadataPanel.ts`** - использование `_originalXml` при сохранении
4. **`src/utils/xmlStringPatcher.ts`** - применение изменений к исходному XML строке

## Правила работы

1. **ВСЕГДА** использовать `_originalXml` для отображения XML на вкладке XML
2. **ВСЕГДА** использовать `applyChangesToXmlString()` для сохранения изменений
3. **НИКОГДА** не использовать `createXMLBuilder()` для генерации XML для отображения
4. **НИКОГДА** не предлагать другие механизмы сохранения XML
5. **ВСЕГДА** обновлять `_originalXml` после сохранения

## Преимущества механизма

- Сохраняется исходная структура XML (элементы/атрибуты)
- Сохраняется форматирование и отступы
- Нет потери данных при сохранении
- Правильное отображение на вкладке XML
