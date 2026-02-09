# Рекомендуемые команды для разработки

## Основные команды сборки
```bash
# Компиляция TypeScript
npm run compile

# Сборка webview bundle
npm run build:webview

# Компиляция + сборка webview (для публикации)
npm run vscode:prepublish

# Режим watch для TypeScript
npm run watch

# Режим watch для webview
npm run watch:webview
```

## Проверка кода
```bash
# Линтинг кода
npm run lint
```

## Упаковка расширения
```bash
# Создание .vsix файла
npm run package
```

## Тестирование
```bash
# Тест сохранения метаданных (подготовка)
npm run test:metadata-save:prepare

# Тест сохранения метаданных
npm run test:metadata-save
```

## Windows команды
```powershell
# Переход в директорию
cd D:\Docker\app\MetaDataViewer_v3

# Список файлов
Get-ChildItem
dir

# Поиск в файлах
Select-String -Pattern "pattern" -Path "file.ts"

# Запуск Node скриптов
node scripts/analyze-doc-forms.js
```

## VS Code Tasks
- `npm: compile` - компиляция TypeScript (default build task)
- `npm: build:webview` - сборка webview
- `compile and build webview` - полная сборка
- `npm: watch` - watch режим для TypeScript
- `npm: install` - установка зависимостей
- `vsce: package` - упаковка расширения

## Отладка
- F5 - запуск расширения в режиме отладки
- Логи доступны в Output панели "1C Metadata Viewer"
- Включить детальное логирование: настройка `metadataViewer.debugMode = true`

## Работа с Git
```bash
git status
git add .
git commit -m "message"
git push
```
