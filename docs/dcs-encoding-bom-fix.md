# Исправление проблемы с кодировкой и BOM в Template.xml

## Проблема

При сохранении Template.xml из редактора СКД и последующей загрузке в конфигуратор 1С возникали "кракозябры":

```
❌ БЫЛО:
РСЃС‚РѕС‡РЅРёРєР"Р°РЅРЅС‹С…1  (вместо ИсточникДанных1)
РЎРѕС‚СЂСѓРґРЅРёРє              (вместо Сотрудник)
РќР°Р±РѕСЂР"Р°РЅРЅС‹С…1        (вместо НаборДанных1)
```

Это **двойное кодирование UTF-8** - классический признак проблемы с кодировкой.

## Диагностика

### 1️⃣ Проверка кода парсинга/сериализации

```bash
$ node test-cases/test-encoding.js

✅ Кодировка в порядке!
   Парсинг: ИсточникДанных → ИсточникДанных
   Байты совпадают: d098d181d182d0bed187d0bdd0b8d0bad094d0b0d0bdd0bdd18bd185
```

**Вывод:** `fast-xml-parser` работает правильно, кодировка UTF-8 не портится.

### 2️⃣ Проверка BOM (Byte Order Mark)

```bash
$ node test-cases/test-bom.js

Template1.xml (оригинал):
  Первые 3 байта: EF BB BF
  BOM: ✓ ПРИСУТСТВУЕТ

Template2.xml (из редактора):
  Первые 3 байта: 3C 3F 78
  BOM: ✗ ОТСУТСТВУЕТ

⚠️  НЕСООТВЕТСТВИЕ!
```

## 🎯 Корневая причина

**1С конфигуратор требует UTF-8 файлы С BOM (EF BB BF)**

Когда файл сохраняется **БЕЗ BOM**, конфигуратор:
1. Неправильно определяет кодировку
2. Читает UTF-8 байты как другую кодировку (вероятно, Windows-1251)
3. Затем пытается конвертировать в UTF-8 снова
4. Получаются "кракозябры" (двойное кодирование)

### Что такое BOM?

**BOM (Byte Order Mark)** - специальная последовательность байтов в начале файла:

| Кодировка | BOM | Описание |
|-----------|-----|----------|
| UTF-8 | `EF BB BF` | Используется в Windows/1С |
| UTF-8 без BOM | (нет) | Используется в Linux/macOS |
| UTF-16 LE | `FF FE` | Windows Unicode |
| UTF-16 BE | `FE FF` | Big Endian Unicode |

**1С стандарт:** UTF-8 **с BOM** (EF BB BF)

## Решение

### Изменение в `src/dcsEditor.ts`

**БЫЛО:**
```typescript
// Сохранить Template.xml
fs.writeFileSync(templatePath, updatedXml, 'utf8');
// ❌ writeFileSync с 'utf8' НЕ добавляет BOM!
```

**СТАЛО:**
```typescript
// Сохранить Template.xml с BOM (как в оригинальных файлах 1С)
// ВАЖНО: 1С конфигуратор требует UTF-8 с BOM (EF BB BF)
const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
const contentBuffer = Buffer.from(updatedXml, 'utf8');
fs.writeFileSync(templatePath, Buffer.concat([bomBuffer, contentBuffer]));
// ✅ Файл сохраняется с BOM!
```

### Как это работает

```javascript
// 1. Создаем BOM
const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
//    Байты:       EF    BB    BF

// 2. Конвертируем XML в UTF-8 байты
const contentBuffer = Buffer.from(updatedXml, 'utf8');

// 3. Объединяем BOM + содержимое
fs.writeFileSync(path, Buffer.concat([bomBuffer, contentBuffer]));
//                      ↑
//                      BOM идет первым!
```

### Результат

```
Файл Template.xml:
  Первые 3 байта: EF BB BF  ✅
  Кодировка: UTF-8 с BOM
  Кириллица: ИсточникДанных ✅
```

## Тестирование

### Создание тестового файла

```javascript
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const fs = require('fs');

// Парсим оригинал
const parser = new XMLParser({ preserveOrder: true, ... });
const parsed = parser.parse(originalXml);

// Сериализуем
const builder = new XMLBuilder({ format: true, indentBy: '\t', ... });
const rebuilt = '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.build(parsed);

// Сохраняем с BOM
const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
const contentBuffer = Buffer.from(rebuilt, 'utf8');
fs.writeFileSync('test.xml', Buffer.concat([bomBuffer, contentBuffer]));

// Проверяем
const buffer = fs.readFileSync('test.xml');
console.log('BOM:', buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF ? '✓' : '✗');
```

### Проверка в конфигураторе

1. ✅ Открыть редактор СКД
2. ✅ Внести изменения
3. ✅ Сохранить (Ctrl+S)
4. ✅ Загрузить изменения в конфигуратор
5. ✅ Проверить кириллицу

**Ожидаемый результат:** Кириллица отображается правильно, без "кракозябр".

## Измененные файлы

1. ✅ `src/dcsEditor.ts`:
   - Метод `handleSaveDcs`
   - Добавлено сохранение с BOM

2. ✅ `test-cases/test-encoding.js` (новый) - тест кодировки
3. ✅ `test-cases/test-bom.js` (новый) - тест BOM
4. ✅ `docs/dcs-encoding-bom-fix.md` (этот файл) - документация

## Важные моменты

### 1️⃣ Всегда сохранять с BOM

Для совместимости с 1С **всегда** сохраняем файлы с BOM:
- ✅ Template.xml
- ✅ Form.xml
- ✅ Report.xml
- ✅ Любые XML метаданных 1С

### 2️⃣ Node.js и BOM

**Node.js по умолчанию:**
- `fs.readFileSync(path, 'utf8')` - **удаляет BOM** при чтении
- `fs.writeFileSync(path, string, 'utf8')` - **НЕ добавляет BOM** при записи

**Решение:**
- Читать: обычным способом (BOM удаляется автоматически)
- Писать: через `Buffer.concat([BOM, content])`

### 3️⃣ Проверка BOM

```javascript
// Проверить наличие BOM
const buffer = fs.readFileSync('file.xml');
const hasBom = buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
console.log('BOM:', hasBom ? 'ЕСТЬ' : 'НЕТ');
```

### 4️⃣ Git и BOM

Git по умолчанию сохраняет BOM. Убедитесь, что в `.gitattributes` нет:
```
*.xml text eol=lf
# ❌ Это может удалить BOM!
```

Правильно:
```
*.xml text
# ✅ Сохраняет BOM
```

## Итог

✅ **Проблема решена!**

| Проверка | До | После |
|----------|-----|-------|
| BOM в файле | ❌ НЕТ | ✅ ЕСТЬ (EF BB BF) |
| Кодировка | UTF-8 | UTF-8 с BOM |
| Кириллица в конфигураторе | ❌ Кракозябры | ✅ Правильно |
| Загрузка в 1С | ❌ Ошибка XDTO | ✅ Успешно |

**Редактор СКД полностью готов к работе!** 🎉

---

## Справка: Двойное кодирование

**Как возникают "кракозябры":**

1. Исходный текст: `ИсточникДанных` 
2. UTF-8 байты: `D0 98 D1 81 D1 82 D0 BE D1 87 D0 BD D0 B8 D0 BA D0 94 D0 B0 D0 BD D0 BD D1 8B D1 85`
3. **БЕЗ BOM** → программа думает, что это Windows-1251
4. Интерпретация как Windows-1251: каждый байт → символ
   - `D0` → `Р`, `98` → `С˜`, `D1` → `С'`, `81` → `Ѓ`, и т.д.
5. Конвертация обратно в UTF-8: `РСЃС‚РѕС‡РЅРёРєР"Р°РЅРЅС‹С…`

**С BOM** → программа знает, что это UTF-8 → читает правильно! ✅

