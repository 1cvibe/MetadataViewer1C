# Обзор тестов в test-cases

## Категории тестов

### 1. Тесты СКД (Data Composition Schema)

#### test-dcs-save.js
- **Назначение**: Тест сохранения изменений в DCS схеме
- **Что тестирует**: 
  - Парсинг Report.xml и Template.xml
  - Изменение данных в схеме (например, имя dataSet)
  - Сохранение через XmlDiffMerge и сериализацию
  - Проверка корректности сохраненных изменений
- **Использует**: `parseReportXmlForDcs`, `serializeDcsToPreserveOrder`, `XmlDiffMerge`, `serializeToXml`

#### test-dcs-xmldom.js
- **Назначение**: Тест DCS парсера и сериализатора на основе xmldom
- **Что тестирует**:
  - Парсинг Report.xml через xmldom
  - Наличие _domDocument
  - Сохранение xmlns атрибутов
  - Корректность сериализации обратно в XML
  - Отсутствие "кракозябр" (проблем с кодировкой)
- **Использует**: `parseReportXmlForDcs`, `serializeToXml` (xmldom версия)

#### test-template-xmldom.js
- **Назначение**: Простой тест DCS сериализатора (только Template.xml)
- **Что тестирует**:
  - Парсинг Template.xml через xmldom
  - Проверка BOM (Byte Order Mark)
  - Сериализация обратно в XML
  - Сохранение структуры и атрибутов

#### test-dcs-query-editing.js
- **Назначение**: Тест редактирования запросов в DCS схеме
- **Что тестирует**:
  1. Добавление нового поля в запрос
  2. Редактирование середины запроса (сохранение существующих полей)
  3. Добавление нескольких полей одновременно
  4. Запрос с несколькими пакетами (разделенных `;`)
  5. Пустой запрос (поля не должны удалиться)
- **Использует**: `extractFieldNamesFromQuery` (имитация логики из DcsEditorApp)

#### test-dcs-query-alias-protocol.js
- **Назначение**: Протоколирование алиасов в запросах DCS
- **Что делает**:
  - Находит DCS Template.xml в отчётах
  - Извлекает dataSet.query
  - Эмулирует последовательность редактирований (rename алиаса)
  - Строит карту алиасов (объявленных через КАК/AS)
- **Запуск**: `node test-cases/test-dcs-query-alias-protocol.js --reportsDir "D:\\1C\\RZDZUP\\src\\cf\\Reports" --limit 5`

#### test-full-flow-with-reorder.js
- **Назначение**: Полный flow как в редакторе (парсинг → переупорядочивание → сериализация)
- **Что тестирует**:
  - Функцию `reorderRootSectionsForSave` (переупорядочивание секций корня)
  - Функцию `reorderDataSetChildren` (переупорядочивание детей dataSet)
  - Правильный порядок элементов согласно требованиям 1С

#### test-dataset-order.js
- **Назначение**: Тест порядка элементов в dataSet
- **Что тестирует**: Правильный порядок name → field → dataSource → query

### 2. Тесты сохранения метаданных

#### metadata-save-test.js
- **Назначение**: Комплексный тест сохранения метаданных 1С
- **Что тестирует**:
  - Сохранение изменений в XML файлах метаданных для всех типов объектов
  - Поддерживает: Catalog, Document, Enum, Report, DataProcessor, Register, Constant, Subsystem и др.
  - Исключает: CommonModules
- **Процесс**:
  1. Сканирует конфигурацию (до 20 файлов каждого типа)
  2. Парсит XML через `parseMetadataXml`
  3. Вносит безопасные изменения
  4. Сохраняет через `applyChangesToXmlStringWithDom`
  5. Сравнивает структуру через `compareXmlFiles`
- **Результаты**: Сохраняет в `metadata-save-results/` и `metadata-save-tests/`

#### test-form-save-documents.js
- **Назначение**: Автотест сохранения XML форм документов
- **Что тестирует**:
  - Сохранение форм через prod-пайплайн (xmldom + normalize + validate)
  - Находит все формы документов в конфигурации
  - Вносит безопасные изменения (добавляет маркер в строковое свойство)
  - Проверяет сохранение структуры XML
- **Использует**: `parseFormXmlFull`, `applyFormChangesToXmlStringWithDom`, `normalizeXML`, `validateXML`
- **Результаты**: Сохраняет в `output/form-save/` (before/after/after-add)

### 3. Тесты структуры XML

#### xml-structure-comparison.js
- **Назначение**: Утилита для детального сравнения XML структур
- **Что делает**:
  - Рекурсивное сравнение элементов XML
  - Классификация различий (критические, предупреждения, информационные)
  - Экспорт результатов в JSON
- **Типы различий**:
  - Критические: `structure_incorrect`, `structure_change`, `attribute_missing_in_second` (uuid)
  - Предупреждения: `missing_in_first`, `missing_in_second`, `tag_name_mismatch`, `attribute_value_mismatch`
  - Информационные: `attribute_missing_in_first`
- **Использование**: `node test-cases/xml-structure-comparison.js <файл1.xml> <файл2.xml> [output.json]`

#### xml-structure-tests/
- **Назначение**: Тестовые XML файлы для проверки сохранения структуры
- **Файлы**:
  - `01-properties-with-attributes.xml` - Properties с атрибутами
  - `02-properties-with-elements.xml` - Properties с элементами
  - `03-mixed-structure.xml` - Смешанная структура (атрибуты + элементы)
  - `04-standard-attributes.xml` - StandardAttributes с атрибутами
  - `05-tabular-section.xml` - Табличная часть с реквизитами

#### comprehensive-xml-structure-test.js
- **Назначение**: Комплексный тест структуры XML
- **Что тестирует**: Сравнение структуры двух XML файлов (Form1.xml и Form2.xml)

#### compare-xmldom-structure.js
- **Назначение**: Сравнение XML структур через xmldom
- **Что тестирует**: Детальное сравнение структуры с использованием DOMParser

### 4. Тесты форматирования XML

#### comprehensive-formatting-check.js
- **Назначение**: Комплексная проверка форматирования XML
- **Что тестирует**: Сравнение отступов и форматирования элементов

#### detailed-xml-formatting-check.js
- **Назначение**: Детальная проверка форматирования XML
- **Что тестирует**: Анализ форматирования каждого элемента

#### detailed-line-comparison.js
- **Назначение**: Построчное сравнение XML файлов
- **Что тестирует**: Порядок элементов и их структура

### 5. Тесты кодировки и BOM

#### test-bom.js
- **Назначение**: Проверка BOM (Byte Order Mark) в XML файлах
- **Что тестирует**:
  - Наличие BOM (EF BB BF) в файлах
  - Рекомендации по сохранению с/без BOM
  - Проверка функции saveDcs

#### test-encoding.js
- **Назначение**: Тест кодировки UTF-8
- **Что тестирует**: Корректность сохранения кириллицы и специальных символов

#### test-final-bom-fix.js
- **Назначение**: Финальная проверка исправления BOM
- **Что тестирует**: Корректность добавления BOM при сохранении

### 6. Тесты переупорядочивания

#### test-reorder-function.js
- **Назначение**: Тест функции переупорядочивания элементов
- **Что тестирует**: Правильный порядок элементов после переупорядочивания

#### test-tag-order.js
- **Назначение**: Тест порядка тегов
- **Что тестирует**: Сохранение правильного порядка тегов в XML

### 7. Прочие тесты

#### round-trip-test.js
- **Назначение**: Тест round-trip (парсинг → сохранение → сравнение)
- **Что тестирует**: Идентичность структуры XML после парсинга и сохранения

#### test-validate-template.js
- **Назначение**: Валидация Template.xml
- **Что тестирует**: Корректность структуры Template.xml

#### test-resave-template.js / test-resave-template2.js
- **Назначение**: Тест повторного сохранения Template.xml
- **Что тестирует**: Сохранение структуры при повторном сохранении

#### test-template-direct.js
- **Назначение**: Прямой тест Template.xml
- **Что тестирует**: Парсинг и сохранение Template.xml без Report.xml

#### test-full-reparse.js
- **Назначение**: Тест полного перепарсинга
- **Что тестирует**: Корректность после полного перепарсинга XML

#### test-single.js
- **Назначение**: Одиночный тест
- **Что тестирует**: Базовый функционал парсинга/сохранения

#### test-namespace.js
- **Назначение**: Тест namespace в XML
- **Что тестирует**: Сохранение namespace префиксов и атрибутов

#### validate-xml-structure.js
- **Назначение**: Валидация структуры XML
- **Что тестирует**: Проверка корректности структуры XML файлов

## Документация

### README_DCS_QUERY_EDITING.md
- Описание тестов редактирования запросов в DCS схеме
- 5 тестовых сценариев
- Технические детали и логика извлечения полей

### XML_STRUCTURE_COMPARISON_README.md
- Описание утилиты сравнения XML структур
- Типы различий и их классификация
- Примеры использования и интеграция с тестами

### xml-structure-tests/README.md
- Описание тестовых XML файлов
- 5 тестовых случаев для проверки сохранения структуры

## Результаты тестов

### output/
- `form-save/` - результаты сохранения форм (before/after/after-add)
- `test-dcs-save-summary.json` - сводка тестов DCS
- `test-form-save-documents-summary.json` - сводка тестов форм
- `template-direct-resaved.xml` - результат прямого сохранения Template.xml

### metadata-save-results/
- Результаты сохранения метаданных по типам объектов
- `xml-structure-comparison-summary.json` - сводка сравнения структур

### metadata-save-tests/
- Тестовые файлы для сохранения метаданных по типам объектов

## Запуск тестов

Большинство тестов запускаются через Node.js:
```bash
node test-cases/<имя-теста>.js
```

Некоторые тесты принимают аргументы:
```bash
node test-cases/test-dcs-query-alias-protocol.js --reportsDir "D:\\1C\\RZDZUP\\src\\cf\\Reports" --limit 5
node test-cases/test-form-save-documents.js "D:/1C/RZDZUP/src/cf" 10
```

## Важные замечания

1. **BOM (Byte Order Mark)**: 1С конфигуратор требует UTF-8 с BOM (EF BB BF)
2. **Порядок элементов**: Критически важен для корректной загрузки в конфигуратор 1С
3. **Структура XML**: Атрибуты должны оставаться атрибутами, элементы - элементами
4. **Namespace**: Важно сохранять namespace префиксы и атрибуты
5. **Кодировка**: UTF-8, кириллица должна сохраняться корректно
