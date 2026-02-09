/**
 * Скрипт для генерации JSON Schema схем на основе результатов анализа
 */

import * as fs from 'fs';
import * as path from 'path';
import { JSONSchema7 } from 'json-schema';
import { basePropertiesSchema, multilingualFieldSchema, standardAttributesSchema, typeSchema } from '../src/schemas/baseSchema';

// Определяем схемы локально, так как они не экспортированы
const attributeSchema: JSONSchema7 = {
  type: 'object',
  title: 'Реквизит',
  properties: {
    ...basePropertiesSchema.properties,
    Type: typeSchema,
    StandardAttributes: standardAttributesSchema,
    FillValue: {
      oneOf: [
        { type: 'null' },
        { type: 'string' },
        { type: 'number' }
      ],
      title: 'Значение заполнения'
    },
    ChoiceParameterLinks: {
      type: 'object',
      title: 'Связи параметров выбора'
    },
    ChoiceParameters: {
      type: 'object',
      title: 'Параметры выбора'
    }
  },
  required: ['Name']
};

const tabularSectionSchema: JSONSchema7 = {
  type: 'object',
  title: 'Табличная часть',
  properties: {
    ...basePropertiesSchema.properties,
    attributes: {
      type: 'array',
      title: 'Реквизиты',
      items: attributeSchema
    }
  },
  required: ['Name']
};

const formSchema: JSONSchema7 = {
  type: 'object',
  title: 'Форма',
  properties: {
    ...basePropertiesSchema.properties,
    AuxiliaryForm: {
      type: 'string',
      title: 'Вспомогательная форма'
    },
    DefaultForm: {
      type: 'string',
      title: 'Форма по умолчанию'
    }
  },
  required: ['Name']
};

const commandSchema: JSONSchema7 = {
  type: 'object',
  title: 'Команда',
  properties: {
    ...basePropertiesSchema.properties
  },
  required: ['Name']
};

interface PropertyInfo {
    name: string;
    types: string[];
    isRequired: boolean;
    isArray: boolean;
    isMultilingual: boolean;
    examples: any[];
}

interface AnalysisResult {
    objectType: string;
    analyzedCount: number;
    properties: PropertyInfo[];
    hasAttributes: boolean;
    hasTabularSections: boolean;
    hasForms: boolean;
    hasCommands: boolean;
    hasDimensions: boolean;
    hasResources: boolean;
    hasMeasures: boolean;
    errors: string[];
}

/**
 * Создает JSON Schema для свойства на основе анализа
 */
function createPropertySchema(prop: PropertyInfo): JSONSchema7 {
    const schema: JSONSchema7 = {
        title: prop.name
    };

    // Многоязычные поля
    if (prop.isMultilingual) {
        return multilingualFieldSchema;
    }

    // Массивы
    if (prop.isArray) {
        const itemTypes = prop.types.filter(t => !t.startsWith('array<'));
        if (itemTypes.length > 0) {
            const itemType = itemTypes[0];
            if (itemType === 'object') {
                schema.type = 'array';
                schema.items = { type: 'object' };
            } else if (itemType === 'string') {
                schema.type = 'array';
                schema.items = { type: 'string' };
            } else {
                schema.type = 'array';
                schema.items = { type: itemType as any };
            }
        } else {
            schema.type = 'array';
            schema.items = {};
        }
        return schema;
    }

    // Определяем основной тип
    const mainTypes = prop.types.filter(t => t !== 'null' && t !== 'multilingual' && !t.startsWith('array<'));
    
    if (mainTypes.length === 0) {
        schema.type = 'string'; // По умолчанию
    } else if (mainTypes.length === 1) {
        const type = mainTypes[0];
        if (type === 'object') {
            schema.type = 'object';
            schema.properties = {};
        } else if (type === 'string' && prop.examples.some(e => e === 'true' || e === 'false')) {
            // Булево значение, сохраненное как строка
            schema.oneOf = [
                { type: 'string', enum: ['true', 'false'] },
                { type: 'boolean' }
            ];
        } else {
            schema.type = type as any;
        }
    } else {
        // Несколько типов - используем oneOf
        schema.oneOf = mainTypes.map(t => {
            if (t === 'object') {
                return { type: 'object' };
            }
            return { type: t as any };
        });
    }

    return schema;
}

/**
 * Создает схему для типа объекта
 */
function createObjectSchema(result: AnalysisResult): JSONSchema7 {
    const schema: JSONSchema7 = {
        type: 'object',
        title: result.objectType,
        properties: {
            ...basePropertiesSchema.properties
        },
        required: ['Name']
    };

    // Добавляем специфичные свойства
    for (const prop of result.properties) {
        // Пропускаем базовые свойства (они уже есть в basePropertiesSchema)
        if (['Name', 'Synonym', 'Comment', 'UseStandardCommands'].includes(prop.name)) {
            continue;
        }

        schema.properties![prop.name] = createPropertySchema(prop);
        
        if (prop.isRequired) {
            if (!schema.required) {
                schema.required = ['Name'];
            }
            schema.required.push(prop.name);
        }
    }

    // Добавляем общие элементы
    if (result.hasAttributes) {
        schema.properties!['attributes'] = {
            type: 'array',
            title: 'Реквизиты',
            items: attributeSchema
        };
    }

    if (result.hasTabularSections) {
        schema.properties!['tabularSections'] = {
            type: 'array',
            title: 'Табличные части',
            items: tabularSectionSchema
        };
    }

    if (result.hasForms) {
        schema.properties!['forms'] = {
            type: 'array',
            title: 'Формы',
            items: formSchema
        };
    }

    if (result.hasCommands) {
        schema.properties!['commands'] = {
            type: 'array',
            title: 'Команды',
            items: commandSchema
        };
    }

    // Специфичные элементы для регистров
    if (result.hasDimensions || result.hasResources) {
        // Dimensions и Resources обрабатываются как attributes с childObjectKind
        // Они уже включены в hasAttributes
    }

    return schema;
}

/**
 * Главная функция генерации схем
 */
async function main() {
    console.log('[generate-schemas] Начало генерации схем...');

    // Загружаем результаты анализа
    const analysisPath = path.join(__dirname, 'analysis-results.json');
    if (!fs.existsSync(analysisPath)) {
        console.error(`[generate-schemas] Файл ${analysisPath} не найден!`);
        console.error('[generate-schemas] Сначала запустите scripts/analyze-schemas.ts');
        process.exit(1);
    }

    const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    const results: Record<string, AnalysisResult> = analysisData.results;

    // Генерируем схемы
    const schemas: Record<string, JSONSchema7> = {};
    const schemaExports: string[] = [];
    const objectTypeSchemasEntries: string[] = [];

    for (const [objectType, result] of Object.entries(results)) {
        console.log(`[generate-schemas] Генерация схемы для ${objectType}...`);
        
        const schema = createObjectSchema(result as AnalysisResult);
        schemas[objectType] = schema;

        // Формируем имя экспорта
        const schemaName = `${objectType.charAt(0).toLowerCase() + objectType.slice(1)}Schema`;
        schemaExports.push(`export const ${schemaName}: JSONSchema7 = ${JSON.stringify(schema, null, 2)};`);
        objectTypeSchemasEntries.push(`  ${objectType}: ${schemaName},`);
    }

    // Сохраняем схемы в отдельный файл для проверки
    const schemasOutputPath = path.join(__dirname, 'generated-schemas.json');
    fs.writeFileSync(schemasOutputPath, JSON.stringify(schemas, null, 2), 'utf-8');
    console.log(`[generate-schemas] Схемы сохранены в ${schemasOutputPath}`);

    // Генерируем код для вставки в objectSchemas.ts
    const codeOutputPath = path.join(__dirname, 'schemas-code.txt');
    const codeOutput = [
        '// Автоматически сгенерированные схемы',
        '// Вставьте этот код в src/schemas/objectSchemas.ts',
        '',
        ...schemaExports,
        '',
        '// Обновите objectTypeSchemas:',
        'export const objectTypeSchemas: Record<string, JSONSchema7> = {',
        '  Document: documentSchema,',
        '  Catalog: catalogSchema,',
        '  Enum: enumSchema,',
        '  Form: formObjectSchema,',
        ...objectTypeSchemasEntries,
        '};'
    ].join('\n');

    fs.writeFileSync(codeOutputPath, codeOutput, 'utf-8');
    console.log(`[generate-schemas] Код для вставки сохранен в ${codeOutputPath}`);
    console.log(`[generate-schemas] Всего сгенерировано схем: ${Object.keys(schemas).length}`);
}

// Запуск
if (require.main === module) {
    main().catch(error => {
        console.error('[generate-schemas] Критическая ошибка:', error);
        process.exit(1);
    });
}

export { createObjectSchema, createPropertySchema };
