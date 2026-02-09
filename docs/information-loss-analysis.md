# Анализ потери информации о структуре XML

## Проблемные места в parseProperties

### 1. Строка 311-313: Простые строковые значения
**Код:**
```typescript
} else if (typeof val === 'string') {
    // Сохраняем строковые значения как есть (без перевода)
    props[cleanKey] = val;
}
```

**Проблема:**
- Если в XML было `<Properties Name="Test">` (атрибут), парсер создает `{ Name: "Test" }`
- Если в XML было `<Properties><Name>Test</Name></Properties>` (элемент), парсер тоже создает `{ Name: "Test" }`
- При сохранении билдер всегда создает атрибуты для простых строк → теряется информация о том, что было элементом

**Пример потери:**
- Исходный XML: `<Properties><Name>Test</Name></Properties>`
- После парсинга: `{ Properties: { Name: "Test" } }`
- После сохранения: `<Properties Name="Test"></Properties>` ❌ (стало атрибутом вместо элемента)

### 2. Строка 314-316: Булевы значения
**Код:**
```typescript
} else if (typeof val === 'boolean') {
    // Булевы значения сохраняем как строки "true"/"false" для XML
    props[cleanKey] = val ? "true" : "false";
}
```

**Проблема:**
- Булевы значения преобразуются в строки
- Теряется информация о том, были ли они атрибутами или элементами
- Теряется информация о типе (boolean → string)

**Пример потери:**
- Исходный XML: `<Properties><UseStandardCommands>true</UseStandardCommands></Properties>`
- После парсинга: `{ Properties: { UseStandardCommands: "true" } }`
- После сохранения: `<Properties UseStandardCommands="true"></Properties>` ❌

### 3. Строка 285: Многоязычные поля (Synonym)
**Код:**
```typescript
if (content) {
    props[cleanKey] = content;
}
```

**Проблема:**
- Сложная структура `<Synonym><v8:item><v8:lang>ru</v8:lang><v8:content>...</v8:content></v8:item></Synonym>` преобразуется в простую строку
- Теряется информация о структуре элемента
- При сохранении нужно восстанавливать структуру, но нет информации о том, как она выглядела

### 4. Строка 296: Простые объекты с text
**Код:**
```typescript
else if ("text" in val) {
    props[cleanKey] = val.text;
}
```

**Проблема:**
- Объект вида `{ "#text": "value" }` преобразуется в строку `"value"`
- Теряется информация о том, что это был элемент с текстовым содержимым
- При сохранении билдер создаст атрибут вместо элемента

### 5. Строка 308-309: Остальные объекты
**Код:**
```typescript
else {
    const cleaned = cleanNamespacePrefixes(val);
    props[cleanKey] = JSON.stringify(cleaned, null, 2);
}
```

**Проблема:**
- Сложные объекты преобразуются в JSON строку
- Полностью теряется структура XML
- Невозможно восстановить исходную структуру при сохранении

### 6. Строка 241: StandardAttributes
**Код:**
```typescript
props[cleanKey] = attrs.map((attr: any) => cleanNamespacePrefixes(attr));
```

**Проблема:**
- `cleanNamespacePrefixes` может удалить важную информацию о структуре
- Если `StandardAttribute` имел атрибуты (например, `name="Number"`), они могут быть потеряны или преобразованы неправильно

### 7. Строка 253: InputByString
**Код:**
```typescript
props[cleanKey] = cleanNamespacePrefixes(val);
```

**Проблема:**
- Аналогично StandardAttributes, может теряться информация о структуре

## Проблемные места в parseAttributes

### 8. Строка 337: Реквизиты
**Код:**
```typescript
const props = a.Properties || a;
```

**Проблема:**
- Если реквизит имеет `Properties` с атрибутами, они теряются при использовании `parseProperties`
- Если реквизит не имеет `Properties`, используется сам объект, но структура может быть потеряна

### 9. Строка 345: Properties реквизитов
**Код:**
```typescript
properties: parseProperties(props)
```

**Проблема:**
- Все проблемы из `parseProperties` применяются к свойствам реквизитов
- Если `Properties` реквизита имел атрибуты, они будут потеряны

## Проблемные места в parseTabularSections

### 10. Строка 359: Properties табличных частей
**Код:**
```typescript
const props = t.Properties || t;
```

**Проблема:**
- Аналогично реквизитам, может теряться информация о структуре

### 11. Строка 363: Реквизиты табличных частей
**Код:**
```typescript
attributes: parseAttributes(t.ChildObjects)
```

**Проблема:**
- Все проблемы из `parseAttributes` применяются рекурсивно

## Проблемные места в handleSave

### 12. Строка 903: Нормализация Properties
**Код:**
```typescript
finalNode.Properties = normalizeToElements(newProperties);
```

**Проблема:**
- `normalizeToElements` преобразует все свойства в элементы с `{ "#text": value }`
- Не учитывает, что некоторые свойства были атрибутами в исходном XML
- Результат: все свойства становятся элементами, даже если были атрибутами

### 13. Строка 968: Properties реквизитов
**Код:**
```typescript
existing.Properties = normalizeToElements(propsNode);
```

**Проблема:**
- Аналогично Properties объекта, все свойства реквизитов становятся элементами

### 14. Строка 1055: Properties реквизитов табличных частей
**Код:**
```typescript
exA.Properties = normalizeToElements(propsNode);
```

**Проблема:**
- Рекурсивная проблема для всех уровней вложенности

## Итоговый список потери информации

1. ✅ Простые строковые значения → теряется информация об атрибуте/элементе
2. ✅ Булевы значения → теряется тип и структура
3. ✅ Многоязычные поля → теряется структура элемента
4. ✅ Объекты с `#text` → теряется информация о структуре
5. ✅ Сложные объекты → полностью теряется структура (JSON.stringify)
6. ✅ StandardAttributes → может теряться структура при очистке префиксов
7. ✅ InputByString → может теряться структура
8. ✅ Properties реквизитов → все проблемы из parseProperties
9. ✅ Properties табличных частей → все проблемы рекурсивно
10. ✅ handleSave → не использует исходную структуру, создает все как элементы

## Критичность

**Критично (блокирует решение):**
- Пункты 1, 2, 4, 10, 12, 13, 14 - основная причина потери структуры

**Важно (влияет на качество):**
- Пункты 3, 5, 6, 7, 8, 9 - влияют на сложные структуры












