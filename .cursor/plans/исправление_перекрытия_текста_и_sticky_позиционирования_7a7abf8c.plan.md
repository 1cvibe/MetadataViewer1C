---
name: Исправление перекрытия текста и sticky позиционирования
overview: "Исправление двух проблем: перекрытие текста не работает из-за overflow:auto на контейнере, и sticky позиционирование не работает из-за неправильных настроек z-index и background-color."
todos:
  - id: fix-text-overflow
    content: "Исправить перекрытие текста: использовать абсолютное позиционирование для содержимого ячеек в режиме Auto"
    status: pending
  - id: fix-sticky-positioning
    content: "Исправить sticky позиционирование: проверить и исправить z-index и background-color для всех sticky элементов"
    status: pending
  - id: fix-text-placement-logic
    content: Проверить и исправить логику определения режима Auto при cellFormat === null
    status: pending
  - id: test-overflow
    content: Протестировать перекрытие текста в режиме Auto на реальном макете
    status: pending
    dependencies:
      - fix-text-overflow
  - id: test-sticky
    content: Протестировать sticky позиционирование при вертикальной и горизонтальной прокрутке
    status: pending
    dependencies:
      - fix-sticky-positioning
---

# Исправление перекрытия текста и sticky позицио

нирования

## Проблемы

1. **Перекрытие текста не работает:**

- Контейнер `.template-table-container` имеет `overflow: auto`, что создает новый контекст наложения и обрезает перекрывающийся текст
- Ячейки с `overflow: visible` не могут перекрывать соседние ячейки, если родительский контейнер имеет `overflow: auto`
- Текст должен перекрывать соседние ячейки в режиме Auto, но высота строки не должна увеличиваться

2. **Sticky позиционирование не работает:**

- Sticky элементы могут не фиксироваться из-за неправильных z-index или отсутствия background-color
- Нужно убедиться, что все sticky элементы имеют правильный background-color для перекрытия содержимого

## Решения

### 1. Исправление перекрытия текста

**Проблема:** `overflow: visible` на ячейке не работает, если родительский контейнер имеет `overflow: auto`.**Решение:** Использовать абсолютное позиционирование для перекрывающегося текста в режиме Auto:

- Для ячеек в режиме Auto (не объединенных) установить `position: relative` на ячейку
- Для содержимого ячейки использовать `position: absolute` с `white-space: nowrap` и `z-index` для перекрытия
- Ограничить перекрытие только горизонтальным направлением (текст не должен выходить за границы строки по вертикали)

**Файлы для изменения:**

- `src/webview/components/TemplateEditor/TemplateTable.tsx` - логика обработки режима Auto
- `src/webview/components/TemplateEditor/template-editor.css` - стили для перекрывающегося текста

### 2. Исправление sticky позиционирования

**Проблема:** Sticky элементы могут не фиксироваться из-за:

- Отсутствия или неправильного background-color
- Неправильных z-index
- Конфликтов между sticky элементами

**Решение:**

- Убедиться, что все sticky элементы имеют `background-color` (чтобы перекрывать содержимое при прокрутке)
- Проверить и исправить z-index для всех sticky элементов:
- `template-table-named-area-header` (thead) - z-index: 15
- `template-table-named-area-column-header` - z-index: 13
- `template-table-column-header` (первая строка) - z-index: 10
- `template-table-column-header` (вторая строка) - z-index: 10, top: 30px
- `template-table-named-area-cell` (tbody) - z-index: 11
- `template-table-row-header` (tbody) - z-index: 10
- Убедиться, что пересечения (углы) имеют правильные z-index

**Файлы для изменения:**

- `src/webview/components/TemplateEditor/template-editor.css` - исправление z-index и background-color для всех sticky элементов

### 3. Исправление обработки textPlacement

**Проблема:** Когда `cellFormat === null`, `textPlacement` будет `undefined`, и код должен обрабатывать это как режим Auto.**Решение:**

- Убедиться, что логика правильно определяет режим Auto, когда `cellFormat === null` или `textPlacement === undefined`
- Проверить, что условие `!textPlacement || textPlacement === 'Auto' || textPlacement === 'Normal'` правильно обрабатывает все случаи

**Файлы для изменения:**

- `src/webview/components/TemplateEditor/TemplateTable.tsx` - проверка логики определения режима Auto

## Детали реализации

### Перекрытие текста

Вместо `overflow: visible` на ячейке использовать:

```css
.template-table-cell[data-text-placement="Auto"]:not([colspan]):not([rowspan]) {
    overflow: hidden; /* Обрезаем по вертикали */
    position: relative;
}

.template-table-cell[data-text-placement="Auto"]:not([colspan]):not([rowspan]) .template-cell-content {
    position: absolute;
    white-space: nowrap;
    left: 0;
    top: 0;
    z-index: 2;
    min-width: 100%;
}
```



### Sticky позиционирование

Убедиться, что все sticky элементы имеют:

- `position: sticky`