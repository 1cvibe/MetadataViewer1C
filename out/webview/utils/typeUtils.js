"use strict";
/**
 * Утилиты для работы с типами метаданных 1C
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTypeForSave = exports.formatTypeForDisplay = exports.extractTypeString = void 0;
/**
 * Извлекает строковое представление типа из различных форматов
 */
function extractTypeString(type) {
    if (!type)
        return null;
    // Если это составной тип (массив Type)
    if (typeof type === 'object' && type !== null && type.Type && Array.isArray(type.Type)) {
        // Для составных типов возвращаем специальное значение или null
        // (форматирование будет выполнено в formatTypeForDisplay)
        return null; // Составной тип обрабатывается отдельно
    }
    // Если это ParsedTypeRef с полем kind
    if (typeof type === 'object' && type.kind) {
        // Для Composite возвращаем null, чтобы обработать в formatTypeForDisplay
        if (type.kind === 'Composite') {
            return null;
        }
        // Для TypeSet (определяемые типы) extractTypeString не подходит — обрабатываем в formatTypeForDisplay
        return String(type.kind);
    }
    // Если это объект с v8:TypeSet (определяемый тип)
    if (typeof type === 'object' && type['v8:TypeSet']) {
        const ts = type['v8:TypeSet'];
        if (typeof ts === 'string') {
            return ts;
        }
        if (typeof ts === 'object' && ts?.['#text']) {
            return String(ts['#text']);
        }
    }
    // Если это объект с v8:Type
    if (typeof type === 'object' && type['v8:Type']) {
        const v8Type = type['v8:Type'];
        if (typeof v8Type === 'string') {
            return v8Type;
        }
        if (typeof v8Type === 'object' && v8Type?.['#text']) {
            return String(v8Type['#text']);
        }
    }
    // Если это объект с Type (не массив)
    if (typeof type === 'object' && type.Type && !Array.isArray(type.Type)) {
        const typeValue = type.Type;
        if (typeof typeValue === 'string') {
            return typeValue;
        }
        if (typeof typeValue === 'object' && typeValue?.['#text']) {
            return String(typeValue['#text']);
        }
    }
    // Если это строка
    if (typeof type === 'string') {
        return type;
    }
    return null;
}
exports.extractTypeString = extractTypeString;
/**
 * Форматирует тип для отображения в UI
 */
function formatTypeForDisplay(type) {
    if (!type)
        return 'Не указано';
    // Проверяем, является ли это составным типом (массив Type)
    if (typeof type === 'object' && type !== null) {
        // Определяемый тип (TypeSet) — одиночный
        if (type['v8:TypeSet']) {
            const ts = type['v8:TypeSet'];
            const raw = (typeof ts === 'object' && ts !== null && ts['#text']) ? String(ts['#text']) : String(ts);
            const clean = raw.replace(/^cfg:/, '');
            return clean.startsWith('DefinedType.') ? clean.replace('DefinedType.', 'ОпределяемыйТип.') : clean;
        }
        // ParsedTypeRef: TypeSet
        if (type.kind === 'TypeSet' && type.details?.TypeSet) {
            const clean = String(type.details.TypeSet).replace(/^cfg:/, '');
            return clean.startsWith('DefinedType.') ? clean.replace('DefinedType.', 'ОпределяемыйТип.') : clean;
        }
        // Новая структура: { Type: [{ Type: '...' }, { Type: '...' }] }
        if (type.Type && Array.isArray(type.Type)) {
            const types = type.Type.map((t) => {
                let tStr = '';
                if (typeof t === 'object' && t !== null) {
                    if (t.Type) {
                        tStr = typeof t.Type === 'string' ? t.Type : (t.Type['#text'] || String(t.Type));
                    }
                    else if (t.TypeSet || t['v8:TypeSet']) {
                        const ts = t.TypeSet || t['v8:TypeSet'];
                        tStr = typeof ts === 'string' ? ts : (ts?.['#text'] || String(ts));
                    }
                    else if (t['v8:Type']) {
                        const tType = t['v8:Type'];
                        tStr = typeof tType === 'string' ? tType : (tType?.['#text'] || String(tType));
                    }
                }
                else if (typeof t === 'string') {
                    tStr = t;
                }
                if (!tStr)
                    return '';
                // Убираем префиксы и форматируем для отображения
                const cleanTStr = tStr.replace(/^cfg:/, '').replace(/^xs:/, '');
                if (cleanTStr.startsWith('DefinedType.')) {
                    return cleanTStr.replace('DefinedType.', 'ОпределяемыйТип.');
                }
                // Для ссылочных типов форматируем красиво
                if (cleanTStr.includes('.')) {
                    const parts = cleanTStr.split('.');
                    const refPrefix = parts[0];
                    // Маппинг префиксов на русские названия
                    const prefixMap = {
                        'CatalogRef': 'Справочник',
                        'DocumentRef': 'Документ',
                        'InformationRegisterRef': 'РегистрСведений',
                        'AccumulationRegisterRef': 'РегистрНакопления',
                        'EnumRef': 'Перечисление',
                        'Characteristic': 'ПланВидовХарактеристик'
                    };
                    const prefixLabel = prefixMap[refPrefix] || refPrefix;
                    return parts[1] ? `${prefixLabel}.${parts[1]}` : cleanTStr;
                }
                // Для примитивных типов
                const primitiveMap = {
                    'string': 'Строка',
                    'decimal': 'Число',
                    'int': 'Число',
                    'integer': 'Число',
                    'boolean': 'Булево',
                    // cleanTStr.toLowerCase() => "datetime"
                    'datetime': 'Дата',
                    'dateTime': 'Дата',
                    'date': 'Дата',
                    'time': 'Дата'
                };
                return primitiveMap[cleanTStr.toLowerCase()] || cleanTStr;
            }).filter((t) => t);
            if (types.length > 0) {
                return `Один из (${types.join(', ')})`;
            }
        }
        // Проверяем, является ли это OneOf (старая структура)
        if (type['v8:Type'] === 'OneOf' || (typeof type['v8:Type'] === 'object' && type['v8:Type']?.['#text'] === 'OneOf')) {
            if (type['v8:TypeSet']) {
                const typeSet = Array.isArray(type['v8:TypeSet']) ? type['v8:TypeSet'] : [type['v8:TypeSet']];
                const types = typeSet.map((t) => {
                    const tStr = extractTypeString(t);
                    if (!tStr)
                        return '';
                    const cleanTStr = tStr.replace(/^cfg:/, '');
                    return cleanTStr;
                }).filter((t) => t).join(', ');
                return `Один из (${types})`;
            }
        }
        // Проверяем ParsedTypeRef с kind === 'Composite'
        if (type.kind === 'Composite' && type.details && type.details.Type && Array.isArray(type.details.Type)) {
            const types = type.details.Type.map((t) => {
                const tType = typeof t === 'object' && t !== null
                    ? (t.Type || t.TypeSet || t['v8:Type'] || t['v8:TypeSet'] || '')
                    : String(t);
                const cleanTStr = String(tType).replace(/^cfg:/, '').replace(/^xs:/, '');
                if (cleanTStr.startsWith('DefinedType.')) {
                    return cleanTStr.replace('DefinedType.', 'ОпределяемыйТип.');
                }
                return cleanTStr;
            }).filter((t) => t);
            if (types.length > 0) {
                return `Один из (${types.join(', ')})`;
            }
        }
    }
    const typeStr = extractTypeString(type);
    if (!typeStr)
        return 'Не указано';
    // Убираем префикс cfg: для отображения
    const cleanTypeStr = typeStr.replace(/^cfg:/, '').replace(/^xs:/, '');
    // Если это ссылочный тип, можно добавить перевод
    if (cleanTypeStr.includes('.')) {
        const parts = cleanTypeStr.split('.');
        const refPrefix = parts[0];
        // Здесь можно добавить маппинг префиксов на русские названия
        return cleanTypeStr;
    }
    return cleanTypeStr;
}
exports.formatTypeForDisplay = formatTypeForDisplay;
/**
 * Нормализует тип для сохранения (добавляет префикс cfg: если нужно)
 */
function normalizeTypeForSave(typeValue, referenceTypesList) {
    if (!typeValue || typeValue.startsWith('cfg:') || typeValue.startsWith('xs:')) {
        return typeValue;
    }
    // Проверяем, есть ли префикс в исходном списке
    const foundInList = referenceTypesList.find(rt => {
        const rtClean = rt.value.replace(/^cfg:/, '');
        return rtClean === typeValue;
    });
    if (foundInList && foundInList.value.startsWith('cfg:')) {
        return foundInList.value;
    }
    // Добавляем префикс cfg: для ссылочных типов
    return `cfg:${typeValue}`;
}
exports.normalizeTypeForSave = normalizeTypeForSave;
//# sourceMappingURL=typeUtils.js.map