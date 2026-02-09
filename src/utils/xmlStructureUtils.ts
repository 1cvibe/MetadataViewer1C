/**
 * Утилиты для работы со структурой XML
 * Помогают сохранять и восстанавливать исходную структуру XML (атрибуты vs элементы)
 */

/**
 * Обрабатывает элемент StandardAttribute, преобразуя все простые свойства в элементы
 * В XML 1С все свойства внутри xr:StandardAttribute должны быть элементами
 */
function processStandardAttributeItem(item: any): any {
    if (item === null || typeof item !== 'object') {
        return item;
    }
    
    if (Array.isArray(item)) {
        return item.map(processStandardAttributeItem);
    }
    
    const processed: any = {};
    
    // Сохраняем атрибут name, если он есть (это атрибут элемента, а не свойство)
    if (item.name !== undefined) {
        processed.name = item.name;
    }
    
    // Обрабатываем все остальные свойства
    for (const [key, value] of Object.entries(item)) {
        if (key === 'name') continue; // name уже обработан
        
        // Пропускаем служебные поля
        if (key.startsWith('@') || key === 'text') {
            processed[key] = value;
            continue;
        }
        
        // Простые значения преобразуем в элементы
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            // Пустые строки остаются пустыми элементами
            processed[key] = value === "" ? "" : { "#text": String(value) };
        } else if (value === null || value === undefined) {
            processed[key] = "";
        } else if (Array.isArray(value)) {
            processed[key] = value.map(processStandardAttributeItem);
        } else if (typeof value === 'object' && value !== null) {
            // Проверяем, является ли это многоязычным полем (v8:item или item)
            if (key === "Format" || key === "EditFormat" || key === "ToolTip" || key === "Synonym" || key === "Comment") {
                // Многоязычные поля в StandardAttributes - должны иметь префикс xr: или v8:
                const valueObj: Record<string, any> = value as Record<string, any>;
                if (valueObj["v8:item"] || valueObj["item"]) {
                    const item = valueObj["v8:item"] || valueObj["item"];
                    if (typeof item === 'object' && !Array.isArray(item)) {
                        const itemObj: Record<string, any> = item as Record<string, any>;
                        // Преобразуем v8:lang и v8:content в элементы, если они были атрибутами
                        processed[key] = {
                            "v8:item": {
                                "v8:lang": typeof itemObj["v8:lang"] === 'string' ? { "#text": itemObj["v8:lang"] } : 
                                          (typeof itemObj["lang"] === 'string' ? { "#text": itemObj["lang"] } : itemObj["v8:lang"] || itemObj["lang"]),
                                "v8:content": typeof itemObj["v8:content"] === 'string' ? { "#text": itemObj["v8:content"] } : 
                                             (typeof itemObj["content"] === 'string' ? { "#text": itemObj["content"] } : itemObj["v8:content"] || itemObj["content"])
                            }
                        };
                    } else if (Array.isArray(item)) {
                        processed[key] = {
                            "v8:item": item.map((i: any) => {
                                if (typeof i === 'object') {
                                    const iObj: Record<string, any> = i as Record<string, any>;
                                    return {
                                        "v8:lang": typeof iObj["v8:lang"] === 'string' ? { "#text": iObj["v8:lang"] } : 
                                                  (typeof iObj["lang"] === 'string' ? { "#text": iObj["lang"] } : iObj["v8:lang"] || iObj["lang"]),
                                        "v8:content": typeof iObj["v8:content"] === 'string' ? { "#text": iObj["v8:content"] } : 
                                                     (typeof iObj["content"] === 'string' ? { "#text": iObj["content"] } : iObj["v8:content"] || iObj["content"])
                                    };
                                }
                                return i;
                            })
                        };
                    } else {
                        processed[key] = deepClone(value);
                    }
                } else {
                    // Не многоязычное поле - обрабатываем как обычно
                    const xsiNilKey: string = "xsi:nil";
                    const nilKey: string = "nil";
                    const xsiNilValue = valueObj[xsiNilKey];
                    const nilValue = valueObj[nilKey];
                    const hasXsiNil = xsiNilValue === "true";
                    const hasNil = nilValue === "true";
                    if (hasXsiNil || hasNil) {
                        processed[key] = deepClone(value);
                    } else {
                        // Рекурсивно обрабатываем вложенные объекты
                        processed[key] = processStandardAttributeItem(value);
                    }
                }
            } else {
                // Проверяем, является ли это элементом с xsi:nil
                const valueObj: Record<string, any> = value as Record<string, any>;
                const xsiNilKey: string = "xsi:nil";
                const nilKey: string = "nil";
                const xsiNilValue = valueObj[xsiNilKey];
                const nilValue = valueObj[nilKey];
                const hasXsiNil = xsiNilValue === "true";
                const hasNil = nilValue === "true";
                if (hasXsiNil || hasNil) {
                    processed[key] = deepClone(value);
                } else {
                    // Рекурсивно обрабатываем вложенные объекты
                    processed[key] = processStandardAttributeItem(value);
                }
            }
        } else {
            processed[key] = value;
        }
    }
    
    return processed;
}

/**
 * Оптимизированное глубокое копирование объекта
 * Быстрее и эффективнее чем JSON.parse(JSON.stringify())
 */
export function deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    const cloned: any = {};
    for (const [key, value] of Object.entries(obj)) {
        cloned[key] = deepClone(value);
    }
    
    return cloned;
}

/**
 * Восстанавливает структуру Properties из исходного объекта
 * Объединяет изменения из normalized с исходной структурой из original
 * 
 * ВАЖНО: В XML 1С все свойства в узле Properties являются элементами, а не атрибутами.
 * Атрибуты используются только для служебных полей (uuid, xmlns и т.д.).
 * 
 * Edge cases:
 * - Пустые элементы (<Comment/>) → ""
 * - Элементы только с атрибутами (<MinValue xsi:nil="true"/>) → сохраняем атрибуты
 * - Многоязычные поля с массивами → сохраняем структуру
 */
export function restorePropertiesStructure(
    normalized: Record<string, any>,
    original: any
): any {
    if (!original) {
        // Если нет исходного объекта, создаем элементы по умолчанию
        const result: any = {};
        for (const [key, value] of Object.entries(normalized)) {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                result[key] = value === "" ? "" : { "#text": String(value) };
            } else if (Array.isArray(value)) {
                // Для StandardAttributes нужно использовать структуру { "xr:StandardAttribute": [...] }
                if (key === 'StandardAttributes' && value.length > 0) {
                    result[key] = {
                        "xr:StandardAttribute": value.map((item: any) => {
                            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                                return { "#text": String(item) };
                            }
                            return processStandardAttributeItem(item);
                        })
                    };
                } else {
                    result[key] = value;
                }
            } else {
                result[key] = value;
            }
        }
        return result;
    }
    
    const restored: any = {};
    
    // Сначала копируем все исходные свойства, преобразуя простые значения в элементы
    // В XML 1С все свойства Properties должны быть элементами, а не атрибутами
    // КРИТИЧНО: даже если в original свойство было простой строкой, оно должно стать элементом
    for (const [key, value] of Object.entries(original)) {
        if (key.startsWith('@') || key === 'text') continue;
        // Сохраняем исходную структуру для неизмененных свойств
        if (normalized[key] === undefined) {
            // Проверяем, является ли значение JSON строкой (сложный объект, который был сериализован)
            // В этом случае нужно использовать исходную структуру из original
            if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                // Это JSON строка - пропускаем, так как исходная структура должна быть в original
                // Но если original уже содержит правильную структуру, используем её
                continue;
            }
            // ВАЖНО: В XML 1С все свойства Properties являются элементами, а не атрибутами
            // Даже если в original значение было простой строкой/числом/булево, преобразуем в элемент
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                // Всегда преобразуем в элемент с #text
                restored[key] = value === "" ? "" : { "#text": String(value) };
            } else if (value === null || value === undefined) {
                // Пустые значения - пустые элементы
                restored[key] = "";
            } else if (Array.isArray(value)) {
                // Массивы (например, StandardAttributes) - сохраняем как есть
                // Для StandardAttributes нужно использовать структуру { "xr:StandardAttribute": [...] }
                if (key === 'StandardAttributes' && value.length > 0) {
                    // Преобразуем массив в объект с ключом "xr:StandardAttribute"
                    // ВАЖНО: обрабатываем через processStandardAttributeItem, чтобы все свойства стали элементами
                    restored[key] = {
                        "xr:StandardAttribute": value.map((item: any) => {
                            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                                return { "#text": String(item) };
                            }
                            return processStandardAttributeItem(item);
                        })
                    };
                } else if (key === 'StandardAttributes' && value.length === 0) {
                    // Пустой массив StandardAttributes - проверяем original
                    const originalValue = original[key];
                    if (originalValue !== undefined && 
                        typeof originalValue === 'object' && 
                        originalValue !== null &&
                        !Array.isArray(originalValue)) {
                        // Исходная структура была объектом - используем её
                        const standardAttrKey = originalValue["xr:StandardAttribute"] ? "xr:StandardAttribute" : 
                                              (originalValue["StandardAttribute"] ? "StandardAttribute" : "xr:StandardAttribute");
                        const items = originalValue[standardAttrKey] || originalValue["StandardAttribute"] || [];
                        const itemsArray = Array.isArray(items) ? items : [items];
                        restored[key] = {
                            [standardAttrKey]: itemsArray.map((item: any) => processStandardAttributeItem(item))
                        };
                    } else {
                        // Пустой массив - создаем пустую структуру
                        restored[key] = { "xr:StandardAttribute": [] };
                    }
                } else {
                    // Обычные массивы - сохраняем как есть
                    restored[key] = value.map((item: any) => {
                        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                            return { "#text": String(item) };
                        }
                        return deepClone(item);
                    });
                }
            } else if (typeof value === 'object' && value !== null) {
                // Сложный объект - сохраняем структуру (может содержать атрибуты типа xsi:nil)
                // ВАЖНО: проверяем, не является ли это объектом, который должен быть элементом
                // Если все значения - простые типы или пустые строки, возможно это неправильно распарсенное свойство
                const allSimpleOrEmpty = Object.values(value).every(v => 
                    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || 
                    v === null || v === undefined || v === ""
                );
                // Если это объект с простыми значениями и нет вложенных объектов, возможно это свойство Properties
                // которое должно быть элементом, но было неправильно распарсено
                if (allSimpleOrEmpty && Object.keys(value).length > 0 && 
                    !Object.keys(value).some(k => k.includes(':') || k.startsWith('@') || k === 'xsi:nil' || k === 'nil')) {
                    // Это может быть объект, который должен быть элементом - преобразуем все значения в элементы
                    const processed: any = {};
                    for (const [k, v] of Object.entries(value)) {
                        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                            processed[k] = v === "" ? "" : { "#text": String(v) };
                        } else {
                            processed[k] = v;
                        }
                    }
                    restored[key] = processed;
                } else {
                    // Обычный сложный объект - сохраняем структуру
                    // ВАЖНО: для Characteristics, BasedOn, ChoiceParameterLinks и других сложных объектов
                    // нужно сохранять исходную структуру полностью, так как они могут содержать
                    // элементы с префиксами пространств имен (xr:, v8: и т.д.)
                    // Эти объекты должны восстанавливаться из original полностью
                    restored[key] = deepClone(value);
                }
            }
        }
    }
    
    // ВАЖНО: для сложных объектов (Characteristics, BasedOn, ChoiceParameterLinks и т.д.)
    // которые не были изменены, нужно использовать исходную структуру из original полностью
    // Эти объекты могут содержать элементы с префиксами пространств имен, которые должны
    // сохраняться как элементы, а не атрибуты
    const complexObjectKeys = ["Characteristics", "BasedOn", "ChoiceParameterLinks", "ChoiceParameters", 
                               "InputByString", "RegisterRecords"];
    for (const key of complexObjectKeys) {
        if (normalized[key] === undefined && original[key] !== undefined) {
            // Объект не был изменен - используем исходную структуру полностью
            restored[key] = deepClone(original[key]);
        }
    }
    
    // Затем обновляем измененные свойства
    for (const [key, value] of Object.entries(normalized)) {
        const originalValue = original[key];
        
        // Edge case: Пустые элементы
        if (value === "" || value === null || value === undefined) {
            // Проверяем, было ли исходное значение элементом только с атрибутами (xsi:nil и т.д.)
            if (originalValue !== undefined && 
                typeof originalValue === 'object' && 
                originalValue !== null) {
                // Проверяем наличие атрибутов (ключи с : или начинающиеся с @)
                const hasAttributes = Object.keys(originalValue).some(k => 
                    k.includes(':') || k.startsWith('@') || k === 'xsi:nil' || k === 'nil'
                );
                const hasText = '#text' in originalValue || 'text' in originalValue;
                
                if (hasAttributes && !hasText) {
                    // Элемент только с атрибутами - сохраняем структуру
                    restored[key] = deepClone(originalValue);
                } else {
                    // Обычный пустой элемент
                    restored[key] = "";
                }
            } else {
                // Обычный пустой элемент
                restored[key] = "";
            }
            continue;
        }
        
        // Специальная обработка для многоязычных полей (Synonym, ListPresentation, ToolTip и т.д.)
        // Эти поля уже обработаны в handleSave и имеют структуру v8:item
        const multilingualFields = ["Synonym", "ListPresentation", "ToolTip", "Title", "Comment", 
                                    "ExtendedListPresentation", "ObjectPresentation", "ExtendedObjectPresentation", "Explanation"];
        if (multilingualFields.includes(key) && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Это многоязычное поле с уже правильной структурой - сохраняем как есть
            restored[key] = deepClone(value);
        }
        // В XML 1С все свойства Properties являются элементами
        // Всегда преобразуем простые значения в элементы с #text
        else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            // Проверяем, было ли исходное значение объектом с атрибутами (xsi:nil и т.д.)
            const wasElementWithAttributes = originalValue !== undefined && 
                typeof originalValue === 'object' && 
                originalValue !== null &&
                !('#text' in originalValue || 'text' in originalValue) &&
                Object.keys(originalValue).some(k => k.includes(':') || k.startsWith('@') || k === 'xsi:nil' || k === 'nil');
            
            if (wasElementWithAttributes) {
                // Элемент только с атрибутами - сохраняем атрибуты и добавляем текст
                restored[key] = deepClone(originalValue);
                restored[key]["#text"] = String(value);
            } else {
                // Обычный элемент с текстом
                restored[key] = value === "" ? "" : { "#text": String(value) };
            }
        } else if (Array.isArray(value)) {
            // Массивы (например, StandardAttributes) - сохраняем как есть
            // Для StandardAttributes нужно использовать структуру { "xr:StandardAttribute": [...] }
            if (key === 'StandardAttributes' && value.length > 0) {
                // Проверяем, есть ли исходная структура для StandardAttributes
                if (originalValue !== undefined && 
                    typeof originalValue === 'object' && 
                    originalValue !== null &&
                    !Array.isArray(originalValue)) {
                    // Исходная структура была объектом с ключом "xr:StandardAttribute" или "StandardAttribute"
                    const standardAttrKey = originalValue["xr:StandardAttribute"] ? "xr:StandardAttribute" : 
                                          (originalValue["StandardAttribute"] ? "StandardAttribute" : "xr:StandardAttribute");
                    restored[key] = {
                        [standardAttrKey]: value.map((item: any) => {
                            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                                return { "#text": String(item) };
                            }
                            // Рекурсивно обрабатываем свойства внутри StandardAttribute
                            // Все свойства должны быть элементами, а не атрибутами
                            return processStandardAttributeItem(item);
                        })
                    };
                } else {
                    // Преобразуем массив в объект с ключом "xr:StandardAttribute"
                    restored[key] = {
                        "xr:StandardAttribute": value.map((item: any) => {
                            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                                return { "#text": String(item) };
                            }
                            // ВАЖНО: обрабатываем через processStandardAttributeItem, чтобы все свойства стали элементами
                            return processStandardAttributeItem(item);
                        })
                    };
                }
            } else {
                // Обычные массивы - сохраняем как есть
                restored[key] = value.map((item: any) => {
                    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                        return { "#text": String(item) };
                    }
                    return deepClone(item);
                });
            }
        } else if (key === 'StandardAttributes') {
            // Обрабатываем StandardAttributes - они могут быть в normalized или в originalValue
            if (Array.isArray(value) && value.length > 0) {
                // Значение из normalized - уже обработано выше
                // Но если originalValue существует, используем его структуру
                if (originalValue !== undefined && 
                    typeof originalValue === 'object' && 
                    originalValue !== null &&
                    !Array.isArray(originalValue)) {
                    const standardAttrKey = originalValue["xr:StandardAttribute"] ? "xr:StandardAttribute" : 
                                          (originalValue["StandardAttribute"] ? "StandardAttribute" : "xr:StandardAttribute");
                    restored[key] = {
                        [standardAttrKey]: value.map((item: any) => {
                            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                                return { "#text": String(item) };
                            }
                            return processStandardAttributeItem(item);
                        })
                    };
                } else {
                    restored[key] = {
                        "xr:StandardAttribute": value.map((item: any) => {
                            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                                return { "#text": String(item) };
                            }
                            return processStandardAttributeItem(item);
                        })
                    };
                }
            } else if (Array.isArray(originalValue) && originalValue.length > 0) {
                // Если StandardAttributes не были изменены, но нужно преобразовать структуру
                // Используем исходную структуру и обрабатываем элементы
                const standardAttrKey = "xr:StandardAttribute";
                restored[key] = {
                    [standardAttrKey]: originalValue.map((item: any) => processStandardAttributeItem(item))
                };
            } else if (originalValue !== undefined && 
                      typeof originalValue === 'object' && 
                      originalValue !== null &&
                      !Array.isArray(originalValue)) {
                // Исходная структура была объектом - обрабатываем её
                const standardAttrKey = originalValue["xr:StandardAttribute"] ? "xr:StandardAttribute" : 
                                      (originalValue["StandardAttribute"] ? "StandardAttribute" : "xr:StandardAttribute");
                const items = originalValue[standardAttrKey] || originalValue["StandardAttribute"] || [];
                const itemsArray = Array.isArray(items) ? items : [items];
                restored[key] = {
                    [standardAttrKey]: itemsArray.map((item: any) => processStandardAttributeItem(item))
                };
            }
        } else {
            // Проверяем, является ли значение JSON строкой (сложный объект, который был сериализован)
            // В этом случае используем исходную структуру из original
            if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                // Это JSON строка - используем исходную структуру из original, если она есть
                if (originalValue !== undefined && 
                    typeof originalValue === 'object' && 
                    originalValue !== null &&
                    !Array.isArray(originalValue)) {
                    // Используем исходную структуру из original
                    restored[key] = deepClone(originalValue);
                } else {
                    // Если исходной структуры нет, пропускаем это свойство
                    // Оно должно быть восстановлено из original при копировании неизмененных свойств
                    continue;
                }
            }
            // Edge case: Элемент с xsi:nil
            else if (value && typeof value === 'object' && '_xsiNil' in value && value._xsiNil === true) {
                // Восстанавливаем элемент с атрибутом xsi:nil="true"
                // Используем исходную структуру, если она есть
                if (originalValue !== undefined && 
                    typeof originalValue === 'object' && 
                    originalValue !== null &&
                    ('xsi:nil' in originalValue || 'nil' in originalValue)) {
                    restored[key] = deepClone(originalValue);
                } else {
                    restored[key] = {
                        "xsi:nil": "true"
                    };
                }
            }
            // Обычные сложные объекты - сохраняем как есть
            else {
                restored[key] = deepClone(value);
            }
        }
    }
    
    // КРИТИЧНО: убеждаемся, что все пустые свойства в Properties являются элементами, а не атрибутами
    // Проверяем все свойства в restored и убеждаемся, что пустые свойства представлены как пустые элементы ""
    for (const [key, value] of Object.entries(restored)) {
        // Если свойство - пустая строка, оставляем как есть (это пустой элемент)
        // Если свойство - объект с #text равным пустой строке, преобразуем в пустую строку
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const valueObj: Record<string, any> = value as Record<string, any>;
            if (valueObj["#text"] === "" || valueObj["text"] === "") {
                // Это пустой элемент - преобразуем в пустую строку
                restored[key] = "";
            }
        }
    }
    
    return restored;
}

/**
 * Восстанавливает структуру реквизита из исходного объекта
 */
export function restoreAttributeStructure(
    normalizedAttr: { name: string; type: any; properties: Record<string, any> },
    originalAttr: any,
    formatTypeToXmlValue: (type: any) => any
): any {
    if (!originalAttr) {
        // Если нет исходного объекта, создаем новую структуру с элементами
        const props: any = {
            Name: normalizedAttr.name ? { "#text": normalizedAttr.name } : "",
            Type: formatTypeToXmlValue(normalizedAttr.type)
        };
        
        // Добавляем остальные свойства как элементы
        for (const [key, value] of Object.entries(normalizedAttr.properties)) {
            if (key === "Name" || key === "name" || key === "Type") continue;
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                props[key] = value === "" ? "" : { "#text": String(value) };
            } else if (Array.isArray(value)) {
                // Для StandardAttributes нужно использовать структуру { "xr:StandardAttribute": [...] }
                if (key === 'StandardAttributes' && value.length > 0) {
                    props[key] = {
                        "xr:StandardAttribute": value.map((item: any) => {
                            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                                return { "#text": String(item) };
                            }
                            return processStandardAttributeItem(item);
                        })
                    };
                } else {
                    props[key] = value;
                }
            } else {
                props[key] = value;
            }
        }
        
        return {
            Properties: props
        };
    }
    
    // Используем исходную структуру (оптимизированное глубокое копирование)
    const restored = deepClone(originalAttr);
    
    // Гарантируем наличие Properties
    const props = restored.Properties || (restored.Properties = {});
    
    // Восстанавливаем остальные Properties реквизита
    // В XML 1С все свойства Properties должны быть элементами
    const originalProps = originalAttr?.Properties || {};
    const normalizedProps = normalizedAttr.properties;
    
    // ВАЖНО: для сложных объектов в Properties реквизита (ChoiceParameterLinks, ChoiceParameters и т.д.)
    // которые не были изменены, нужно использовать исходную структуру из originalProps полностью
    const complexPropertyKeys = ["ChoiceParameterLinks", "ChoiceParameters"];
    for (const key of complexPropertyKeys) {
        if (normalizedProps[key] === undefined && originalProps[key] !== undefined) {
            // Объект не был изменен - используем исходную структуру полностью
            props[key] = deepClone(originalProps[key]);
        }
    }
    
    // Сначала копируем все исходные свойства из originalProps, преобразуя простые значения в элементы
    for (const [key, value] of Object.entries(originalProps)) {
        if (key.startsWith('@') || key === 'text') continue;
        // Пропускаем сложные объекты, которые уже обработаны выше
        if (complexPropertyKeys.includes(key)) continue;
        // Сохраняем исходную структуру для неизмененных свойств (кроме Name и Type, которые обновляются)
        if (key !== "Name" && key !== "name" && key !== "Type" && normalizedProps[key] === undefined) {
            // Проверяем, является ли значение JSON строкой (сложный объект, который был сериализован)
            if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                // Это JSON строка - пропускаем, исходная структура должна быть в originalProps
                continue;
            }
            // Если значение - простой тип (строка, число, булево), преобразуем в элемент
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                props[key] = value === "" ? "" : { "#text": String(value) };
            } else if (value === null || value === undefined) {
                props[key] = "";
            } else if (Array.isArray(value)) {
                // Для StandardAttributes нужно использовать структуру { "xr:StandardAttribute": [...] }
                if (key === 'StandardAttributes' && value.length > 0) {
                    props[key] = {
                        "xr:StandardAttribute": value.map((item: any) => processStandardAttributeItem(item))
                    };
                } else {
                    props[key] = value.map((item: any) => {
                        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                            return { "#text": String(item) };
                        }
                        return deepClone(item);
                    });
                }
            } else if (typeof value === 'object' && value !== null) {
                // Сложный объект - сохраняем структуру (может содержать атрибуты типа xsi:nil)
                // ВАЖНО: проверяем, не является ли это объектом, который должен быть элементом
                // Если все значения - простые типы или пустые строки, возможно это неправильно распарсенное свойство
                const allSimpleOrEmpty = Object.values(value).every(v => 
                    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || 
                    v === null || v === undefined || v === ""
                );
                // Если это объект с простыми значениями и нет вложенных объектов, возможно это свойство Properties
                // которое должно быть элементом, но было неправильно распарсено
                if (allSimpleOrEmpty && Object.keys(value).length > 0 && 
                    !Object.keys(value).some(k => k.includes(':') || k.startsWith('@') || k === 'xsi:nil' || k === 'nil' || k === 'xsi:type')) {
                    // Это может быть объект, который должен быть элементом - преобразуем все значения в элементы
                    const processed: any = {};
                    for (const [k, v] of Object.entries(value)) {
                        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                            processed[k] = v === "" ? "" : { "#text": String(v) };
                        } else {
                            processed[k] = v;
                        }
                    }
                    props[key] = processed;
                } else {
                    // Обычный сложный объект - сохраняем структуру
                    props[key] = deepClone(value);
                }
            }
        }
    }
    
    // Обновляем измененные свойства Name и Type (всегда элементы)
    // Name должен быть элементом
    props.Name = normalizedAttr.name ? { "#text": normalizedAttr.name } : "";
    // Type уже правильно структурирован из formatTypeToXmlValue
    // ВАЖНО: если в originalProps.Type есть структура с v8:Type как элементом, сохраняем её
    const typeValue = formatTypeToXmlValue(normalizedAttr.type);
    const originalType = originalProps.Type;
    
    // Обрабатываем структуру Type
    if (typeValue && typeof typeValue === 'object' && typeValue["OneOf"]) {
        // Структура OneOf - обрабатываем каждый Type внутри
        props.Type = {
            OneOf: {
                Type: (typeValue["OneOf"]["Type"] || []).map((t: any) => {
                    if (t && typeof t === 'object' && t["v8:Type"]) {
                        // Преобразуем v8:Type в элемент с #text, если он строка
                        return {
                            "v8:Type": typeof t["v8:Type"] === 'string' ? { "#text": t["v8:Type"] } : t["v8:Type"]
                        };
                    }
                    return t;
                })
            }
        };
    } else if (originalType !== undefined && 
        typeof originalType === 'object' && 
        originalType !== null &&
        !Array.isArray(originalType)) {
        // Если originalType имеет структуру, используем её
        if (originalType["OneOf"]) {
            // Структура OneOf - обрабатываем каждый Type внутри
            props.Type = deepClone(originalType);
            if (typeValue && typeof typeValue === 'object' && typeValue["OneOf"]) {
                // Обновляем структуру OneOf из typeValue
                props.Type.OneOf = {
                    Type: (typeValue["OneOf"]["Type"] || []).map((t: any, idx: number) => {
                        const originalT = originalType["OneOf"] && originalType["OneOf"]["Type"] && 
                                         Array.isArray(originalType["OneOf"]["Type"]) ? 
                                         originalType["OneOf"]["Type"][idx] : undefined;
                        if (t && typeof t === 'object' && t["v8:Type"]) {
                            // Если в original был элемент с #text, сохраняем структуру
                            if (originalT && typeof originalT === 'object' && originalT["v8:Type"] && 
                                typeof originalT["v8:Type"] === 'object' && originalT["v8:Type"]["#text"]) {
                                return {
                                    "v8:Type": { "#text": typeof t["v8:Type"] === 'string' ? t["v8:Type"] : t["v8:Type"] }
                                };
                            }
                            // Преобразуем v8:Type в элемент с #text
                            return {
                                "v8:Type": typeof t["v8:Type"] === 'string' ? { "#text": t["v8:Type"] } : t["v8:Type"]
                            };
                        }
                        return t;
                    })
                };
            }
        } else if (originalType["v8:Type"]) {
            // Структура с v8:Type - может быть массивом или одним элементом
            if (Array.isArray(originalType["v8:Type"])) {
                // Несколько элементов v8:Type - сохраняем как массив элементов
                props.Type = {
                    "v8:Type": originalType["v8:Type"].map((t: any) => {
                        if (typeof t === 'string') {
                            return { "#text": t };
                        } else if (typeof t === 'object' && t["#text"]) {
                            return t;
                        } else {
                            return { "#text": String(t) };
                        }
                    })
                };
                // Если typeValue имеет структуру OneOf, обновляем её
                if (typeValue && typeof typeValue === 'object' && typeValue["OneOf"]) {
                    props.Type = {
                        OneOf: {
                            Type: (typeValue["OneOf"]["Type"] || []).map((t: any) => {
                                if (t && typeof t === 'object' && t["v8:Type"]) {
                                    return {
                                        "v8:Type": typeof t["v8:Type"] === 'string' ? { "#text": t["v8:Type"] } : t["v8:Type"]
                                    };
                                }
                                return t;
                            })
                        }
                    };
                }
            } else {
                // Один элемент v8:Type
                props.Type = deepClone(originalType);
                // Обновляем v8:Type, если он есть в typeValue
                if (typeValue && typeof typeValue === 'object' && typeValue["v8:Type"]) {
                    // Если v8:Type был элементом, сохраняем его как элемент
                    if (typeof originalType["v8:Type"] === 'object' && originalType["v8:Type"]["#text"]) {
                        props.Type["v8:Type"] = { "#text": typeof typeValue["v8:Type"] === 'string' ? typeValue["v8:Type"] : typeValue["v8:Type"] };
                    } else {
                        props.Type["v8:Type"] = typeof typeValue["v8:Type"] === 'string' ? { "#text": typeValue["v8:Type"] } : typeValue["v8:Type"];
                    }
                }
            }
        } else if (originalType && typeof originalType === 'object' && originalType["v8:TypeSet"]) {
            // Структура с v8:TypeSet - сохраняем как элемент
            props.Type = deepClone(originalType);
            // Обновляем v8:TypeSet, если он есть в typeValue
            if (typeValue && typeof typeValue === 'object' && typeValue["v8:TypeSet"]) {
                // Преобразуем v8:TypeSet в элемент с #text, если он строка
                props.Type["v8:TypeSet"] = typeof typeValue["v8:TypeSet"] === 'string' ? 
                    { "#text": typeValue["v8:TypeSet"] } : 
                    typeValue["v8:TypeSet"];
            } else if (typeof originalType["v8:TypeSet"] === 'string') {
                // Если в original был строкой, преобразуем в элемент
                props.Type["v8:TypeSet"] = { "#text": originalType["v8:TypeSet"] };
            }
            // Обрабатываем v8:StringQualifiers, если есть
            if (originalType["v8:StringQualifiers"]) {
                const sq = originalType["v8:StringQualifiers"];
                if (typeof sq === 'object' && !Array.isArray(sq)) {
                    props.Type["v8:StringQualifiers"] = {
                        "v8:Length": typeof sq["v8:Length"] === 'string' || typeof sq["v8:Length"] === 'number' ? 
                            { "#text": String(sq["v8:Length"]) } : sq["v8:Length"],
                        "v8:AllowedLength": typeof sq["v8:AllowedLength"] === 'string' ? 
                            { "#text": sq["v8:AllowedLength"] } : sq["v8:AllowedLength"]
                    };
                }
            }
            // Обновляем из typeValue, если есть
            if (typeValue && typeof typeValue === 'object' && typeValue["v8:StringQualifiers"]) {
                const sq = typeValue["v8:StringQualifiers"];
                if (typeof sq === 'object' && !Array.isArray(sq)) {
                    props.Type["v8:StringQualifiers"] = {
                        "v8:Length": typeof sq["v8:Length"] === 'string' || typeof sq["v8:Length"] === 'number' ? 
                            { "#text": String(sq["v8:Length"]) } : sq["v8:Length"],
                        "v8:AllowedLength": typeof sq["v8:AllowedLength"] === 'string' ? 
                            { "#text": sq["v8:AllowedLength"] } : sq["v8:AllowedLength"]
                    };
                }
            }
        } else {
            // Используем новую структуру из formatTypeToXmlValue
            if (typeValue && typeof typeValue === 'object') {
                if (typeValue["v8:TypeSet"]) {
                    // Структура с v8:TypeSet
                    props.Type = {
                        "v8:TypeSet": typeof typeValue["v8:TypeSet"] === 'string' ? 
                            { "#text": typeValue["v8:TypeSet"] } : 
                            typeValue["v8:TypeSet"]
                    };
                } else if (typeValue["v8:Type"]) {
                    // Преобразуем v8:Type в элемент с #text
                    props.Type = {
                        "v8:Type": typeof typeValue["v8:Type"] === 'string' ? { "#text": typeValue["v8:Type"] } : typeValue["v8:Type"]
                    };
                    // Копируем остальные свойства из typeValue (например, v8:StringQualifiers)
                    for (const [k, v] of Object.entries(typeValue)) {
                        if (k !== "v8:Type") {
                            if (k === "v8:StringQualifiers" && v !== null && typeof v === 'object' && !Array.isArray(v)) {
                                // Обрабатываем v8:StringQualifiers - все свойства должны быть элементами
                                const sq = v as Record<string, any>;
                                props.Type[k] = {
                                    "v8:Length": typeof sq["v8:Length"] === 'string' || typeof sq["v8:Length"] === 'number' ? 
                                        { "#text": String(sq["v8:Length"]) } : sq["v8:Length"],
                                    "v8:AllowedLength": typeof sq["v8:AllowedLength"] === 'string' ? 
                                        { "#text": sq["v8:AllowedLength"] } : sq["v8:AllowedLength"]
                                };
                            } else {
                                props.Type[k] = v;
                            }
                        }
                    }
                } else {
                    props.Type = typeValue;
                }
            } else {
                props.Type = typeValue;
            }
        }
    } else {
        // Используем новую структуру из formatTypeToXmlValue
        // ВАЖНО: убеждаемся, что v8:Type является элементом, а не атрибутом
        if (typeValue && typeof typeValue === 'object' && typeValue["v8:Type"]) {
            // Преобразуем v8:Type в элемент с #text
            props.Type = {
                "v8:Type": typeof typeValue["v8:Type"] === 'string' ? { "#text": typeValue["v8:Type"] } : typeValue["v8:Type"]
            };
            // Копируем остальные свойства из typeValue
            for (const [k, v] of Object.entries(typeValue)) {
                if (k !== "v8:Type") {
                    props.Type[k] = v;
                }
            }
        } else {
            props.Type = typeValue;
        }
    }
    
    for (const [key, value] of Object.entries(normalizedProps)) {
        if (key === "Name" || key === "name" || key === "Type") continue;
        
        const originalPropValue = originalProps[key];
        
        // Edge case: Пустые элементы
        if (value === "" || value === null || value === undefined) {
            // Проверяем, было ли исходное значение элементом только с атрибутами (xsi:nil и т.д.)
            if (originalPropValue !== undefined && 
                typeof originalPropValue === 'object' && 
                originalPropValue !== null) {
                const hasAttributes = Object.keys(originalPropValue).some(k => 
                    k.includes(':') || k.startsWith('@') || k === 'xsi:nil' || k === 'nil'
                );
                const hasText = '#text' in originalPropValue || 'text' in originalPropValue;
                
                if (hasAttributes && !hasText) {
                    // Элемент только с атрибутами - сохраняем структуру
                    props[key] = deepClone(originalPropValue);
                } else {
                    // Обычный пустой элемент
                    props[key] = "";
                }
            } else {
                // Обычный пустой элемент
                props[key] = "";
            }
            continue;
        }
        
        // Специальная обработка для многоязычных полей (Synonym, ListPresentation, ToolTip и т.д.)
        // Эти поля должны иметь структуру v8:item с вложенными элементами v8:lang и v8:content
        const multilingualFields = ["Synonym", "ListPresentation", "ToolTip", "Title", "Comment", 
                                    "ExtendedListPresentation", "ObjectPresentation", "ExtendedObjectPresentation", "Explanation"];
        if (multilingualFields.includes(key) && typeof value === 'string') {
            // Используем исходную структуру из originalPropValue, если она есть
            // КРИТИЧНО: Безопасная проверка наличия v8:item перед использованием оператора 'in'
            if (originalPropValue !== undefined && 
                typeof originalPropValue === 'object' && 
                originalPropValue !== null &&
                !Array.isArray(originalPropValue) &&
                (("v8:item" in originalPropValue && originalPropValue["v8:item"] !== undefined) || 
                 ("item" in originalPropValue && originalPropValue["item"] !== undefined))) {
                // Копируем исходную структуру и обновляем только content
                // ВАЖНО: убеждаемся, что v8:lang и v8:content являются элементами, а не атрибутами
                props[key] = deepClone(originalPropValue);
                if (props[key]["v8:item"]) {
                    if (typeof props[key]["v8:item"] === 'object' && !Array.isArray(props[key]["v8:item"])) {
                        // Преобразуем v8:lang и v8:content в элементы, если они были атрибутами
                        if (typeof props[key]["v8:item"]["v8:lang"] === 'string') {
                            props[key]["v8:item"]["v8:lang"] = { "#text": props[key]["v8:item"]["v8:lang"] };
                        }
                        props[key]["v8:item"]["v8:content"] = typeof value === 'string' ? { "#text": value } : value;
                    } else if (Array.isArray(props[key]["v8:item"])) {
                        // Если это массив, обновляем первый элемент
                        if (props[key]["v8:item"][0] && typeof props[key]["v8:item"][0] === 'object') {
                            if (typeof props[key]["v8:item"][0]["v8:lang"] === 'string') {
                                props[key]["v8:item"][0]["v8:lang"] = { "#text": props[key]["v8:item"][0]["v8:lang"] };
                            }
                            props[key]["v8:item"][0]["v8:content"] = typeof value === 'string' ? { "#text": value } : value;
                        }
                    }
                } else if (props[key]["item"]) {
                    if (typeof props[key]["item"] === 'object' && !Array.isArray(props[key]["item"])) {
                        if (typeof props[key]["item"]["v8:lang"] === 'string') {
                            props[key]["item"]["v8:lang"] = { "#text": props[key]["item"]["v8:lang"] };
                        }
                        props[key]["item"]["v8:content"] = typeof value === 'string' ? { "#text": value } : value;
                    } else if (Array.isArray(props[key]["item"])) {
                        if (props[key]["item"][0] && typeof props[key]["item"][0] === 'object') {
                            if (typeof props[key]["item"][0]["v8:lang"] === 'string') {
                                props[key]["item"][0]["v8:lang"] = { "#text": props[key]["item"][0]["v8:lang"] };
                            }
                            props[key]["item"][0]["v8:content"] = typeof value === 'string' ? { "#text": value } : value;
                        }
                    }
                }
            } else {
                // Создаем новую структуру
                props[key] = {
                    "v8:item": {
                        "v8:lang": "ru",
                        "v8:content": value
                    }
                };
            }
            continue;
        }
        
        // Все свойства Properties должны быть элементами
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            // Проверяем, было ли исходное значение объектом с атрибутами (xsi:nil и т.д.)
            const wasElementWithAttributes = originalPropValue !== undefined && 
                typeof originalPropValue === 'object' && 
                originalPropValue !== null &&
                !('#text' in originalPropValue || 'text' in originalPropValue) &&
                Object.keys(originalPropValue).some(k => k.includes(':') || k.startsWith('@') || k === 'xsi:nil' || k === 'nil');
            
            if (wasElementWithAttributes) {
                // Элемент только с атрибутами - сохраняем атрибуты и добавляем текст
                props[key] = deepClone(originalPropValue);
                props[key]["#text"] = String(value);
            } else {
                // Обычный элемент с текстом
                props[key] = value === "" ? "" : { "#text": String(value) };
            }
        } else if (value === null || value === undefined) {
            props[key] = "";
        } else if (Array.isArray(value)) {
            // Для StandardAttributes нужно использовать структуру { "xr:StandardAttribute": [...] }
            if (key === 'StandardAttributes' && value.length > 0) {
                // Проверяем, есть ли исходная структура для StandardAttributes
                if (originalPropValue !== undefined && 
                    typeof originalPropValue === 'object' && 
                    originalPropValue !== null &&
                    !Array.isArray(originalPropValue)) {
                    // Исходная структура была объектом с ключом "xr:StandardAttribute" или "StandardAttribute"
                    const standardAttrKey = originalPropValue["xr:StandardAttribute"] ? "xr:StandardAttribute" : 
                                          (originalPropValue["StandardAttribute"] ? "StandardAttribute" : "xr:StandardAttribute");
                    props[key] = {
                        [standardAttrKey]: value.map((item: any) => {
                            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                                return { "#text": String(item) };
                            }
                            return processStandardAttributeItem(item);
                        })
                    };
                } else {
                    props[key] = {
                        "xr:StandardAttribute": value.map((item: any) => {
                            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                                return { "#text": String(item) };
                            }
                            return processStandardAttributeItem(item);
                        })
                    };
                }
            } else {
                props[key] = value.map((item: any) => {
                    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                        return { "#text": String(item) };
                    }
                    return deepClone(item);
                });
            }
            } else {
                // Проверяем, является ли значение JSON строкой (сложный объект, который был сериализован)
                if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
                    // Это JSON строка - используем исходную структуру из original, если она есть
                    if (originalPropValue !== undefined && 
                        typeof originalPropValue === 'object' && 
                        originalPropValue !== null &&
                        !Array.isArray(originalPropValue)) {
                        // Используем исходную структуру из original
                        props[key] = deepClone(originalPropValue);
                    } else {
                        // Если исходной структуры нет, пропускаем это свойство
                        continue;
                    }
                }
                // Edge case: Элемент с xsi:nil
                else if (value && typeof value === 'object' && '_xsiNil' in value && value._xsiNil === true) {
                    if (originalPropValue !== undefined && 
                        typeof originalPropValue === 'object' && 
                        originalPropValue !== null &&
                        ('xsi:nil' in originalPropValue || 'nil' in originalPropValue)) {
                        props[key] = deepClone(originalPropValue);
                    } else {
                        props[key] = { "xsi:nil": "true" };
                    }
                } else {
                    // Сложный объект - проверяем, есть ли исходная структура с атрибутами (например, xsi:type)
                    if (originalPropValue !== undefined && 
                        typeof originalPropValue === 'object' && 
                        originalPropValue !== null &&
                        !Array.isArray(originalPropValue)) {
                        // Проверяем, есть ли атрибуты в исходной структуре (xsi:type, xsi:nil и т.д.)
                        const hasAttributes = Object.keys(originalPropValue).some(k => 
                            k.includes(':') || k.startsWith('@') || k === 'xsi:nil' || k === 'nil' || k === 'xsi:type'
                        );
                        if (hasAttributes) {
                            // Используем исходную структуру с атрибутами
                            props[key] = deepClone(originalPropValue);
                            // Если есть текст в value, добавляем его
                            if (value && typeof value === 'object' && ('#text' in value || 'text' in value)) {
                                const textValue = value["#text"] || value["text"];
                                if (textValue !== undefined && textValue !== null && textValue !== "") {
                                    props[key]["#text"] = String(textValue);
                                }
                            } else if (typeof value === 'string' && value !== "") {
                                props[key]["#text"] = value;
                            }
                        } else {
                            props[key] = deepClone(value);
                        }
                    } else {
                        props[key] = deepClone(value);
                    }
                }
            }
    }
    
    // КРИТИЧНО: убеждаемся, что все пустые свойства в Properties реквизита являются элементами, а не атрибутами
    // Проверяем все свойства в props и убеждаемся, что пустые свойства представлены как пустые элементы ""
    for (const [key, value] of Object.entries(props)) {
        // Если свойство - пустая строка, оставляем как есть (это пустой элемент)
        // Если свойство - объект с #text равным пустой строке, преобразуем в пустую строку
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const valueObj: Record<string, any> = value as Record<string, any>;
            if (valueObj["#text"] === "" || valueObj["text"] === "") {
                // Это пустой элемент - преобразуем в пустую строку
                props[key] = "";
            }
        }
    }
    
    // Удаляем старые плоские поля на верхнем уровне
    delete restored.name;
    delete restored.Name;
    delete restored.Type;
    
    return restored;
}

/**
 * Восстанавливает структуру табличной части из исходного объекта
 */
export function restoreTabularSectionStructure(
    normalizedTS: { name: string; attributes: Array<{ name: string; type: any; properties: Record<string, any> }> },
    originalTS: any,
    formatTypeToXmlValue: (type: any) => any
): any {
    if (!originalTS) {
        // Создаем новую структуру
        const props: any = { Name: normalizedTS.name };
        const childObjects: any = { Attribute: [] };
        
        for (const attr of normalizedTS.attributes) {
            childObjects.Attribute.push(restoreAttributeStructure(attr, null, formatTypeToXmlValue));
        }
        
        return {
            Properties: props,
            ChildObjects: childObjects
        };
    }
    
    // Используем исходную структуру (оптимизированное глубокое копирование)
    const restored = deepClone(originalTS);
    
    // Восстанавливаем InternalInfo из originalTS, если он есть
    // InternalInfo содержит элементы xr:GeneratedType с атрибутами, которые должны сохраняться как атрибуты
    // ВАЖНО: элементы xr:TypeId и xr:ValueId должны быть элементами, а не атрибутами
    if (originalTS?.InternalInfo) {
        const internalInfo = deepClone(originalTS.InternalInfo);
        // Обрабатываем каждый xr:GeneratedType, чтобы убедиться, что xr:TypeId и xr:ValueId - элементы
        if (internalInfo["xr:GeneratedType"]) {
            const generatedTypes = Array.isArray(internalInfo["xr:GeneratedType"]) ? 
                internalInfo["xr:GeneratedType"] : 
                [internalInfo["xr:GeneratedType"]];
            internalInfo["xr:GeneratedType"] = generatedTypes.map((gt: any) => {
                const processed = { ...gt };
                // Преобразуем xr:TypeId и xr:ValueId в элементы с #text, если они простые строки
                if (typeof processed["xr:TypeId"] === 'string') {
                    processed["xr:TypeId"] = { "#text": processed["xr:TypeId"] };
                }
                if (typeof processed["xr:ValueId"] === 'string') {
                    processed["xr:ValueId"] = { "#text": processed["xr:ValueId"] };
                }
                return processed;
            });
        }
        restored.InternalInfo = internalInfo;
    }
    
    // Восстанавливаем Properties используя restorePropertiesStructure
    const originalProps = originalTS?.Properties || {};
    const normalizedProps: Record<string, any> = {
        Name: normalizedTS.name
    };
    // Добавляем остальные свойства из normalizedTS, если они есть
    // (в normalizedTS могут быть другие свойства, которые нужно обработать)
    
    const restoredProps = restorePropertiesStructure(normalizedProps, originalProps);
    restored.Properties = restoredProps;
    
    const childObjects = restored.ChildObjects || (restored.ChildObjects = {});
    const originalAttrs = Array.isArray(childObjects.Attribute) ? childObjects.Attribute : 
                         (childObjects.Attribute ? [childObjects.Attribute] : []);
    
    const updatedAttrs: any[] = [];
    
    for (const normalizedAttr of normalizedTS.attributes) {
        const originalAttr = originalAttrs.find((a: any) => {
            const aProps = a.Properties || a;
            const existingName = aProps.Name || aProps.name || a.name;
            return existingName === normalizedAttr.name;
        });
        
        updatedAttrs.push(restoreAttributeStructure(normalizedAttr, originalAttr, formatTypeToXmlValue));
    }
    
    childObjects.Attribute = updatedAttrs;
    
    // Удаляем старые плоские поля
    delete restored.name;
    delete restored.Name;
    
    return restored;
}

