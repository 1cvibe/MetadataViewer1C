# Позиционирование таблицы с именованными областями

## Структура HTML таблицы

### thead (заголовки)
1. **Первая строка** (template-table-named-areas-row):
   - `<th className="template-table-named-area-header"></th>` - пустая ячейка для подписей строк
   - `<th className="template-table-row-header"></th>` - пустая ячейка для номеров строк
   - `<th className="template-table-named-area-column-header">` - подписи именованных областей колонок

2. **Вторая строка**:
   - `<th className="template-table-named-area-header"></th>` - пустая ячейка
   - `<th className="template-table-row-header"></th>` - пустая ячейка
   - `<th className="template-table-column-header">` - буквы колонок (A, B, C...)

### tbody (строки данных)
Каждая строка:
- `<td className="template-table-named-area-cell">` - подпись именованной области строки
- `<td className="template-table-row-header">` - номер строки (1, 2, 3...)
- `<td className="template-table-cell">` - ячейки данных

## CSS позиционирование

### Базовые настройки таблицы
```css
.template-table {
    table-layout: fixed;
    border-collapse: collapse;
}

.template-table th,
.template-table td {
    box-sizing: border-box;
}
```

### Колонка подписей именованных областей строк (named-area)
- **width**: 80px
- **max-width**: 80px
- **position**: sticky
- **left**: 0
- **z-index**: 10 (для thead), 9 (для tbody)

```css
.template-table-named-area-header {
    width: 80px;
    max-width: 80px;
    box-sizing: border-box;
    position: sticky;
    left: 0;
    z-index: 10;
}

.template-table-named-area-cell {
    width: 80px;
    max-width: 80px;
    box-sizing: border-box;
    position: sticky;
    left: 0;
    z-index: 9;
}
```

### Колонка номеров строк (row-header)
- **width**: 40px
- **max-width**: 40px
- **position**: 
  - В **thead**: `static` (не sticky!)
  - В **tbody**: `sticky` с `left: 80px`
- **z-index**: 10

```css
.template-table-row-header {
    width: 40px;
    max-width: 40px;
    box-sizing: border-box;
}

.template-table tbody .template-table-row-header {
    position: sticky;
    left: 80px;  /* Смещение на ширину named-area-cell (80px) */
    z-index: 10;
}

.template-table thead .template-table-row-header {
    position: static;  /* НЕ sticky в заголовках! */
}
```

### Колонки заголовков (column-header)
- **position**: sticky
- **top**: 0
- **z-index**: 10

```css
.template-table-column-header {
    position: sticky;
    top: 0;
    z-index: 10;
}
```

### Колонки подписей именованных областей колонок (named-area-column-header)
- **position**: sticky
- **top**: 0
- **z-index**: 11 (выше column-header)

```css
.template-table-named-area-column-header {
    position: sticky;
    top: 0;
    z-index: 11;
}
```

## Важные моменты

1. **table-layout: fixed** - обязателен для правильного расчета ширин
2. **box-sizing: border-box** - обязателен для всех элементов для правильного расчета размеров
3. **left для row-header в tbody** = ширина named-area-cell (80px)
4. **row-header в thead** должен быть `position: static`, а не sticky
5. **column-header и named-area-column-header** оба используют `top: 0` (первая строка заголовков на top: 0, вторая тоже на top: 0, но под первой)
6. **z-index**: named-area-column-header (11) > column-header (10) > named-area-header (10) > row-header (10) > named-area-cell (9)

## Вычисление maxColumns

```typescript
const maxColumns = React.useMemo(() => {
    let max = 0;
    // Из rowsItem
    if (templateDocument.rowsItem) {
        templateDocument.rowsItem.forEach(row => {
            if (row.row && row.row.c) {
                let currentColIndex = 0;
                row.row.c.forEach(cell => {
                    const colIndex = cell.i !== undefined ? cell.i : currentColIndex;
                    if (colIndex >= max) {
                        max = colIndex + 1;
                    }
                    currentColIndex = colIndex + 1;
                });
            }
        });
    }
    // Из columns.size
    if (templateDocument.columns && templateDocument.columns.length > 0) {
        const columnsGroup = templateDocument.columns[0];
        if (columnsGroup.size !== undefined) {
            max = Math.max(max, columnsGroup.size);
        }
    }
    return Math.max(max, 10);
}, [templateDocument]);
```

## Использование индексов строк

```typescript
{rows.map((templateRow, arrayIndex) => {
    // Используем реальный индекс строки из данных, а не индекс массива
    const rowIndex = templateRow.index !== undefined ? templateRow.index : arrayIndex;
    // ... использование rowIndex для всех операций с данными
})}