---
name: Интеграция TypeWidget в редактор предопределенных данных
overview: Переработать PredefinedDataPanel для использования webpack bundle и TypeWidget вместо упрощенного редактора типов. Привести код к принципу Open/Closed (использование существующих компонентов без модификации) с минимальными изменениями архитектуры.
todos:
  - id: create-type-modal
    content: Создать PredefinedTypeEditorModal.tsx с использованием TypeWidget по образцу CharacteristicTypeEditorModal
    status: completed
  - id: refactor-predefined-app
    content: "Переработать PredefinedEditorApp.tsx: карточки, TypeWidget через модальное окно, обработка сообщений"
    status: completed
  - id: update-webview-index
    content: Добавить PredefinedEditorApp в webview/index.tsx для поддержки appMode=predefinedEditor
    status: completed
  - id: refactor-panel-html
    content: Переработать PredefinedDataPanel.getHtmlForWebview для использования webpack bundle
    status: completed
  - id: update-message-handling
    content: Обновить обработку сообщений в PredefinedDataPanel для работы с bundle
    status: completed
  - id: verify-namespace
    content: Проверить корректность работы с namespace prefix (удаление при парсинге, добавление при сохранении)
    status: completed
---

# Интеграция TypeWidget в редактор предопределенных данных

## Текущая ситуация

- PredefinedDataPanel использует встроенный React через CDN в строке HTML
- Создан упрощенный редактор типов вместо использования TypeWidget
- TypeWidget находится в `src/webview/widgets/TypeWidget.tsx` и требует webpack bundle
- Существует `PredefinedEditorApp.tsx`, но он не используется

## Цель

Использовать существующий TypeWidget без модификации (принцип Open/Closed) с минимальными изменениями архитектуры.

## План переработки

### 1. Переработка PredefinedDataPanel для использования webpack bundle

**Файл:** `src/predefinedDataPanel.ts`

- Заменить метод `getHtmlForWebview()` для использования webpack bundle вместо встроенного React
- Использовать паттерн как в `MetadataPanel.ts` (строки 700-807)
- Загружать `metadataEditor.bundle.js` через `webview.asWebviewUri()`
- Установить `__APP_MODE__ = 'predefinedEditor'` для выбора компонента в `webview/index.tsx`

**Изменения:**

- Удалить встроенный React код из строки HTML (строки 699-1328)
- Использовать bundle аналогично MetadataPanel
- Добавить обработку сообщения `webviewReady`

### 2. Обновление webview/index.tsx для поддержки PredefinedEditor

**Файл:** `src/webview/index.tsx`

- Добавить импорт `PredefinedEditorApp`
- Добавить условие для `appMode === 'predefinedEditor'` (строки 45-57)
- Экспортировать PredefinedEditorApp как отдельный компонент

### 3. Переработка PredefinedEditorApp.tsx

**Файл:** `src/webview/components/PredefinedEditor/PredefinedEditorApp.tsx`

**Текущее состояние:**

- Простой компонент с таблицей
- Нет поддержки Type
- Нет использования TypeWidget

**Изменения:**

- Переработать UI на карточки (как уже сделано во встроенном коде)
- Добавить поддержку Type через TypeWidget (только для ChartOfCharacteristicTypes)
- Использовать CharacteristicTypeEditorModal как образец для работы с TypeWidget
- Добавить обработку сообщений от extension (init, saved)
- Использовать стили из `editor.css` (классы `.attribute-card`, `.attribute-header`)

**Структура компонента:**

```typescript
interface PredefinedEditorAppProps {
  vscode: any;
}

// Состояния:
- items: PredefinedDataItem[]
- objectType: string
- metadata: { registers, referenceTypes }
- editingIndex, showAddModal, showTypeModal
```

### 4. Обработка namespace prefix

**Файлы:** `src/xmlParsers/predefinedParser.ts`, `src/xmlParsers/predefinedSerializer.ts`

**Текущее состояние:**

- `stripNamespacePrefix()` убирает префиксы при парсинге
- `detectNamespacePrefix()` и `addNamespacePrefix()` добавляют префикс при сохранении

**Изменения:**

- Убедиться, что TypeWidget получает тип без namespace prefix (например, `CatalogRef.Номенклатура`)
- При сохранении добавлять namespace prefix обратно (например, `d4p1:CatalogRef.Номенклатура`)
- Логика уже реализована, нужно проверить корректность работы

### 5. Разделение ответственностей (SOLID)

**Single Responsibility:**

- `predefinedParser.ts` - только парсинг XML
- `predefinedSerializer.ts` - только сериализация XML
- `PredefinedDataPanel.ts` - только управление панелью и сообщениями
- `PredefinedEditorApp.tsx` - только UI и логика редактирования

**Open/Closed:**

- Использовать TypeWidget без модификации
- Использовать CharacteristicTypeEditorModal как образец
- Использовать существующие стили из `editor.css`

**Dependency Inversion:**

- PredefinedEditorApp получает данные через пропсы и сообщения
- Зависимости через интерфейсы (PredefinedDataItem, metadata)

### 6. Интеграция TypeWidget

**Подход:**

- Создать модальное окно `PredefinedTypeEditorModal.tsx` по образцу `CharacteristicTypeEditorModal.tsx`
- Использовать TypeWidget внутри модального окна
- Преобразовывать строку типа в объект для TypeWidget: `{ 'v8:Type': typeString }`
- Извлекать тип из результата TypeWidget: `type['v8:Type']` или `type['v8:TypeSet']`

**Файл:** `src/webview/components/PredefinedEditor/PredefinedTypeEditorModal.tsx` (новый)

```typescript
interface PredefinedTypeEditorModalProps {
  isOpen: boolean;
  typeValue: string | null; // Без namespace prefix (например, "CatalogRef.Номенклатура")
  metadata: { registers: string[]; referenceTypes: string[] };
  onClose: () => void;
  onSave: (typeValue: string) => void; // Возвращает без namespace prefix
}
```

### 7. Обновление стилей

**Файл:** `src/webview/components/PredefinedEditor/PredefinedEditorApp.css`

- Использовать стили из `src/webview/styles/editor.css` (импортировать)
- Добавить специфичные стили только при необходимости
- Использовать классы `.attribute-card`, `.attribute-header`, `.attribute-properties`

## Файлы для изменения

1. `src/predefinedDataPanel.ts` - переработка getHtmlForWebview, добавление поддержки bundle
2. `src/webview/index.tsx` - добавление PredefinedEditorApp в роутинг
3. `src/webview/components/PredefinedEditor/PredefinedEditorApp.tsx` - полная переработка с TypeWidget
4. `src/webview/components/PredefinedEditor/PredefinedTypeEditorModal.tsx` - новый файл, модальное окно с TypeWidget
5. `src/xmlParsers/predefinedParser.ts` - проверить корректность stripNamespacePrefix
6. `src/xmlParsers/predefinedSerializer.ts` - проверить корректность addNamespacePrefix

## Последовательность реализации

1. Создать PredefinedTypeEditorModal с TypeWidget
2. Обновить PredefinedEditorApp для использования карточек и TypeEditorModal
3. Обновить webview/index.tsx для поддержки predefinedEditor режима
4. Переработать PredefinedDataPanel.getHtmlForWebview для использования bundle
5. Обновить обработку сообщений в PredefinedDataPanel
6. Проверить работу с namespace prefix

## Принципы SOLID

- **Single Responsibility:** каждый модуль отвечает за одну задачу
- **Open/Closed:** используем TypeWidget и существующие компоненты без модификации
- **Dependency Inversion:** зависимости через интерфейсы и пропсы