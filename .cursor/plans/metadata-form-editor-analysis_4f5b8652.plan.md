---
name: metadata-form-editor-analysis
overview: Проанализировать текущую реализацию редактора форм объектов метаданных (webview React + @rjsf/core) и предложить несколько вариантов улучшений с приоритетом UX/стабильность/поддерживаемость/производительность — без внесения изменений в код.
todos:
  - id: analyze-current-flows
    content: Разобрать текущие сценарии редактирования и точки рассинхронизации (FormEditor ↔ MetadataEditor).
    status: completed
  - id: identify-data-integrity-risks
    content: Выявить риски неконсистентных структур (attributes/tabularSections/StandardAttributes/RegisterRecords/Type).
    status: completed
  - id: draft-improvements-ux
    content: Сформировать варианты улучшений UX для работы с реквизитами/табличными частями/типами.
    status: completed
  - id: draft-improvements-stability
    content: Сформировать варианты улучшений стабильности (единая модель данных, нормализация, валидация, устранение гонок).
    status: completed
  - id: draft-improvements-maintainability-performance
    content: Сформировать варианты по поддерживаемости и производительности (декомпозиция, мемоизация, виртуализация).
    status: completed
isProject: false
---

# Анализ и варианты улучшений: редактор форм объектов метаданных

## Контекст (что анализируем)

- **UI-слой (webview)**: основной компонент формы и вкладок — [src/webview/components/FormEditor.tsx](src/webview/components/FormEditor.tsx).
- **Контейнер/интеграция с XML и выбранным объектом**: [src/webview/components/MetadataEditor.tsx](src/webview/components/MetadataEditor.tsx).
- **Генерация JSON Schema**: [src/schemas/schemaGenerator.ts](src/schemas/schemaGenerator.ts).
- **Виджеты**:
  - редактор типов — [src/webview/widgets/TypeWidget.tsx](src/webview/widgets/TypeWidget.tsx)
  - многоязычность — [src/webview/widgets/MultilingualWidget.tsx](src/webview/widgets/MultilingualWidget.tsx)
  - упрощённый многоязычный редактор — [src/webview/components/FormEditor/SimpleMultilingualEditor.tsx](src/webview/components/FormEditor/SimpleMultilingualEditor.tsx)
- **Справочники для UI-редактирования полей**: [src/metadata/field-values.ts](src/metadata/field-values.ts).
- **Модалки FormEditor**: [src/webview/components/FormEditor/](src/webview/components/FormEditor/).

## Текущая архитектура и поток данных (кратко)

- В `MetadataEditor.tsx` есть два независимых канала изменений:
  - `handleFormChange(data)` — обновляет `formData` и также пробрасывает `properties` в `selectedObject`.
  - `handleSelectedObjectChange(updatedObject)` — обновляет `selectedObject`, синхронизирует `formData` из `updatedObject.properties`, и обновляет `xmlContent` из `_originalXml`.
- В `FormEditor.tsx` вкладки (`activeTab`) рендерятся разными ветками:
  - `properties`: кастомная отрисовка “Основные / Стандартные реквизиты / Движения документа / Прочие”
  - `attributes`: список реквизитов + модалки (добавить/удалить/редактировать тип)
  - `tabular`: табличные части + реквизиты табличных частей
  - спец-вкладки: `characteristicTypes`, `accountingFlags`
  - fallback: `@rjsf/core` форма по `schema/uiSchema`.

```mermaid
flowchart TD
  MetadataEditor -->|props:formData,selectedObject,activeTab| FormEditor
  FormEditor -->|onChange(properties)| handleFormChange
  FormEditor -->|onSelectedObjectChange(structure)| handleSelectedObjectChange
  handleFormChange -->|setFormData,setSelectedObject.properties| MetadataEditor
  handleSelectedObjectChange -->|setSelectedObject,setFormData,setXmlContent| MetadataEditor
  FormEditor --> Modals
  Modals -->|TypeWidget| TypeWidget
```



## Что я сделаю (аналитический результат)

- Составлю **карту текущих сценариев редактирования** (properties/attributes/tabular/standardAttributes/RegisterRecords/types).
- Выявлю **риски рассинхронизации и неконсистентных структур** (особенно из-за смешения `formData` и `selectedObject`).
- Сформирую **набор вариантов улучшений** (A/B/D/E) в формате “описание → что меняем → выгода → риски → трудоёмкость”.

## Варианты улучшений (что будет в выдаче)

Я предложу несколько независимых вариантов, сгруппированных по приоритетам:

- **A (UX)**: поиск/фильтры/массовые действия/улучшение редактирования реквизитов.
- **B (стабильность)**: единая модель данных, валидация/нормализация структуры реквизитов, устранение гонок состояния.
- **D (поддерживаемость)**: декомпозиция `FormEditor.tsx`, вынесение повторяемой логики (multilingual render, value extract), типизация.
- **E (производительность)**: уменьшение лишних перерендеров, мемоизация, виртуализация списков реквизитов/табличных частей.

## Формат итоговой записки

- 1–2 абзаца: текущее устройство и основные проблемы.
- До 5 пунктов: «Что важно», «Почему», «Что делать дальше», «Риски», «Открытые вопросы».
- Список улучшений: 5–10 вариантов, каждый с оценкой эффекта/риска/сложности.

## Результат анализа

Редактор форм фактически работает в двух моделях данных: **`formData` (properties)** и **`selectedObject` (вся структура `ParsedMetadataObject`)**.

На стороне сохранения (`applyChangesToXmlStringWithDom` в `src/utils/xmlDomUtils.ts`) важно, что массивы `attributes/tabularSections/accountingFlags/...` при наличии трактуются как **«источник истины»** и XML синхронизируется, включая удаления, матчинг идёт по **`uuid`/`name`**. Поэтому рассинхронизация между `formData` и `selectedObject` может приводить к потере/откату изменений при сохранении.

- **Что важно**
  - **Две “истины”**: `formData` и `selectedObject`, плюс два независимых канала обновления.
  - **Сохранение ChildObjects** ведёт себя как синхронизация списков (включая удаление отсутствующих), с матчингом по `uuid/name`.
  - `FieldInput` сейчас по умолчанию пишет строки и может **скрывать не-строковые значения** (риск некорректного сохранения чисел/объектов).
- **Почему**
  - Потому что `handleSave` отправляет `selectedObject` как основу payload, а `xmldom`-патчер применяет списки как финальную правду.
- **Что делать дальше**
  - Для приоритета “стабильность” начинать с **B2 + B4** (ниже), затем добавлять UX/перфоманс.
- **Риски**
  - Потеря изменений в `attributes/tabularSections/StandardAttributes/RegisterRecords` при сохранении (из‑за рассинхронизации).
  - Некорректные типы значений (строка вместо числа/enum) и “тихие” поломки, заметные только в XML/в конфигураторе.
- **Открытые вопросы**
  - Какие операции критичнее “не терять”: правки реквизитов (Synonym/Comment/прочие свойства) или правки `StandardAttributes`/`RegisterRecords`?

### Варианты улучшений (A/B/D/E)

1. **B1: Единый “черновик объекта” (Single Source of Truth)**

- **Что меняем**: в `MetadataEditor.tsx` держим один `draftObject: ParsedMetadataObject`; `formData` выводим из `draftObject.properties`; все апдейты идут через единый слой обновления.
- **Эффект**: высокий (устраняет класс рассинхронов).
- **Риск**: средний.
- **Сложность**: высокая.

1. **B2: Быстрый фикс без архитектурного рефакторинга — “структурные правки всегда через `onSelectedObjectChange`”**

- **Что меняем**: в `FormEditor.tsx` любые изменения внутри `attributes/tabularSections/accountingFlags/...` (в т.ч. Synonym/Comment/прочие свойства) должны обновлять `updatedObject` и вызывать `onSelectedObjectChange(updatedObject)`; `onChange(formData)` оставить только для `properties`.
- **Эффект**: высокий.
- **Риск**: низкий–средний.
- **Сложность**: средняя.

1. **B3: Нормализация/валидация структуры перед сохранением**

- **Что меняем**: слой нормализации для `ParsedMetadataObject` в webview (shape guard): согласованность `name`, `properties.Name`, `childObjectKind`, обязательность/формат `uuid` при создании новых элементов.
- **Эффект**: средний.
- **Риск**: средний.
- **Сложность**: средняя.

1. **A1: UX для больших списков реквизитов/табличных частей**

- **Что меняем**: поиск/фильтр/сортировка (по имени/типу/Kind), массовые действия (удаление/дублирование), “показать все свойства” вместо `slice(0, N)`.
- **Эффект**: средний–высокий.
- **Риск**: низкий.
- **Сложность**: средняя.

1. **A2: Валидация в модалках вместо `alert()**`

- **Что меняем**: локальная валидация обязательных полей + disabled “Создать/Сохранить” + подсветка ошибок.
- **Эффект**: средний.
- **Риск**: низкий.
- **Сложность**: низкая–средняя.

1. **B4: Типобезопасный ввод значений (`FieldInput`)**

- **Что меняем**: поддержка `number` (и безопасный parse/format), корректный показ не-строковых значений, единый источник enum/labels из `src/metadata/field-values.ts`.
- **Эффект**: высокий.
- **Риск**: средний.
- **Сложность**: средняя.

1. **D1: Декомпозиция `FormEditor.tsx**`

- **Что меняем**: вынести вкладки в отдельные компоненты (`PropertiesTab/AttributesTab/TabularTab/...`), вынести повторяющуюся логику (extract multilingual, format display, update helpers).
- **Эффект**: средний.
- **Риск**: средний.
- **Сложность**: высокая.

1. **E1: Производительность на больших объектах**

- **Что меняем**: `React.memo`/стабильные callbacks, уменьшение inline‑функций/inline‑styles, виртуализация списков (например, `react-window`) для `attributes/tabularSections`.
- **Эффект**: средний–высокий на больших конфигурациях.
- **Риск**: низкий–средний.
- **Сложность**: средняя.

