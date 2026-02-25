# DCS редактор: Исправление структуры XML (xmldom)

## Проблемы (декабрь 2025)

При сравнении Template1.xml (до) и Template2.xml (после) через test-cases/compare были найдены **4 критические проблемы**:

1. **37 пустых строк в начале файла** (строки 3-40)
2. **Потеряны отступы** (0 символов вместо табуляции)
3. **Неправильный порядок корневых элементов** (parameter после totalField)
4. **field перед query в dataSet** ❌ КРИТИЧЕСКАЯ для 1С!

## Исправления

### 1. Форматирование (src/xmlParsers/dcsSerializerXmldom.ts)

**updateDomFromNodes:**
- Теперь удаляет ВСЕ дочерние узлы (включая текстовые) через `while (rootElement.firstChild) { rootElement.removeChild(rootElement.firstChild); }`
- Явно добавляет отступы `\t` перед каждым элементом

**createElementFromNode(doc, node, depth):**
- Принимает явный параметр `depth` (вместо расчета из `node.path`)
- Отступы: `'\t'.repeat(depth)`
- Для детей: `'\t'.repeat(depth + 1)`

### 2. Порядок в dataSet (src/dcsEditor.ts)

**Новая функция `reorderDataSetChildren`:**
```typescript
private reorderDataSetChildren(dataSetNode: ParsedDcsNode): ParsedDcsNode
```

Правильный порядок внутри dataSet:
1. name
2. query (или items для DataSetUnion)
3. field (все поля)
4. dataSource
5. остальные

**Применение в `reorderRootSectionsForSave`:**
```typescript
const reorderedDataSets = dataSets.map(ds => this.reorderDataSetChildren(ds));
return [...dataSources, ...reorderedDataSets, ...links, ...totals, ...calcs, ...params, ...templates, ...settings, ...others];
```

## Правильная структура DCS

### Корневые элементы (порядок):
1. dataSource
2. dataSet
3. dataSetLink
4. totalField (ресурсы)
5. calculatedField (вычисляемые поля)
6. parameter
7. template, groupTemplate
8. settingsVariant

### Внутри dataSet:
1. name
2. **query** (ОБЯЗАТЕЛЬНО ПЕРЕД ПОЛЯМИ!)
3. field (все поля)
4. dataSource (ссылка на источник)

## Тесты

Созданы тесты для проверки:
- `test-cases/compare-xmldom-structure.js` - Сравнение структуры
- `test-cases/test-full-flow-with-reorder.js` - Полный flow как в редакторе
- `test-cases/compare-final-result.js` - Финальное сравнение

Все тесты ✅ проходят успешно.

## Результат

✅ BOM корректен (UTF-8 с BOM)
✅ Отступы правильные (1 табуляция)
✅ Нет лишних пустых строк
✅ Кодировка UTF-8
✅ Порядок корневых элементов правильный
✅ Порядок в dataSet: query перед field

**Файлы готовы для загрузки в 1С конфигуратор без ошибок XDTO!**

## Документация

Подробная документация в `docs/dcs-xmldom-structure-fixes.md`
