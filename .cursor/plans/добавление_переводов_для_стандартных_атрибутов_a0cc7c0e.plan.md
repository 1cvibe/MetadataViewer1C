---
name: Добавление переводов для стандартных атрибутов
overview: Добавить переводы для 13 отсутствующих стандартных атрибутов (Posted, Ref, DeletionMark, Date, Number, Owner, Parent, Code, Level, IsFolder, DataVersion, LockedByDBMS, ReadOnly) в FIELD_LABELS в файле field-values.ts
todos:
  - id: analyze-standard-attributes
    content: Проанализировать стандартные атрибуты из baseSchema.ts и проверить существующие переводы в FIELD_LABELS
    status: pending
  - id: add-standard-attributes-translations
    content: "Добавить переводы для 13 отсутствующих стандартных атрибутов: Posted, Ref, DeletionMark, Date, Number, Owner, Parent, Code, Level, IsFolder, DataVersion, LockedByDBMS, ReadOnly"
    status: pending
  - id: verify-standard-attributes
    content: Проверить корректность добавленных переводов, отсутствие дубликатов и синтаксические ошибки
    status: pending
---

# План добавления переводов для стандартных атрибутов

## Цель

Добавить переводы для всех стандартных атрибутов, которые определены в `standardAttributeSchema` в файле `src/schemas/baseSchema.ts`, но отсутствуют в словаре переводов `FIELD_LABELS` в файле `src/Metadata/field-values.ts`.

## Обнаруженная проблема

В файле `src/schemas/baseSchema.ts` определены 16 стандартных атрибутов в enum свойства `name` схемы `standardAttributeSchema`:

```typescript
enum: ['Posted', 'Ref', 'DeletionMark', 'Date', 'Number', 'Owner', 'Parent', 'Code', 'Description', 'Predefined', 'Level', 'IsFolder', 'DataVersion', 'LockedByDBMS', 'WriteMode', 'ReadOnly']
```

Из них только 3 имеют переводы в `FIELD_LABELS`:

- `Description` - 'Описание'
- `Predefined` - 'Предопределенное'
- `WriteMode` - 'Режим записи'

**Отсутствуют переводы для 13 стандартных атрибутов:**

1. `Posted` - Проведен
2. `Ref` - Ссылка
3. `DeletionMark` - Пометка удаления
4. `Date` - Дата
5. `Number` - Номер
6. `Owner` - Владелец
7. `Parent` - Родитель
8. `Code` - Код
9. `Level` - Уровень
10. `IsFolder` - Это папка
11. `DataVersion` - Версия данных
12. `LockedByDBMS` - Заблокировано СУБД
13. `ReadOnly` - Только чтение

## Использование в коде

- Все 16 стандартных атрибутов используются в `scripts/schemas-code.txt`
- `StandardAttributes` используется в 19 местах в `src/schemas/objectSchemas.ts`
- Стандартные атрибуты отображаются в UI через функцию `getFieldLabel()`, которая использует `FIELD_LABELS` для перевода

## Шаги выполнения

### 1. Анализ существующих переводов

- Файл: `src/Metadata/field-values.ts`
- Проверить текущее состояние `FIELD_LABELS`
- Убедиться, что отсутствуют именно эти 13 переводов

### 2. Добавление переводов в FIELD_LABELS

- Открыть файл `src/Metadata/field-values.ts`
- Найти объект `FIELD_LABELS` (строки 251-479)
- Добавить 13 новых переводов для стандартных атрибутов
- Разместить их логически сгруппированными (можно после существующих переводов или в алфавитном порядке)

### 3. Проверка использования в схемах

- Убедиться, что все стандартные атрибуты из `baseSchema.ts` имеют переводы
- Проверить, что переводы используются корректно в UI

### 4. Верификация

- Проверить, что все новые переводы добавлены корректно
- Убедиться, что нет дубликатов ключей
- Проверить синтаксис TypeScript
- Убедиться, что переводы соответствуют терминологии 1С:Предприятие

## Структура добавляемых переводов

Каждый перевод добавляется в формате:

```typescript
'AttributeName': 'Перевод на русский язык',
```

Переводы должны быть:

- Понятными и точными
- Соответствующими терминологии 1С:Предприятие
- Согласованными с существующими переводами

## Файлы для изменения

- `src/Metadata/field-values.ts` - добавление переводов в `FIELD_LABELS`

## Ожидаемый результат

После выполнения плана все 16 стандартных атрибутов будут иметь переводы в `FIELD_LABELS`, что обеспечит корректное отображение названий стандартных атрибутов в интерфейсе редактора метаданных при работе с `StandardAttributes`.