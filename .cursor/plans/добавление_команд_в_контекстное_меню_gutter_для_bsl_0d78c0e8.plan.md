---
name: Добавление команд в контекстное меню gutter для BSL
overview: "Добавление 6 команд в контекстное меню при клике на номер строки для BSL файлов: управление закладками (установка/удаление, переход, очистка), форматирование текста и управление отступами."
todos:
  - id: create-bookmark-manager
    content: Создать модуль BookmarkManager (src/utils/bookmarkManager.ts) с управлением закладками и декорациями
    status: completed
  - id: update-package-json-commands
    content: Добавить 6 новых команд в секцию commands package.json
    status: completed
  - id: update-package-json-menus
    content: Добавить секцию editor/lineNumber/context в menus package.json с условием editorLangId == 'bsl'
    status: completed
    dependencies:
      - update-package-json-commands
  - id: update-package-json-keybindings
    content: Добавить keybindings для Alt+F2, F2, Alt+Shift+F в package.json
    status: completed
    dependencies:
      - update-package-json-commands
  - id: update-localization
    content: Добавить локализацию для 6 команд в package.nls.ru.json
    status: completed
  - id: register-commands
    content: Зарегистрировать все 6 команд в extension.ts с реализацией логики
    status: completed
    dependencies:
      - create-bookmark-manager
      - update-package-json-commands
  - id: implement-formatting
    content: Реализовать форматирование выделенного текста с использованием табуляции
    status: completed
    dependencies:
      - register-commands
  - id: implement-indent
    content: Реализовать увеличение/уменьшение отступа для выделенных строк
    status: completed
    dependencies:
      - register-commands
---

# План: Добавление команд в контекстное меню gutter для BSL модулей

## Обзор

Добавляются 6 команд в контекстное меню при клике на номер строки (gutter) для файлов BSL:

1. Установить/удалить закладку (Alt+F2)
2. Следующая закладка (F2)
3. Удалить все закладки
4. Форматировать текст (Alt+Shift+F)
5. Увеличить отступ
6. Уменьшить отступ

## Архитектура

### Компоненты

- **BookmarkManager** (`src/utils/bookmarkManager.ts`) - управление закладками с визуализацией через TextEditorDecorationType
- **Команды** - регистрация в `extension.ts`
- **Конфигурация** - обновление `package.json` (commands, menus, keybindings) и локализация

### Поток данных для закладок

```javascript
Пользователь клик → Команда → BookmarkManager → 
  → Обновление Map<Uri, Set<number>> → 
  → Обновление TextEditorDecorationType → 
  → Отображение иконки в gutter
```



## Изменения в файлах

### 1. `src/utils/bookmarkManager.ts` (новый файл)

Класс для управления закладками:

- Хранение закладок: `Map<vscode.Uri, Set<number>>`
- `TextEditorDecorationType` для отображения иконки закладки в gutter
- Методы: `toggleBookmark()`, `getNextBookmark()`, `clearAllBookmarks()`, `updateDecorations()`
- Подписка на события изменения документа для обновления декораций

### 2. `package.json`

**Секция `commands`** (строки 38-152):

- Добавить 6 новых команд с локализованными заголовками

**Секция `menus`** (после строки 297):

- Добавить секцию `"editor/lineNumber/context"` с 6 командами
- Условие видимости: `"editorLangId == 'bsl'"`

**Секция `keybindings`** (новая, если отсутствует):

- `Alt+F2` → `metadataViewer.toggleBookmark`
- `F2` → `metadataViewer.nextBookmark`
- `Alt+Shift+F` → `metadataViewer.formatSelection` (только для BSL)

### 3. `package.nls.ru.json`

Добавить локализацию для 6 команд:

- `1c-metadata-viewer.toggleBookmark.title`
- `1c-metadata-viewer.nextBookmark.title`
- `1c-metadata-viewer.clearAllBookmarks.title`
- `1c-metadata-viewer.formatSelection.title`
- `1c-metadata-viewer.increaseIndent.title`
- `1c-metadata-viewer.decreaseIndent.title`

### 4. `src/extension.ts`

**Импорты** (после строки 11):

- Импорт `BookmarkManager`

**В функции `activate()`** (после строки 22):

- Создать экземпляр `BookmarkManager`
- Зарегистрировать 6 команд:
- `metadataViewer.toggleBookmark` - переключение закладки на строке
- `metadataViewer.nextBookmark` - переход к следующей закладке
- `metadataViewer.clearAllBookmarks` - удаление всех закладок
- `metadataViewer.formatSelection` - форматирование выделенного текста
- `metadataViewer.increaseIndent` - увеличение отступа
- `metadataViewer.decreaseIndent` - уменьшение отступа

### 5. Ресурсы (опционально)

Если нужна кастомная иконка для закладки:

- `resources/dark/bookmark.svg`
- `resources/light/bookmark.svg`

Или использовать встроенную иконку `$(bookmark)`

## Детали реализации

### Закладки

- Использовать `TextEditorDecorationType` с `gutterIconPath` или `gutterIconSize`
- Иконка: встроенная `$(bookmark)` или кастомная SVG
- Хранение: `Map<vscode.Uri, Set<number>>` в памяти (не персистентно)
- При изменении документа обновлять декорации через `editor.setDecorations()`

### Форматирование текста

- Для выделенного текста: использовать табуляцию для выравнивания
- Логика: анализ отступов в выделенных строках, добавление/удаление табуляций
- Альтернатива: использовать встроенную команду `editor.action.formatSelection` если доступна для BSL

### Управление отступами

- Использовать `TextEditorEdit` для модификации выделенных строк
- Добавление/удаление символа табуляции в начале каждой строки
- Учитывать пустые строки (не изменять)

## Порядок выполнения

1. Создать `BookmarkManager` с базовой функциональностью
2. Добавить команды в `package.json` и локализацию
3. Зарегистрировать команды в `extension.ts`
4. Реализовать форматирование и управление отступами
5. Протестировать все команды

## Риски

- VS Code версия < 1.78 не поддерживает `editor/lineNumber/context`