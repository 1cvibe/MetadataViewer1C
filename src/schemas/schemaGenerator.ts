/**
 * Генератор JSON Schema на основе XML структуры
 * Автоматически создает схемы для неизвестных типов объектов
 */

import { JSONSchema7 } from 'json-schema';
import { basePropertiesSchema } from './baseSchema';
import { getSchemaForObjectType } from './objectSchemas';

/**
 * Кэш сгенерированных схем
 */
const schemaCache = new Map<string, JSONSchema7>();

/**
 * Рекурсивно генерирует JSON Schema из объекта
 */
function generateSchemaFromObject(obj: any, path: string = ''): JSONSchema7 {
  if (obj === null || obj === undefined) {
    return { type: 'null' };
  }

  if (typeof obj === 'string') {
    return { type: 'string' };
  }

  if (typeof obj === 'number') {
    return { type: 'number' };
  }

  if (typeof obj === 'boolean') {
    return { type: 'boolean' };
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return { type: 'array', items: {} };
    }
    // Берем схему первого элемента
    const itemSchema = generateSchemaFromObject(obj[0], `${path}[]`);
    return {
      type: 'array',
      items: itemSchema
    };
  }

  if (typeof obj === 'object') {
    const properties: Record<string, JSONSchema7> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      // Пропускаем служебные поля
      if (key.startsWith('@') || key === 'text' || key === '#text') {
        continue;
      }

      const cleanKey = key.includes(':') ? key.split(':')[1] : key;
      const valuePath = path ? `${path}.${cleanKey}` : cleanKey;

      // Специальная обработка для известных полей
      if (cleanKey === 'Name') {
        properties[cleanKey] = { type: 'string', title: 'Имя' };
        required.push(cleanKey);
        continue;
      }

      if (cleanKey === 'Synonym' || cleanKey === 'Comment' || cleanKey === 'ToolTip') {
        properties[cleanKey] = {
          oneOf: [
            { type: 'string' },
            {
              type: 'object',
              properties: {
                'v8:item': {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      'v8:lang': { type: 'string' },
                      'v8:content': { type: 'string' }
                    }
                  }
                }
              }
            }
          ],
          title: cleanKey === 'Synonym' ? 'Синоним' : cleanKey === 'Comment' ? 'Комментарий' : 'Подсказка'
        };
        continue;
      }

      // Рекурсивно генерируем схему для вложенных объектов
      properties[cleanKey] = generateSchemaFromObject(value, valuePath);
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined
    };
  }

  return { type: 'string' };
}

/**
 * Генерирует JSON Schema для объекта метаданных на основе его XML структуры
 */
export function generateSchema(objectType: string, xmlData: any): JSONSchema7 {
  const cacheKey = `${objectType}:${JSON.stringify(Object.keys(xmlData.properties || {}).sort())}`;
  
  // Проверяем кэш
  if (schemaCache.has(cacheKey)) {
    return schemaCache.get(cacheKey)!;
  }

  // Пытаемся получить готовую схему
  let schema = getSchemaForObjectType(objectType);

  // Если схемы нет, генерируем автоматически
  if (schema === basePropertiesSchema && xmlData.properties) {
    const generatedSchema = generateSchemaFromObject(xmlData.properties);
    schema = {
      ...basePropertiesSchema,
      properties: {
        ...basePropertiesSchema.properties,
        ...generatedSchema.properties
      }
    };
  }

  // Кэшируем результат
  schemaCache.set(cacheKey, schema);

  return schema;
}

/**
 * Очистить кэш схем
 */
export function clearSchemaCache(): void {
  schemaCache.clear();
}

