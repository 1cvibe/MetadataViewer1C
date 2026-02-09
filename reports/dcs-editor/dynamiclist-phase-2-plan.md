# План (этап 2): внедрение «Редактор СКД» для DynamicList

## Цель
Добавить поддержку редактирования **DynamicList** через тот же webview‑редактор (EDT‑подобный UI), начиная с просмотра структуры и редактирования в памяти.

## Источник данных
- Найти **10 объектов**, где используется тип **DynamicList** (чаще всего формы списка/выбора).
- Базовый путь для поиска: `D:\1C\RZDZUP\src\cf`

## Анализ (скрипт)
1. Добавить скрипт `src/scripts/analyze-dynamic-list.js`:
   - Рекурсивно пройти по конфигурации.
   - Найти `DynamicList` (по тегам/узлам, которые реально встречаются в EDT XML).
   - Собрать статистику: ключи, глубина, частые секции (query/fields/settings/filters).
2. Сохранить результаты:
   - `reports/dcs-editor/dynamiclist-sample-10.json`
   - `reports/dcs-editor/dynamiclist-sample-10.md`

## Парсер
1. Добавить `src/xmlParsers/dynamicListParser.ts`:
   - Извлекать структуру DynamicList **lossless** (сохранение неизвестных кусочков).
   - По возможности — preserveOrder для порядка элементов.
2. Выходная модель должна быть совместима по духу с `ParsedDcsSchema`:
   - дерево узлов (tag/attrs/text/children/path)
   - sourcePath

## Интеграция в webview
1. Расширить контракт сообщений:
   - `dynamicListInit` (extension → webview) с payload дерева DynamicList.
2. Расширить `src/webview/index.tsx`:
   - `__APP_MODE__='dynamicListEditor'` → рендерить тот же `DcsEditorApp`, но в режиме DynamicList (или отдельный компонент‑обёртка).

## UI/UX (MVP)
- Левая панель: дерево.
- Правая панель: свойства + JSON.
- Отдельные эвристики отображения:
  - Вывод текста запроса (если обнаружен).
  - Списки полей/отборов/сортировок (read-only или редактирование в памяти).

## Точка входа (команда)
1. Добавить команду `metadataViewer.openDynamicListEditor`.
2. Добавить пункт меню в контекст дерева (по аналогии с `openDcsEditor`), с проверкой в handler, что выбранный узел действительно содержит DynamicList.


