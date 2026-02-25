# Централизованный словарь типов метаданных METADATA_TYPES

## Расположение
Файл: `src/Metadata/metadata-types.ts`

## Описание
Централизованный словарь соответствия типов метаданных 1С и их русских названий. Используется для универсального преобразования типов ссылок в webview и других частях приложения.

## Структура
```typescript
export interface MetadataTypeMapping {
    type: string;              // Английский тип (Document, Catalog, Enum и т.д.)
    displayName: string;       // Русское название (Документ, Справочник, Перечисление)
    refType: string;           // Тип ссылки (DocumentRef, CatalogRef и т.д.)
    refDisplayName: string;    // Русское название типа ссылки
    objectType?: string;       // Тип объекта (DocumentObject, CatalogObject)
    objectDisplayName?: string; // Русское название типа объекта
    managerType?: string;      // Тип менеджера (DocumentManager, CatalogManager)
    managerDisplayName?: string; // Русское название типа менеджера
}

export const METADATA_TYPES: MetadataTypeMapping[]
```

## Использование

### Преобразование русского типа в английский
```typescript
import { METADATA_TYPES } from './Metadata/metadata-types';

const metadataType = METADATA_TYPES.find(m => m.displayName === updatedObject.objectType);
const objectTypeEn = metadataType ? metadataType.type : updatedObject.objectType;
```

### Преобразование английского типа в русский
```typescript
const metadataType = METADATA_TYPES.find(m => m.type === 'Document');
const objectTypeRu = metadataType ? metadataType.displayName : 'Document';
```

## Где используется
- `src/metadataView.ts` - преобразование типов для поиска в ConfigDumpInfo.xml
- `src/panels/MetadataPanel.ts` - преобразование типов при сохранении метаданных
- `src/xmlParsers/metadataParser.ts` - преобразование типов при парсинге XML
- Webview компоненты - отображение типов в интерфейсе

## Важно
- В ConfigDumpInfo.xml имена объектов всегда с английским префиксом (Document, Catalog, Enum)
- Парсер преобразует английские префиксы в русские (Document -> Документ)
- При поиске в ConfigDumpInfo.xml нужно использовать английский тип из METADATA_TYPES

## Примеры типов
- Document -> Документ
- Catalog -> Справочник
- Enum -> Перечисление
- InformationRegister -> Регистр сведений
- AccumulationRegister -> Регистр накопления
- AccountingRegister -> Регистр бухгалтерии
- CalculationRegister -> Регистр расчета
- Report -> Отчет
- DataProcessor -> Обработка
- ChartOfAccounts -> План счетов
- ChartOfCharacteristicTypes -> План видов характеристик
- ChartOfCalculationTypes -> План видов расчета
- BusinessProcess -> Бизнес-процесс
- Task -> Задача
- Constant -> Константа
- CommonModule -> Общий модуль