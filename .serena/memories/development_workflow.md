# Рабочий процесс разработки

## Что делать после завершения задачи

### 1. Компиляция и проверка
```bash
# Компилировать TypeScript
npm run compile

# Проверить линтером
npm run lint

# Собрать webview (если изменялись React компоненты)
npm run build:webview
```

### 2. Проверка ошибок
- Проверить вывод компиляции на ошибки TypeScript
- Проверить линтер на предупреждения
- Проверить консоль браузера (F12) для webview компонентов

### 3. Тестирование
- Запустить расширение в режиме отладки (F5)
- Протестировать новую функциональность
- Проверить логи в Output панели "1C Metadata Viewer"

### 4. Очистка
- Удалить временные файлы (если создавались)
- Убедиться, что нет console.log в production коде (использовать outputChannel)

### 5. Коммит изменений
```bash
git add .
git commit -m "Описание изменений"
```

## Порядок работы с файлами

### При изменении TypeScript кода
1. Изменить файл в `src/`
2. Запустить `npm run compile` или использовать watch режим
3. Проверить скомпилированный код в `out/`

### При изменении React компонентов (webview)
1. Изменить файл в `src/webview/`
2. Запустить `npm run build:webview` или использовать watch режим
3. Проверить bundle в `media/metadataEditor.bundle.js`

### При изменении package.json
1. Обновить версию расширения
2. Добавить/изменить команды, меню, keybindings
3. Обновить локализацию в `package.nls.*.json`
4. Перезагрузить окно VS Code (F1 → "Reload Window")

## Важные моменты

### Структура package.json
- `contributes.commands` - регистрация команд
- `contributes.menus` - контекстные меню
- `contributes.keybindings` - горячие клавиши
- `contributes.configuration` - настройки расширения

### Локализация
- `package.nls.json` - базовый файл (английский)
- `package.nls.ru.json` - русская локализация
- `package.nls.en.json` - английская локализация
- Использовать ключи вида `%1c-metadata-viewer.commandName.title%`

### Регистрация команд
- Все команды регистрируются в `src/extension.ts` в функции `activate()`
- Использовать `context.subscriptions.push()` для управления ресурсами
- Команды должны быть зарегистрированы до их использования в меню

### Webview компоненты
- Используют React и Monaco Editor
- Коммуникация с extension через `vscode.postMessage()`
- Получение сообщений через `window.addEventListener('message')`

## Отладка

### Включение debug режима
В настройках VS Code:
```json
{
  "metadataViewer.debugMode": true
}
```

### Просмотр логов
- Output панель → выбрать "1C Metadata Viewer"
- Логи автоматически показываются при активации расширения

### Тестирование в режиме разработки
1. Нажать F5 для запуска Extension Development Host
2. В новом окне открыть папку с конфигурацией 1С
3. Проверить работу расширения
