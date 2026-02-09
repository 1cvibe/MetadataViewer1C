# Утилита сравнения XML структур

Универсальный инструмент для детального сравнения XML файлов и выявления структурных различий.

## Использование

### Базовое использование

```bash
node test-cases/xml-structure-comparison.js <файл1.xml> <файл2.xml>
```

Пример:
```bash
node test-cases/xml-structure-comparison.js Untitled-1.xml Untitled-2.xml
```

### Экспорт результатов в JSON

```bash
node test-cases/xml-structure-comparison.js <файл1.xml> <файл2.xml> <output.json>
```

Пример:
```bash
node test-cases/xml-structure-comparison.js Untitled-1.xml Untitled-2.xml comparison-result.json
```

## Использование в коде

```javascript
const { compareXmlFiles, analyzeDifferences, printComparisonResults } = require('./test-cases/xml-structure-comparison');

// Сравнение файлов
const result = compareXmlFiles('file1.xml', 'file2.xml');

if (result.success) {
    // Анализ различий
    const analysis = analyzeDifferences(result.differences);
    
    // Вывод результатов
    printComparisonResults(result, { maxItems: 50, showDetails: true });
    
    // Проверка на критические ошибки
    if (analysis.critical.length > 0) {
        console.error(`Найдено ${analysis.critical.length} критических ошибок!`);
    }
}
```

## Типы различий

Утилита классифицирует различия по следующим типам:

### Критические ошибки
- `structure_incorrect` - неправильная структура XML
- `structure_change` - изменения в структуре Type/TypeSet/OneOf
- `attribute_missing_in_second` (uuid) - отсутствие обязательных атрибутов
- `text_content_mismatch` в GeneratedType - неправильные имена типов

### Предупреждения
- `missing_in_first` - элемент отсутствует в первом файле
- `missing_in_second` - элемент отсутствует во втором файле
- `tag_name_mismatch` - несовпадение имен тегов
- `attribute_value_mismatch` - несовпадение значений атрибутов
- `text_content_mismatch` - несовпадение текстового содержимого

### Информационные
- `attribute_missing_in_first` - атрибут отсутствует в первом файле
- Другие незначительные различия

## Примеры использования

### Сравнение до/после изменений

```bash
# Сохранить исходный файл
cp Document.xml Document.original.xml

# Внести изменения...

# Сравнить
node test-cases/xml-structure-comparison.js Document.original.xml Document.xml
```

### Автоматическая проверка в тестах

```javascript
const { compareXmlFiles } = require('./test-cases/xml-structure-comparison');

test('XML structure should be preserved', () => {
    const result = compareXmlFiles('original.xml', 'modified.xml');
    
    expect(result.success).toBe(true);
    expect(result.total).toBe(0); // Нет различий
});
```

### Экспорт для анализа

```bash
node test-cases/xml-structure-comparison.js file1.xml file2.xml diff.json
```

Затем можно проанализировать JSON:
```javascript
const diff = require('./diff.json');
console.log(`Критических ошибок: ${diff.critical}`);
console.log(`Предупреждений: ${diff.warnings}`);
```

## Особенности

1. **Рекурсивное сравнение** - сравнивает всю структуру XML дерева
2. **Умная классификация** - автоматически определяет критичность различий
3. **Детальная информация** - показывает путь к элементу, тип различия, значения
4. **Экспорт результатов** - возможность сохранить результаты в JSON
5. **Обработка ошибок** - корректно обрабатывает ошибки парсинга XML

## Формат вывода

```
🔍 Сравнение XML файлов:
   Файл 1: Untitled-1.xml
   Файл 2: Untitled-2.xml

📊 Найдено различий: 16

🔴 КРИТИЧЕСКИЕ ОШИБКИ (9):
  1. Document/ChildObjects/Attribute/Properties/Type
     Тип: structure_change
     Было: <v8:Type>cfg:CatalogRef.Организации</v8:Type>
     Стало: <v8:Type>OneOf</v8:Type><v8:TypeSet>...

⚠️  ПРЕДУПРЕЖДЕНИЯ (7):
  ...

📈 СТАТИСТИКА ПО ТИПАМ:
   structure_change: 6
   attribute_missing_in_second: 1
   ...
```

## Интеграция с тестами

Можно использовать в существующих тестах:

```javascript
// В metadata-save-test.js
const { compareXmlFiles } = require('./xml-structure-comparison');

function testObjectSave(objectPath) {
    // ... существующий код ...
    
    // Дополнительная проверка структуры
    const structureCheck = compareXmlFiles(originalXmlPath, modifiedXmlPath);
    if (structureCheck.total > 0) {
        const analysis = analyzeDifferences(structureCheck.differences);
        if (analysis.critical.length > 0) {
            console.error(`Критические ошибки структуры в ${objectPath}`);
            printComparisonResults(structureCheck, { maxItems: 10 });
        }
    }
}
```

