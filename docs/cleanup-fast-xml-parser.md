# Очистка проекта от fast-xml-parser модулей DCS

## Выполненные действия

### 1️⃣ Удалены исходные файлы

**Удалено:**
- ❌ `src/xmlParsers/dcsParser.ts` (использовал fast-xml-parser)
- ❌ `src/xmlParsers/dcsSerializer.ts` (использовал fast-xml-parser)

**Заменено на:**
- ✅ `src/xmlParsers/dcsParserXmldom.ts` (использует @xmldom/xmldom)
- ✅ `src/xmlParsers/dcsSerializerXmldom.ts` (использует @xmldom/xmldom)

### 2️⃣ Обновлены импорты

**`src/Metadata/types.ts`:**
```typescript
// БЫЛО:
import type { ParsedReportDcs } from "../xmlParsers/dcsParser";

// СТАЛО:
import type { ParsedReportDcs } from "../xmlParsers/dcsParserXmldom";
```

**`src/dcsEditor.ts`:**
```typescript
// БЫЛО:
import { parseReportXmlForDcs, ParsedReportDcs, type ParsedDcsNode } from "./xmlParsers/dcsParser";
import { serializeDcsToPreserveOrder, serializeToXml } from "./xmlParsers/dcsSerializer";

// СТАЛО:
import { parseReportXmlForDcs, ParsedReportDcs, type ParsedDcsNode } from "./xmlParsers/dcsParserXmldom";
import { serializeToXml } from "./xmlParsers/dcsSerializerXmldom";
```

### 3️⃣ Удалены скомпилированные файлы

**Удалено из `out/xmlParsers/`:**
- ❌ `dcsParser.js`
- ❌ `dcsParser.js.map`
- ❌ `dcsSerializer.js`
- ❌ `dcsSerializer.js.map`

**Осталось:**
- ✅ `dcsParserXmldom.js`
- ✅ `dcsParserXmldom.js.map`
- ✅ `dcsSerializerXmldom.js`
- ✅ `dcsSerializerXmldom.js.map`

### 4️⃣ Компиляция проекта

```bash
$ npm run compile
✅ Компиляция успешна (без ошибок)
```

## Результаты проверки

### Использование fast-xml-parser в проекте

**DCS модули (удалено):**
- ❌ `src/xmlParsers/dcsParser.ts` - УДАЛЕН
- ❌ `src/xmlParsers/dcsSerializer.ts` - УДАЛЕН

**Другие модули (оставлены, они используются):**
- ✅ `src/utils/xmlUtils.ts` - используется для других целей
- ✅ `src/xmlParsers/metadataParser.ts` - читает конфигурацию
- ✅ `src/xmlParsers/formParser.ts` - парсит формы
- ✅ `src/metadataView.ts` - сканирует метаданные
- ✅ `src/ConfigurationFormats/edt.ts` - EDT формат
- ✅ `src/autogen-bsl/metadata/PredefinedXmlParser.ts` - предопределенные
- ✅ `src/autogen-bsl/metadata/UniversalMetadataParser.ts` - универсальный парсер

**Примечание:** fast-xml-parser НЕ удален из `package.json`, так как он все еще используется в других модулях проекта (не DCS).

## Что изменилось

### До

```
src/xmlParsers/
├── dcsParser.ts          ❌ (fast-xml-parser)
├── dcsSerializer.ts      ❌ (fast-xml-parser)
├── metadataParser.ts     ✓  (fast-xml-parser)
└── formParser.ts         ✓  (fast-xml-parser)
```

### После

```
src/xmlParsers/
├── dcsParserXmldom.ts    ✅ (xmldom)
├── dcsSerializerXmldom.ts ✅ (xmldom)
├── metadataParser.ts     ✓  (fast-xml-parser)
└── formParser.ts         ✓  (fast-xml-parser)
```

## Преимущества

1. ✅ **Консистентность DCS модулей** - теперь DCS использует тот же подход, что и edit metadata/формы
2. ✅ **Соответствие стандарту проекта** - xmldom для XML, требующего точного сохранения структуры
3. ✅ **Упрощение кода** - не нужен XmlDiffMerge для DCS
4. ✅ **BOM support** - автоматическое сохранение UTF-8 с BOM для 1С
5. ✅ **Меньше дублирования** - один подход для всех редакторов

## Следующие шаги (опционально)

Если потребуется полная миграция на xmldom (для всех модулей):

1. **Мигрировать `metadataParser.ts`**
   - Сейчас использует fast-xml-parser
   - Можно мигрировать на xmldom для консистентности
   
2. **Мигрировать `formParser.ts`**
   - Сейчас использует fast-xml-parser
   - Можно мигрировать на xmldom
   
3. **Удалить fast-xml-parser из зависимостей**
   - После миграции всех модулей
   - `npm uninstall fast-xml-parser`

**Примечание:** Текущая миграция касается только DCS модулей, так как они критичны для сохранения структуры XML и должны быть консистентны с edit metadata.

## Итог

✅ **DCS модули полностью очищены от fast-xml-parser!**

| Проверка | Статус |
|----------|--------|
| Удалены старые файлы | ✅ |
| Обновлены импорты | ✅ |
| Компиляция успешна | ✅ |
| Удалены скомпилированные файлы | ✅ |
| Тесты работают | ✅ |

**Проект готов к работе с xmldom для DCS!** 🎉

