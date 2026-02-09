# План переноса модулей metadata из autogen-bsl

## Анализ использования модулей

Модули из `src/autogen-bsl/metadata` используются в:
- `queryStringEditor.ts` - использует `MetadataScanner` и `MetadataRepository`
- `dcsEditor.ts` - использует `MetadataScanner` и `MetadataRepository`
- `formPreviewer.ts` - использует `MetadataScanner`
- `panels/MetadataPanel.ts` - использует `MetadataScanner`

Эти модули не связаны с генерацией кода, а являются утилитами для работы с метаданными конфигурации.

## Структура проекта

В проекте уже есть:
- `src/Metadata/` (с большой буквы) - типы и конфигурация для webview компонентов
- `src/runtime/` - runtime модули, включая `MetadataCache.ts`
- `src/xmlParsers/` - парсеры XML файлов

## Предлагаемое решение

Создать новую папку `src/metadata_utils/` для утилит работы с метаданными и перенести туда модули из `src/autogen-bsl/metadata/`.

**Обоснование:**
- Избегает путаницы с `src/Metadata/` (webview-специфичные типы)
- Явное указание на назначение - утилиты для работы с метаданными
- Логическая группировка утилит для работы с метаданными
- Не смешивается с runtime модулями
- Четкое разделение ответственности

## План переноса

### 1. Создать папку `src/metadata_utils/`
- Создать новую папку для утилит работы с метаданными

### 2. Перенести файлы из `src/autogen-bsl/metadata/` в `src/metadata_utils/`
- `MetadataScanner.ts` → `src/metadata_utils/MetadataScanner.ts`
- `MetadataRepository.ts` → `src/metadata_utils/MetadataRepository.ts`
- `UniversalMetadataParser.ts` → `src/metadata_utils/UniversalMetadataParser.ts`
- `UnicodeName.ts` → `src/metadata_utils/UnicodeName.ts`
- `PredefinedXmlParser.ts` → `src/metadata_utils/PredefinedXmlParser.ts`

### 3. Обновить импорты во всех файлах

**Файлы для обновления:**
- `src/queryStringEditor.ts` - обновить импорты из `./autogen-bsl/metadata/` на `./metadata_utils/`
- `src/dcsEditor.ts` - обновить импорты из `./autogen-bsl/metadata/` на `./metadata_utils/`
- `src/formPreviewer.ts` - обновить импорты из `./autogen-bsl/metadata/` на `./metadata_utils/`
- `src/panels/MetadataPanel.ts` - обновить импорты из `../autogen-bsl/metadata/` на `../metadata_utils/`

**Внутренние импорты в перенесенных файлах:**
- `MetadataRepository.ts` - обновить импорты `UniversalMetadataParser` и `MetadataScanner`
- `MetadataScanner.ts` - обновить импорт `UnicodeName`
- `UniversalMetadataParser.ts` - обновить импорты `UnicodeName` и `PredefinedXmlParser`
- `PredefinedXmlParser.ts` - обновить импорт `UniversalMetadataParser`

### 4. Удалить пустую папку `src/autogen-bsl/metadata/`
- После переноса всех файлов удалить пустую папку

## Итоговая структура

```
src/
├── metadata_utils/              # НОВАЯ ПАПКА - утилиты для работы с метаданными
│   ├── MetadataScanner.ts
│   ├── MetadataRepository.ts
│   ├── UniversalMetadataParser.ts
│   ├── UnicodeName.ts
│   └── PredefinedXmlParser.ts
├── Metadata/                     # Существующая - типы для webview
│   ├── Configuration/
│   ├── field-values.ts
│   ├── metadata-types.ts
│   └── types.ts
├── autogen-bsl/                  # Только генерация кода
│   ├── generators/
│   ├── init.ts
│   ├── intent/
│   ├── routing/
│   └── ux/
└── ...
```

## Преимущества

1. **Четкое разделение ответственности**: `autogen-bsl` только для генерации кода
2. **Логическая группировка**: все утилиты метаданных в одном месте
3. **Улучшенная навигация**: проще найти модули для работы с метаданными
4. **Масштабируемость**: легко добавлять новые утилиты для метаданных

## TODO

- [ ] Создать папку `src/metadata_utils/`
- [ ] Перенести все файлы из `src/autogen-bsl/metadata/` в `src/metadata_utils/`
- [ ] Обновить внутренние импорты в перенесенных файлах
- [ ] Обновить импорты в `queryStringEditor.ts`, `dcsEditor.ts`, `formPreviewer.ts`, `panels/MetadataPanel.ts`
- [ ] Удалить пустую папку `src/autogen-bsl/metadata/`
- [ ] Проверить компиляцию проекта
