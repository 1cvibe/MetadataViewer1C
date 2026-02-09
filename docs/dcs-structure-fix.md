# Исправление структуры СКД при редактировании

## Проблема

При редактировании Template.xml через редактор СКД нарушалась структура 1С XDTO:

1. **Неправильный порядок тегов**: `calculatedField` попадал в конец, а должен быть ПЕРЕД `parameter`
2. **Отсутствие полей в dataSet**: при добавлении `calculatedField` не создавалось соответствующее `<field>` в `<dataSet>`

### Пример проблемы

```xml
<!-- НЕПРАВИЛЬНО (наш редактор ДО исправления) -->
<DataCompositionSchema>
  <dataSource>...</dataSource>
  <dataSet>
    <!-- НЕТ поля для calculatedField "Итоги"! -->
    <field>КоличествоДнейОтпуска</field>
  </dataSet>
  <parameter>...</parameter>
  <calculatedField>  <!-- ❌ НЕПРАВИЛЬНАЯ ПОЗИЦИЯ -->
    <dataPath>Итоги</dataPath>
  </calculatedField>
</DataCompositionSchema>
```

```xml
<!-- ПРАВИЛЬНО (1С стандарт) -->
<DataCompositionSchema>
  <dataSource>...</dataSource>
  <dataSet>
    <field xsi:type="DataSetFieldField">КоличествоДнейОтпуска</field>
    <field xsi:type="DataSetFieldFolder">Итоги</field>  <!-- ✓ ДОБАВЛЕНО -->
  </dataSet>
  <totalField>КоличествоДнейОтпуска</totalField>
  <calculatedField>  <!-- ✓ ПРАВИЛЬНАЯ ПОЗИЦИЯ -->
    <dataPath>Итоги</dataPath>
  </calculatedField>
  <parameter>...</parameter>
</DataCompositionSchema>
```

## Решение

### 1. Исправлен порядок тегов (src/dcsEditor.ts)

Метод `reorderRootSectionsForSave` теперь использует правильный порядок:

```typescript
return [
  ...dataSources,      // 1. dataSource
  ...dataSets,         // 2. dataSet
  ...links,            // 3. dataSetLink
  ...totals,           // 4. totalField
  ...calcs,            // 5. calculatedField  ⬅ ПЕРЕД parameter!
  ...params,           // 6. parameter
  ...templates,        // 7. template/groupTemplate
  ...settings,         // 8. settingsVariant
  ...others
];
```

### 2. Автоматическое создание полей (src/webview/components/DcsEditor/DcsEditorApp.tsx)

При добавлении `calculatedField` автоматически создается поле в `dataSet`:

```typescript
// ИСПРАВЛЕНО: добавляем field в dataSet для calculatedField
const firstDataSet = prev.find((n) => localTag(n.tag) === 'dataSet');

if (firstDataSet) {
  updated = updateNodeAtPath(prev, firstDataSet.path, (ds) => {
    const newField: DcsNode = {
      path: '',
      tag: 'field',
      attrs: { '@_xsi:type': 'DataSetFieldFolder' },  // ⬅ ВАЖНО!
      children: [
        makeTextNode('dataPath', dataPath),
        makeTextNode('field', dataPath),
      ],
    };
    // ... вставка поля
  });
}
```

### 3. Синхронизация при изменении dataPath

Создан специальный коллбек `onUpdateCalculatedField`, который:
- Отслеживает изменение `dataPath` в `calculatedField`
- Автоматически обновляет соответствующее поле в `dataSet`

## Результаты тестирования

### До исправления
```bash
$ node test-cases/compare-templates.js

Template2.xml: нарушен порядок тегов
calculatedField "Итоги": ✗ поле отсутствует в dataSet
```

### После исправления
```bash
$ node test-cases/test-reorder-function.js

✓ Порядок полностью правильный!
1. dataSource
2. dataSet
3. dataSetLink
4. totalField
5. calculatedField  ⬅ ПРАВИЛЬНАЯ ПОЗИЦИЯ
6. parameter
7. template
8. settingsVariant

$ node test-cases/test-fix-add-fields.js

calculatedField "Итоги": ✓ ЕСТЬ поле в dataSet
totalField "КоличествоДнейОтпуска": ✓ ЕСТЬ поле в dataSet
```

## Измененные файлы

1. ✅ `src/dcsEditor.ts` - исправлен порядок тегов в `reorderRootSectionsForSave`
2. ✅ `src/xmlParsers/dcsSerializer.ts` - изменен `format: false` для предотвращения bloat
3. ✅ `src/webview/components/DcsEditor/DcsEditorApp.tsx`:
   - `handleAddCalculatedField` - автоматическое создание поля в dataSet
   - `onUpdateCalculatedField` - синхронизация при изменении dataPath
4. ✅ `test-cases/analyze-dcs-order.js` (новый) - анализ реальных отчетов
5. ✅ `test-cases/test-reorder-function.js` (новый) - unit-тест порядка тегов
6. ✅ `test-cases/compare-templates.js` (новый) - сравнение структуры
7. ✅ `test-cases/test-fix-add-fields.js` (новый) - проверка полей

## Важно

### Правильный порядок тегов в 1С СКД:

1. `dataSource` - источники данных
2. `dataSet` - наборы данных
3. `dataSetLink` - связи наборов
4. `totalField` - ресурсы (итоговые поля)
5. `calculatedField` - вычисляемые поля
6. `parameter` - параметры
7. `template` / `groupTemplate` / `totalFieldsTemplate` - макеты
8. `settingsVariant` - варианты настроек

### Типы полей в dataSet:

- `DataSetFieldField` - обычное поле из запроса
- `DataSetFieldFolder` - папка/группа полей (для calculatedField)

## Проверка

Для проверки корректности структуры:

```bash
# Анализ порядка тегов
node test-cases/test-reorder-function.js

# Проверка наличия полей
node test-cases/test-fix-add-fields.js

# Сравнение до/после
node test-cases/compare-templates.js
```

