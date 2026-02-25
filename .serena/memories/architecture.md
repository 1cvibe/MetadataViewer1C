# Архитектура проекта

## Основные компоненты

### Extension Host (Node.js)
- `src/extension.ts` - точка входа, регистрация команд и провайдеров
- `src/metadataView.ts` - дерево метаданных в панели Explorer
- `src/panels/MetadataPanel.ts` - панель редактирования метаданных
- `src/panels/TemplateEditorPanel.ts` - панель редактора макетов
- `src/dcsEditor.ts` - редактор СКД
- `src/formPreviewer.ts` - просмотрщик форм

### Webview (Browser)
- `src/webview/index.tsx` - точка входа React приложения
- `src/webview/components/MetadataEditor.tsx` - главный редактор метаданных
- `src/webview/components/FormPreview/FormPreviewApp.tsx` - приложение просмотра форм
- `src/webview/components/DcsEditor/DcsEditorApp.tsx` - приложение редактора СКД
- `src/webview/components/TemplateEditor/TemplateEditorApp.tsx` - редактор макетов

### Парсеры
- `src/xmlParsers/metadataParser.ts` - парсинг метаданных
- `src/xmlParsers/formParser.ts` - парсинг форм
- `src/xmlParsers/dcsParserXmldom.ts` - парсинг СКД через xmldom
- `src/xmlParsers/predefinedParser.ts` - парсинг предопределенных элементов

### Утилиты
- `src/utils/xmlDomUtils.ts` - работа с XML через xmldom
- `src/utils/xmlUtils.ts` - работа с XML через fast-xml-parser
- `src/utils/bookmarkManager.ts` - управление закладками
- `src/utils/commitFileLogger.ts` - логирование измененных файлов

### Генерация BSL кода
- `src/autogen-bsl/init.ts` - инициализация функций генерации
- `src/autogen-bsl/generators/` - генераторы кода
- `src/autogen-bsl/intent/` - парсинг намерений
- `src/autogen-bsl/routing/` - маршрутизация намерений

## Потоки данных

### Extension → Webview
- Через `webview.postMessage()` отправляются данные
- Webview получает через `window.addEventListener('message')`

### Webview → Extension
- Через `vscode.postMessage()` отправляются команды
- Extension получает через `webview.onDidReceiveMessage()`

### Кэширование
- `src/runtime/MetadataCache.ts` - кэш метаданных (L1/L2/L3)
- Инвалидация кэша при изменении файлов
- Асинхронная загрузка больших конфигураций

## Форматы данных

### XML формат конфигурации
- `Configuration.xml` - основной файл метаданных
- `ConfigDumpInfo.xml` - информация о выгрузке
- Модули в `Ext/*.bsl`
- Формы в `Ext/Form/*.xml`

### EDT формат
- `Configuration.mdo` - основной файл
- Структура папок с модулями и формами

## Зависимости

### Основные
- `vscode` - VS Code Extension API
- `@xmldom/xmldom` - DOM парсер для XML
- `fast-xml-parser` - быстрый XML парсер
- `monaco-editor` - редактор кода
- `react`, `react-dom` - UI библиотека

### Разработка
- `typescript` - компилятор
- `webpack` - сборщик
- `@typescript-eslint/*` - линтер
