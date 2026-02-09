---
name: Удаление неиспользуемых XSLT
overview: "Модули в папке `xslt/` не используются в рантайме: предпросмотр форм переведён на React‑webview ([formPreviewer.ts](src/formPreviewer.ts)). Оставшиеся XSLT, скрипт precompile, xslt3, saxon-js и связанные артефакты — legacy. План описывает их безопасное удаление."
todos: []
---

# План удаления неиспользуемых модулей XSLT из проекта

## Результаты проверки

**Модули в `xslt/` не используются.**

- В [formPreviewer.ts](src/formPreviewer.ts) явно указано: *«вместо жёсткого XSLT-рендера открываем React-webview»*. Предпросмотр форм реализован через [FormPreviewApp](src/webview/components/FormPreview/FormPreviewApp.tsx), парсеры XML и сериализатор — без XSLT.
- В `src/` нет импортов: `form.sef.json`, SaxonJS, `saxon-js`, `xslt3`, ни прямых обращений к `.xsl` / трансформациям.
- Скрипт `precompile` в [package.json](package.json) только собирает `form.sef.json` из `form.xsl`; он **не** входит в `vscode:prepublish` (там только `compile` + `build:webview`). SEF не собирается при публикации расширения.
- [.vscodeignore](.vscodeignore) исключает `xslt/*.xsl`, `xslt/func/**` — XSLT и так не попадает в vsix.

**Структура XSLT:** [form.xsl](xslt/form.xsl) импортирует все остальные `.xsl` (button, checkbox-field, input-field, label-decoration, label-field, select-field, radio-button-field, picture-decoration, button-group, `func/split-camel-case.xsl`). Вместе они представляют один неиспользуемый пайплайн.

---

## Шаги удаления

### 1. Удалить папку `xslt/`

- Удалить все файлы и подпапки: `form.xsl`, `button.xsl`, `checkbox-field.xsl`, `input-field.xsl`, `label-decoration.xsl`, `label-field.xsl`, `select-field.xsl`, `radio-button-field.xsl`, `picture-decoration.xsl`, `button-group.xsl`, `func/split-camel-case.xsl`.
- Удалить артефакт `form.sef.json` (если ещё присутствует в репозитории; по [.gitignore](.gitignore) он игнорируется).

### 2. Обновить [package.json](package.json)

- Удалить скрипт `"precompile": "node node_modules/xslt3/xslt3.js -nogo -xsl:xslt/form.xsl -export:xslt/form.sef.json -t"`.
- Удалить devDependency `"xslt3": "^2.6.0"`.
- Удалить dependency `"saxon-js": "^2.6.0"`.

### 3. Удалить типы для SaxonJS

- Удалить файл [saxon-js.d.ts](saxon-js.d.ts) (объявление `declare module "saxon-js"`).

### 4. Обновить [.gitignore](.gitignore)

- Удалить строки, относящиеся к XSLT/SEF: `# xslt3 artifact` и `form.sef.json`.

### 5. Обновить [.vscodeignore](.vscodeignore)

- Удалить исключения, связанные с XSLT и SaxonJS:
- `node_modules/xslt3/**`
- `xslt/*.xsl`
- `xslt/func/**`
- `saxon-js.d.ts`  
(После удаления папки `xslt/` и файла `saxon-js.d.ts` эти строки станут избыточны.)

### 6. Обновить память Serena (по необходимости)

- [.serena/memories/architecture.md](.serena/memories/architecture.md): убрать упоминание `xslt3` (компилятор XSLT).
- [.serena/memories/suggested_commands.md](.serena/memories/suggested_commands.md): убрать закомментированную команду precompile.
- [.serena/memories/project_overview.md](.serena/memories/project_overview.md): убрать пункт про `xslt/` (XSLT‑шаблоны для форм).

### 7. Переустановить зависимости

- Выполнить `npm install` после правок `package.json`, чтобы обновить `package-lock.json` и удалить `xslt3` и `saxon-js` из `node_modules`.

---

## Важно

- **Риски:** Минимальны. XSLT и SEF не используются ни в коде, ни в сборке/публикации. Упоминания «precompiled» / «.xslt» в `media/metadataEditor.bundle.js` относятся к RJSF/AJV и к расширениям файлов, не к нашим XSLT.
- **Откат:** Восстановить удалённые файлы и зависимости из Git при необходимости.

## Дополнительные идеи (не в scope)

- Проверить, не используется ли `.xslt` / `.xsl` в webview (например, для редактора) в других целях — на текущий момент в логике предпросмотра форм и сборки они не задействованы.