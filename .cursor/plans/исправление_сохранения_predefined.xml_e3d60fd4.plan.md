---
name: Исправление сохранения Predefined.xml
overview: ""
todos:
  - id: "1"
    content: Изучить функцию formatXml из xmlDomUtils.ts для понимания форматирования XML
    status: completed
  - id: "2"
    content: "Добавить функции для работы с исходным XML в predefinedSerializer.ts: findItemByCode, updateExistingItemInXml, createNewItemXml, extractItemTemplate, generateItemId, removeItemByCode"
    status: completed
    dependencies:
      - "1"
  - id: "3"
    content: Переработать serializePredefinedXmlWithDom для использования исходного XML как шаблона с сохранением форматирования
    status: completed
    dependencies:
      - "2"
  - id: "4"
    content: "Добавить функцию isNumericCode(code: string): boolean для проверки типа Code и логику сохранения атрибутов (id для Item, условный xsi:type для Code) при создании новых элементов"
    status: completed
    dependencies:
      - "2"
  - id: "5"
    content: Применить formatXml к результату сериализации для правильного форматирования
    status: completed
    dependencies:
      - "3"
  - id: "6"
    content: Протестировать на файлах из test-cases/compare/ для проверки сохранения структуры
    status: completed
    dependencies:
      - "5"
---

# Исправление сохранения структуры Predefined.xml

## Проблема

При сохранении предопределенных элементов нарушается структура XML:

1. **Потеря форматирования**: новые элементы добавляются в одну строку без отступов и переносов
2. **Потеря атрибутов**: новые элементы Item не имеют атрибута `id`
3. **Неправильная обработка Code**: элементы Code могут быть числами (с `xsi:type="xs:decimal"`) или строками (без атрибута)
4. **Неправильная сериализация**: `XMLSerializer.serializeToString()` не сохраняет форматирование исходного XML

## Решение

Использовать подход с сохранением исходного XML и применением изменений через строковые замены:

- Сопоставление элементов по значению Code
- Сохранение исходного порядка элементов
- Полное удаление отсутствующих элементов
- Автоматическое определение типа Code для новых элементов

## Пошаговая реализация

### Шаг 1: Изучить функцию formatXml

**Файл**: `src/utils/xmlDomUtils.ts`

- Изучить реализацию функции `formatXml` для понимания форматирования XML
- Понять, как она обрабатывает отступы, переносы строк и структуру XML

### Шаг 2: Добавить вспомогательные функции

**Файл**: `src/xmlParsers/predefinedSerializer.ts`

Добавить следующие функции:

1. **`isNumericCode(code: string): boolean`**

- Проверяет, является ли Code числом
- Логика: можно ли преобразовать в число и обратно без потери информации
- Примеры: `"1"` → `true`, `"000000001"` → `false` (теряются ведущие нули)

2. **`findItemByCode(originalXml: string, code: string): { xml: string, startIndex: number, endIndex: number } | null`**

- Поиск элемента Item по значению Code в исходном XML
- Возвращает XML представление элемента и его позицию

3. **`extractItemTemplate(originalXml: string): string`**

- Извлечение шаблона первого элемента Item из исходного XML
- Сохраняет форматирование и структуру

4. **`generateItemId(): string`**

- Генерация UUID для нового элемента Item (атрибут `id`)

5. **`updateExistingItemInXml(originalXml: string, code: string, newItem: PredefinedDataItem): string`**

- Обновление существующего элемента в исходном XML по Code
- Сохраняет форматирование и атрибуты

6. **`createNewItemXml(templateItemXml: string, newItem: PredefinedDataItem): string`**

- Создание нового элемента на основе шаблона
- Заменяет значения (Name, Code, Description, IsFolder)
- Генерирует новый UUID для атрибута `id`
- Добавляет `xsi:type="xs:decimal"` к Code если `isNumericCode(code) === true`

7. **`removeItemByCode(originalXml: string, code: string): string`**

- Удаление элемента Item по Code из исходного XML
- Полностью удаляет элемент со всем содержимым

### Шаг 3: Переработать serializePredefinedXmlWithDom

**Файл**: `src/xmlParsers/predefinedSerializer.ts`

Алгоритм работы функции:

1. **Парсинг исходного XML**

- Получить все элементы Item с их Code и порядком
- Сохранить исходный XML как основу для изменений

2. **Сопоставление элементов по Code**

- Для каждого элемента из нового списка `items` найти соответствующий в исходном XML по Code
- Разделить на три группы: существующие, новые, удаленные

3. **Обновление существующих элементов**

- Для каждого найденного элемента вызвать `updateExistingItemInXml`
- Сохраняется исходный формат Code и порядок элемента

4. **Удаление отсутствующих элементов**

- Найти все Code из исходного XML, которых нет в новом списке
- Для каждого отсутствующего Code вызвать `removeItemByCode`
- Удалять в обратном порядке (чтобы не сбить индексы)

5. **Добавление новых элементов**

- Извлечь шаблон через `extractItemTemplate`
- Для каждого нового элемента вызвать `createNewItemXml`
- Добавить элементы в конец списка с правильным форматированием

6. **Форматирование результата**

- Применить `formatXml` из `xmlDomUtils.ts` к результату
- Сохранить BOM в начале файла### Шаг 4: Тестирование

**Файлы для тестирования**: `test-cases/compare/Predefined1.xml`, `test-cases/compare/Predefined2.xml`

Проверить:

- Сохранение форматирования (табуляция, переносы строк)
- Сохранение атрибута `id` для всех элементов Item
- Правильная обработка Code:
- Числовые Code (`"1"`, `"2"`) → `xsi:type="xs:decimal"`
- Строковые Code (`"000000001"`, `"ABC"`) → без атрибута
- Сохранение исходного порядка элементов
- Полное удаление отсутствующих элементов

## Файлы для изменения

1. **`src/xmlParsers/predefinedSerializer.ts`** - основная логика сериализации
2. **`src/utils/xmlDomUtils.ts`** - использовать функцию `formatXml` (уже существует)

## Правила обработки

- **Сопоставление**: по значению Code (не по id или позиции)
- **Порядок**: сохранять исходный порядок элементов, новые добавлять в конец
- **Удаление**: полностью удалять элемент Item, если его Code отсутствует в новом списке
- **Code**: автоматически определять тип для новых элементов через `isNumericCode`

---
