---
name: Status bar переиндексации
overview: "Вывод в status bar: (1) прогресс переиндексации и других длительных операций, включая «проиндексировано x/N»; (3) контекстный статус — что открыто; (4) фильтр по подсистеме; (5) кэш и первая загрузка; (7) Commit.txt (CommitFileLogger)."
todos:
  - id: reindex-statusbar
    content: "Переиндексация: StatusBarItem, этапы 1–5, «проиндексировано x/N», рефакторинг LoadAndParseConfigurationXml (async, подсчёт N, последовательная загрузка)"
    status: completed
  - id: progress-expand
    content: "Прогресс операций: expand (загрузка конфигурации), refreshObjectStructure (обновление объекта)"
    status: completed
  - id: progress-gen-panels
    content: "Прогресс операций: genFromComment (генерация кода), открытие панелей (Metadata, Template, Predefined, DCS, Form)"
    status: completed
  - id: context-status
    content: "Контекстный статус: выбранный узел дерева, активная панель (СКД, макет, форма, предопределённые)"
    status: completed
  - id: filter-subsystem
    content: "Фильтр по подсистеме: «Применение фильтра…» при filterBySubsystem / selectSubsystemToFilter"
    status: completed
  - id: cache-first-load
    content: "Кэш и первая загрузка: «Поиск конфигураций…» при старте, опционально «Кэш: загружена конфигурация X» при expand"
    status: completed
  - id: commit-txt
    content: "Commit.txt: «Добавлено в Commit.txt» при успешной записи (CommitFileLogger)"
    status: completed
isProject: false
---

# Status bar: переиндексация, прогресс операций, контекст, кэш, Commit.txt

## Текущее состояние

- Команда `metadataViewer.reindexStructure` и метод `reindexStructure()` в [src/metadataView.ts](src/metadataView.ts) (стр. 122–124, 183–199).
- `LoadAndParseConfigurationXml` (стр. 1883–1958): синхронная обёртка, внутри `forEach` + `readFile().then()` без ожидания. Нет прогресса в UI.
- Status bar в проекте не используется.

## Целевое поведение

В status bar по шагам:

1. `$(sync~spin) Переиндексация: очистка кэша…`
2. `$(sync~spin) Переиндексация: очистка дерева…`
3. `$(sync~spin) Переиндексация: поиск конфигураций…`
4. `$(sync~spin) Переиндексация: загрузка конфигураций…` и **«проиндексировано x/N»** (x — номер обработанного файла конфигурации, N — общее количество).
5. `$(check) Переиндексация завершена` → через 2–3 сек скрыть. При ошибке — «Переиндексация: ошибка», затем скрыть.

«Файлы» = конфигурации: каждая соответствует одному загружаемому файлу (Configuration.xml или Configuration.mdo). Итерация идёт по `filtered` в `LoadAndParseConfigurationXml`.

## Реализация «проиндексировано x/N»

- **N** — общее число конфигураций по всем workspace-папкам.
- **x** — сколько уже обработано (1, 2, …, N).

Чтобы показывать глобальный N до конца загрузки, нужен **предварительный подсчёт**:

1. **Первый проход** (без чтения файлов): для каждой workspace-папки выполнить glob → reduce → filter, как сейчас. Собрать список конфигов по папкам (например, `Array<{ folder: Uri; configs: string[] }>`). `N = сумма configs.length` по всем папкам.
2. **Второй проход** — загрузка: обход этой структуры, для каждой конфигурации `await readFile` → parse → push в дерево → `dataProvider.update()`. После каждой обработанной конфигурации вызывать `onProgress` с текстом вида `Переиндексация: загрузка конфигураций — проиндексировано x/N`, где x увеличивается от 1 до N.

Альтернатива без второго прохода — показывать x/N только **в рамках текущей папки** (N = число конфигов в папке). Тогда глобального «общего количества» не будет. В плане заложен вариант с **глобальным** x/N, как в формулировке «общее количество файлов».

## Изменения в коде

### 1. StatusBarItem в MetadataView

- Поле `private readonly reindexStatusBarItem: vscode.StatusBarItem`.
- В конструкторе: `createStatusBarItem(Left, 100)`, подписка в `context.subscriptions`, по умолчанию скрыт.

### 2. Рефакторинг `LoadAndParseConfigurationXml` и цикла переиндексации

- Ввести **вспомогательную** функцию (или внутреннюю логику) **только поиска**: glob по `uri`, reduce, filter → вернуть `configs: string[]` (пути к Configuration.xml / .mdo) без чтения.
- При переиндексации:
- Очистка кэша и дерева, обновление статуса (этапы 1–2).
- **Подсчёт N**: для каждой workspace-папки вызвать «только поиск», собрать все конфиги, `N = total`.
- Этап 3: «Поиск конфигураций» (уже выполнен), при необходимости кратко отобразить.
- Этап 4: цикл по собранному списку `{ folder, configs }` и по каждой конфигурации — `await readFile` → parse → push → `update()`, затем `onProgress(\`… проиндексировано ${x}/${N}\`)`. Загрузка **последовательная**, чтобы x менялся по шагам.
- `LoadAndParseConfigurationXml` сделать **async**, с опциональным `onProgress?: (msg: string) => void`. При вызове из `reindexStructure` передавать `onProgress`, при старте расширения — без прогресса, по желанию оставить `void LoadAndParse(...)` без ожидания.

При старте (конструктор) можно оставить текущую логику: один вызов на папку, без «проиндексировано x/N», при необходимости без await.

### 3. Доработка `reindexStructure()`

- Показать status bar, этапы 1–4 с обновлением текста, включая «проиндексировано x/N» на этапе загрузки.
- Подсчёт N → цикл загрузки с прогрессом → «Переиндексация завершена» → скрыть через 2–3 сек.
- `try/finally`: в `finally` всегда скрывать status bar; при ошибке в `catch` выставить «Переиндексация: ошибка» перед скрытием.

### 4. Файлы (сводка)

- **[src/metadataView.ts](src/metadataView.ts)** — StatusBarItem(ы), переиндексация с «проиндексировано x/N», expand, `refreshObjectStructure`, фильтр по подсистеме, первая загрузка и кэш, контекстный статус по выбранному узлу дерева (п. 1, 3, 4, 5).
- **[src/extension.ts](src/extension.ts)** — при необходимости общий StatusBarItem, команды genFromComment (п. 1).
- **[src/autogen-bsl](src/autogen-bsl)** — прогресс «Генерация кода…» при вызове MCP (п. 1).
- **[src/panels/MetadataPanel.ts](src/panels/MetadataPanel.ts)**, **[src/panels/TemplateEditorPanel.ts](src/panels/TemplateEditorPanel.ts)**, **[src/predefinedDataPanel.ts](src/predefinedDataPanel.ts)**, **[src/dcsEditor.ts](src/dcsEditor.ts)**, **[src/formPreviewer.ts](src/formPreviewer.ts)** — «Загрузка редактора…» при открытии (п. 1); контекстный статус при активной панели (п. 3).
- **[src/utils/commitFileLogger.ts](src/utils/commitFileLogger.ts)** — «Добавлено в Commit.txt» при успешной записи (п. 7).

## Риски

- Два прохода по папкам (подсчёт N, затем загрузка): дополнительно один glob по каждой папке. Обычно малозатратно по сравнению с readFile/parse.
- Последовательная загрузка вместо `Promise.all`: переиндексация может стать чуть дольше, зато прогресс «x/N» отображается пошагово.

## Кратко (переиндексация)

- Добавлен явный вывод **«проиндексировано x/N»** в status bar на этапе загрузки.
- x — порядковый номер обработанной конфигурации (файла), N — общее количество по всем папкам.
- N получаем предварительным проходом (поиск без загрузки), затем последовательная загрузка с обновлением x после каждого файла.

---

## 1. Прогресс длительных операций

Помимо переиндексации (см. выше), показывать в status bar прогресс для:

- **Раскрытие конфигурации (expand)** — при cache miss: парсинг ConfigDumpInfo, CreateTreeElements. Текст: `$(sync~spin) Загрузка конфигурации «X»…` (X = synonym конфигурации). По завершении скрыть или кратко «Готово». Точка внедрения: [metadataView.ts](src/metadataView.ts), метод `expand()` (стр. 1352+), ветка без кэша.
- **Обновление структуры объекта (`refreshObjectStructure`)** — парсинг XML, обновление кэша и дерева. Текст: `$(sync~spin) Обновление «ИмяОбъекта»…` → скрыть после завершения. Точка внедрения: [metadataView.ts](src/metadataView.ts), `refreshObjectStructure()` (стр. 206+).
- **Генерация из комментария (`genFromComment` / `genFromCommentPrompt`)** — вызов MCP, ожидание ответа. Текст: `$(sync~spin) Генерация кода…` на время запроса. Точки: [extension.ts](src/extension.ts) (команды), [autogen-bsl](src/autogen-bsl) (AIGenerator / MCPClient).
- **Открытие тяжёлых панелей** — Metadata, Predefined, DCS, Form preview при первом открытии: `scanMetadataRoot`, парсинг XML, загрузка метаданных. Текст: `$(sync~spin) Загрузка редактора…` на время инициализации. Панели: [MetadataPanel](src/panels/MetadataPanel.ts), [PredefinedDataPanel](src/predefinedDataPanel.ts), [DcsEditor](src/dcsEditor.ts), [formPreviewer](src/formPreviewer.ts).

Использовать общий или отдельные `StatusBarItem` для коротких сообщений; показ/скрытие в `try/finally`.

---

## 3. Контекстный статус (что сейчас открыто)

- **Выбранный узел в дереве метаданных** — при выборе элемента в 1C Metadata Viewer показывать в status bar, например: `1С: Справочник.Номенклатура` или `1С: Конфигурация Базовая`. Опционально: клик по статусу выполняет команду (например, открыть свойства). Реализация: подписка на `onDidChangeTreeViewSelection` у TreeView `metadataView` в [metadataView.ts](src/metadataView.ts).
- **Активная панель расширения** — при открытой вкладке редактора СКД / макета / формы / предопределённых показывать, например: `1С: СКД — Отчёт.X`, `1С: Макет — Документ.X`, `1С: Форма — …`, `1С: Предопределённые — …`. Реализация: подписка на `vscode.window.onDidChangeActiveTextEditor` или отслеживание активной панели при открытии/закрытии (DcsEditor, TemplateEditorPanel, FormPreviewer, PredefinedDataPanel).

Отдельный «контекстный» `StatusBarItem` с более высоким приоритетом; обновлять при смене выделения или активного редактора.

---

## 4. Фильтр по подсистеме

При выполнении **фильтра по подсистеме** (`filterBySubsystem`, `selectSubsystemToFilter`): возможны `expand` конфигурации (если ещё не раскрыта), quick pick, перестройка дерева. При длительном `expand` показывать в status bar: `$(sync~spin) Применение фильтра по подсистеме…` на время операции, затем скрыть. Точки внедрения: [metadataView.ts](src/metadataView.ts), `filterBySubsystem()` (стр. 826+), `selectSubsystemToFilter()` (стр. 1015+), вызовы `expand()` перед применением фильтра.

---

## 5. Кэш и первая загрузка

- **Старт расширения** — при вызове `LoadAndParseConfigurationXml` по каждой workspace-папке в конструкторе [MetadataView](src/metadataView.ts): показывать `$(sync~spin) Поиск конфигураций…` (при желании — «найдено N» после первого прохода). Скрывать после завершения первичного сканирования. Учитывать, что при старте сейчас вызовы без `await`; при введении async-версии можно `void LoadAndParse(...)` и обновлять статус внутри.
- **Использование кэша при expand** — опционально: при cache hit кратко показывать `Кэш: загружена конфигурация X` на 1–2 сек, чтобы отличать быструю загрузку из кэша от полной пересборки. Точка: [metadataView.ts](src/metadataView.ts), метод `expand()`, ветка с `isValidCache`.

---

## 7. Commit.txt (CommitFileLogger)

При **успешном добавлении файлов в Commit.txt** (логирование сохранений BSL) показывать в status bar: `$(check) Добавлено в Commit.txt` на 2–3 сек, затем скрыть. Точки внедрения: [utils/commitFileLogger.ts](src/utils/commitFileLogger.ts) — методы, которые пишут в Commit.txt (например, добавление при сохранении, «добавить все»). Сейчас при ошибке используется `showWarningMessage`; статус — только при успешной записи.