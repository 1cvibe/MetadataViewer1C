---
name: Отключение предупреждений Unicode в редакторе запросов
overview: Отключить предупреждения о похожих Unicode символах (confusables) в Monaco Editor для языка запросов 1С, чтобы убрать визуальный шум при работе с русскими символами.
todos:
  - id: disable-unicode-query-enhanced
    content: "Добавить unicodeHighlight: { ambiguousCharacters: false } в QueryEditorEnhanced.tsx"
    status: completed
  - id: disable-unicode-simple-editor
    content: "Добавить unicodeHighlight: { ambiguousCharacters: false } в SimpleQueryEditor.tsx"
    status: completed
---

# Отключение предупреждений Unicode

в редакторе запросов 1С

## Проблема

Monaco Editor показывает предупреждения о похожих Unicode символах (например, кириллическая "Е" vs латинская "E", кириллическая "Н" vs латинская "H"), что создает визуальный шум при работе с русскими символами в языке запросов 1С.

## Решение

Добавить опцию `unicodeHighlight` при создании Monaco Editor во всех компонентах редактора запросов, отключив проверку похожих символов (`ambiguousCharacters: false`).

## Файлы для изменения

1. **[src/webview/components/DcsEditor/QueryEditorEnhanced.tsx](src/webview/components/DcsEditor/QueryEditorEnhanced.tsx)**

- Добавить `unicodeHighlight: { ambiguousCharacters: false }` в опции создания редактора (строка ~466)

2. **[src/webview/components/SimpleQueryEditor.tsx](src/webview/components/SimpleQueryEditor.tsx)**

- Добавить `unicodeHighlight: { ambiguousCharacters: false }` в опции создания редактора (строка ~46)

3. **[src/webview/components/StandaloneQueryEditor.tsx](src/webview/components/StandaloneQueryEditor.tsx)**

- Проверить, использует ли он QueryEditorEnhanced (да, использует), изменения не требуются

## Детали реализации

В Monaco Editor опция `unicodeHighlight` управляет подсветкой:

- `ambiguousCharacters` - похожие символы (кириллица vs латиница)
- `invisibleCharacters` - невидимые символы
- `nonBasicASCII` - не-базовые ASCII символы

Для языка запросов 1С с русскими символами достаточно отключить только `ambiguousCharacters`, оставив остальные проверки включенными для безопасности.