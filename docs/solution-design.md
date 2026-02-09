# Проектирование решения для сохранения структуры XML

## Выбранная стратегия: Вариант A+ (Улучшенный вариант A)

### Обоснование выбора

**Вариант A**: Сохранять "сырой" объект из парсера вместе с нормализованным
- ✅ Полная информация о структуре
- ✅ Минимальные изменения в существующем коде
- ✅ Можно постепенно мигрировать
- ⚠️ Увеличение использования памяти (приемлемо для метаданных)

**Вариант B**: Добавить метаданные о типе каждого свойства
- ❌ Требует изменения модели данных `ParsedMetadataObject`
- ❌ Нужно обновить весь код, работающий с парсером
- ❌ Сложнее в реализации

**Вариант C**: Использовать специальную структуру данных
- ❌ Сложность в обработке
- ❌ Не решает проблему полностью

## Архитектура решения

### 1. Структура данных

#### Расширение ParsedMetadataObject
```typescript
export interface ParsedMetadataObject {
    // ... существующие поля ...
    properties: Record<string, any>;
    attributes: ParsedAttribute[];
    tabularSections: ParsedTabularSection[];
    
    // НОВОЕ: Исходный объект из парсера для восстановления структуры
    _raw?: {
        Properties?: any;  // Исходный объект Properties из парсера
        ChildObjects?: {
            Attribute?: any[];  // Исходные объекты реквизитов
            TabularSection?: any[];  // Исходные объекты табличных частей
        };
    };
}
```

#### Альтернатива: Отдельное поле для метаданных структуры
```typescript
export interface ParsedMetadataObject {
    // ... существующие поля ...
    
    // Метаданные о структуре XML
    _xmlStructure?: {
        Properties?: {
            [key: string]: 'attribute' | 'element';
        };
        Attributes?: Array<{
            name: string;
            Properties?: {
                [key: string]: 'attribute' | 'element';
            };
        }>;
        TabularSections?: Array<{
            name: string;
            Properties?: {
                [key: string]: 'attribute' | 'element';
            };
            Attributes?: Array<{
                name: string;
                Properties?: {
                    [key: string]: 'attribute' | 'element';
                };
            }>;
        }>;
    };
}
```

**Выбор**: Использовать `_raw` объект, так как:
- Более гибко - сохраняет всю структуру, а не только метаданные
- Проще в реализации - не нужно анализировать структуру при парсинге
- Меньше вероятность ошибок - используем то, что уже есть

### 2. Модификация парсера

#### Изменения в parseMetadataXml
```typescript
export async function parseMetadataXml(xmlPath: string): Promise<ParsedMetadataObject> {
    // ... существующий код ...
    
    const result: ParsedMetadataObject = {
        objectType: objectType,
        name: name,
        sourcePath: xmlPath,
        properties: parseProperties(objNode.Properties),
        attributes: parseAttributes(objNode.ChildObjects),
        tabularSections: parseTabularSections(objNode.ChildObjects),
        // ... другие поля ...
        
        // НОВОЕ: Сохраняем исходный объект из парсера
        _raw: {
            Properties: objNode.Properties,  // Исходный объект Properties
            ChildObjects: objNode.ChildObjects  // Исходные ChildObjects
        }
    };
    
    return result;
}
```

#### Изменения в parseAttributes
```typescript
function parseAttributes(childObjects: any): ParsedAttribute[] {
    // ... существующий код ...
    
    return attrs.map((a: any) => {
        const props = a.Properties || a;
        
        return {
            name: props.Name || a.name || "Неизвестно",
            type: parsedType,
            typeDisplay: parsedType ? getTypeDisplayString(parsedType) : "Неопределено",
            properties: parseProperties(props),
            // НОВОЕ: Сохраняем исходный объект реквизита
            _raw: a  // Исходный объект Attribute из парсера
        };
    });
}
```

Аналогично для `parseTabularSections`.

### 3. Утилита для восстановления структуры

#### Новый файл: src/utils/xmlStructureUtils.ts

```typescript
/**
 * Утилиты для работы со структурой XML
 * Помогают сохранять и восстанавливать исходную структуру XML (атрибуты vs элементы)
 */

/**
 * Определяет, является ли свойство атрибутом или элементом в исходном XML
 * 
 * При attributeNamePrefix: "" парсер не различает атрибуты и элементы,
 * поэтому используем эвристику: если свойство - простая строка/число/булево
 * и объект имеет другие простые свойства, вероятно это был атрибут.
 * Но более надежно использовать исходный объект из парсера.
 */
export function detectStructureType(
    originalNode: any, 
    key: string
): 'attribute' | 'element' | 'unknown' {
    if (!originalNode) return 'unknown';
    
    const value = originalNode[key];
    
    // Если значение - объект (не примитив), это элемент
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Проверяем, не является ли это объектом с #text (элемент с текстом)
        if (value["#text"] !== undefined || value.text !== undefined) {
            return 'element';
        }
        // Если есть вложенные элементы (например, v8:item), это элемент
        if (Object.keys(value).some(k => !k.startsWith('@'))) {
            return 'element';
        }
    }
    
    // Если значение - примитив (строка, число, булево)
    // и в объекте есть другие простые свойства, вероятно это был атрибут
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        const simplePropsCount = Object.keys(originalNode)
            .filter(k => !k.startsWith('@'))
            .filter(k => {
                const v = originalNode[k];
                return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
            }).length;
        
        // Если много простых свойств, вероятно это были атрибуты
        if (simplePropsCount > 2) {
            return 'attribute';
        }
    }
    
    return 'unknown';
}

/**
 * Восстанавливает структуру Properties из исходного объекта
 * Объединяет изменения из normalized с исходной структурой из original
 */
export function restorePropertiesStructure(
    normalized: Record<string, any>,
    original: any
): any {
    if (!original) {
        // Если нет исходного объекта, используем normalizeToElements
        return normalizeToElements(normalized);
    }
    
    const restored: any = {};
    
    // Проходим по всем свойствам из normalized (измененные + новые)
    for (const [key, value] of Object.entries(normalized)) {
        const originalValue = original[key];
        
        // Определяем тип структуры из исходного объекта
        const structureType = detectStructureType(original, key);
        
        if (structureType === 'attribute') {
            // Было атрибутом - сохраняем как простое свойство
            restored[key] = value;
        } else if (structureType === 'element') {
            // Было элементом - используем { "#text": value }
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                restored[key] = value === "" ? "" : { "#text": String(value) };
            } else {
                restored[key] = value;
            }
        } else {
            // Неизвестно - используем значение из исходного объекта, если оно есть
            if (originalValue !== undefined) {
                restored[key] = originalValue;
            } else {
                // Новое свойство - по умолчанию элемент
                restored[key] = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
                    ? (value === "" ? "" : { "#text": String(value) })
                    : value;
            }
        }
    }
    
    // Добавляем свойства, которые были в исходном объекте, но не изменены
    for (const [key, value] of Object.entries(original)) {
        if (key.startsWith('@') || key === 'text') continue;
        if (normalized[key] === undefined) {
            restored[key] = value;
        }
    }
    
    return restored;
}

/**
 * Восстанавливает структуру реквизита из исходного объекта
 */
export function restoreAttributeStructure(
    normalized: ParsedAttribute,
    original: any
): any {
    if (!original) {
        // Если нет исходного объекта, создаем новую структуру
        return {
            Properties: {
                Name: normalized.name,
                Type: formatTypeToXmlValue(normalized.type),
                ...normalizeToElements(normalized.properties)
            }
        };
    }
    
    // Используем исходную структуру
    const restored = JSON.parse(JSON.stringify(original)); // Глубокое копирование
    
    // Обновляем измененные свойства
    const props = restored.Properties || (restored.Properties = {});
    props.Name = normalized.name;
    props.Type = formatTypeToXmlValue(normalized.type);
    
    // Восстанавливаем Properties реквизита
    props = restorePropertiesStructure(normalized.properties, props);
    
    return restored;
}
```

### 4. Модификация handleSave

#### Изменения в MetadataPanel.ts

```typescript
private async handleSave(obj: ParsedMetadataObject) {
    // ... существующий код до строки 814 ...
    
    // Используем исходную структуру из _raw, если она есть
    const originalProperties = obj._raw?.Properties || finalNode.Properties || {};
    const originalChildObjects = obj._raw?.ChildObjects || finalNode.ChildObjects || {};
    
    // Восстанавливаем Properties с сохранением структуры
    finalNode.Properties = restorePropertiesStructure(
        newProperties,
        originalProperties
    );
    
    // Восстанавливаем реквизиты
    const xmlAttrs = ensureArray(originalChildObjects.Attribute || []);
    const updatedAttrs: any[] = [];
    
    for (const newAttr of obj.attributes) {
        const originalAttr = xmlAttrs.find((a: any) => {
            const props = a.Properties || a;
            const existingName = props.Name || props.name || a.name;
            return existingName === newAttr.name;
        }) || newAttr._raw;
        
        updatedAttrs.push(restoreAttributeStructure(newAttr, originalAttr));
    }
    
    finalNode.ChildObjects.Attribute = updatedAttrs;
    
    // Аналогично для табличных частей
    // ...
}
```

## План реализации

1. ✅ Расширить интерфейсы для хранения `_raw` данных
2. ✅ Модифицировать парсер для сохранения исходных объектов
3. ✅ Создать утилиту `xmlStructureUtils.ts`
4. ✅ Модифицировать `handleSave` для использования исходной структуры
5. ✅ Протестировать на различных XML файлах

## Преимущества решения

1. **Обратная совместимость**: Существующий код продолжит работать, `_raw` опционально
2. **Точность**: Используем реальную структуру из парсера, а не эвристики
3. **Гибкость**: Можно постепенно мигрировать, добавляя `_raw` только там, где нужно
4. **Простота**: Минимальные изменения в существующем коде

## Недостатки и ограничения

1. **Память**: Увеличение использования памяти из-за дублирования данных (приемлемо для метаданных)
2. **Сложность**: Нужно аккуратно объединять изменения с исходной структурой
3. **Ограничения парсера**: Если парсер уже потерял информацию (например, при `attributeNamePrefix: ""`), восстановить невозможно

## Альтернативный подход (если текущий не сработает)

Если обнаружатся проблемы с определением структуры при `attributeNamePrefix: ""`, можно:
1. Использовать `attributeNamePrefix: "@"` при парсинге для метаданных
2. Создать отдельный парсер только для определения структуры
3. Использовать регулярные выражения для анализа исходного XML (менее надежно)












