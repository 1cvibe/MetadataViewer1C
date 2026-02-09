# Стандарт парсинга XML: ТОЛЬКО xmldom

## КРИТИЧЕСКИ ВАЖНО
- **ВСЕГДА** используется `@xmldom/xmldom` для парсинга и сериализации XML
- **НИКОГДА** не использовать `fast-xml-parser`
- **ПРИЧИНА**: xmldom сохраняет структуру XML (атрибуты, элементы, порядок, форматирование)

## Примеры использования

### ✅ ПРАВИЛЬНО: xmldom
```typescript
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

// Парсинг
const parser = new DOMParser();
const doc = parser.parseFromString(xmlString, 'text/xml');

// Сериализация
const serializer = new XMLSerializer();
const output = serializer.serializeToString(doc);
```

### ❌ НЕПРАВИЛЬНО: fast-xml-parser
```typescript
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
// НЕ ИСПОЛЬЗОВАТЬ! Не сохраняет структуру!
```

## Где используется

1. **src/utils/xmlDomUtils.ts**
   - `applyChangesToXmlStringWithDom()` - для метаданных
   - `applyFormChangesToXmlStringWithDom()` - для форм
   
2. **src/panels/MetadataPanel.ts**
   - Сохранение метаданных
   - Сохранение форм
   - Комментарий: "xmldom требует исходный XML для сохранения структуры"

3. **ВСЕ XML парсеры должны использовать xmldom:**
   - `src/xmlParsers/dcsParser.ts` - DCS схемы
   - `src/xmlParsers/dcsSerializer.ts` - DCS сериализация
   - Любые новые XML парсеры

## Почему xmldom?

- ✅ Сохраняет структуру XML (атрибуты vs элементы)
- ✅ Сохраняет порядок элементов
- ✅ Сохраняет форматирование (отступы, переносы строк)
- ✅ DOM API - стандартный W3C интерфейс
- ✅ Работает с BOM (UTF-8 with BOM)

## Сохранение с BOM

```typescript
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

// Парсим
const parser = new DOMParser();
const doc = parser.parseFromString(xmlString, 'text/xml');

// Сериализуем
const serializer = new XMLSerializer();
let output = serializer.serializeToString(doc);

// ВАЖНО: Добавляем BOM для 1С
const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
const contentBuffer = Buffer.from(output, 'utf8');
fs.writeFileSync(path, Buffer.concat([bomBuffer, contentBuffer]));
```

## Правила

1. **ВСЕГДА** используй xmldom для XML
2. **НИКОГДА** не используй fast-xml-parser
3. **ВСЕГДА** добавляй BOM при сохранении для 1С
4. **ВСЕГДА** сохраняй _originalXml для патчинга
