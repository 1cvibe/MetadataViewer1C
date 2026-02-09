# Стиль кода и соглашения

## TypeScript конфигурация
- **Target**: ES2020
- **Module**: CommonJS
- **Strict mode**: включен
- **JSX**: React
- **Source maps**: включены

## ESLint правила
- **Parser**: @typescript-eslint/parser
- **Extends**: eslint:recommended, @typescript-eslint/recommended
- **Правила**:
  - `semi: [2, "always"]` - обязательные точки с запятой
  - `@typescript-eslint/no-unused-vars: 0` - отключено
  - `@typescript-eslint/no-explicit-any: 0` - разрешено использование any
  - `@typescript-eslint/explicit-module-boundary-types: 0` - не требуется явное указание типов
  - `@typescript-eslint/no-non-null-assertion: 0` - разрешено использование `!`
  - `@typescript-eslint/no-namespace: 0` - разрешены namespace

## Соглашения по именованию
- **Классы**: PascalCase (например, `BookmarkManager`, `MetadataView`)
- **Функции/методы**: camelCase (например, `toggleBookmark`, `formatSelection`)
- **Переменные**: camelCase
- **Константы**: camelCase или UPPER_SNAKE_CASE
- **Интерфейсы**: PascalCase, часто с префиксом I (например, `TreeItem`, `ParsedFormFull`)
- **Типы**: PascalCase
- **Файлы**: camelCase для утилит, PascalCase для компонентов React

## Комментарии
- JSDoc комментарии для модулей, классов, функций и процедур
- Комментарии на русском языке
- Многострочные комментарии для описания сложной логики

## Структура файлов
- Импорты в начале файла
- Экспорты в конце или рядом с определением
- Использование `'use strict'` в начале файлов extension.ts

## React компоненты
- Функциональные компоненты с TypeScript
- Использование хуков (useState, useEffect, useRef)
- Props типизированы через интерфейсы
- CSS модули или inline стили через CSS переменные VS Code

## Обработка ошибок
- Try-catch блоки для критических операций
- Логирование через `outputChannel` для отладки
- Показ сообщений пользователю через `vscode.window.showErrorMessage/showWarningMessage`

## Работа с VS Code API
- Использование `vscode.ExtensionContext` для управления подписками
- Регистрация команд через `vscode.commands.registerCommand`
- Управление ресурсами через `context.subscriptions.push()`
