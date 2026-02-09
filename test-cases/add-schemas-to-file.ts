/**
 * Скрипт для добавления сгенерированных схем в objectSchemas.ts
 * Создает компактные схемы, используя существующие вспомогательные схемы
 */

import * as fs from 'fs';
import * as path from 'path';
import { JSONSchema7 } from 'json-schema';
import { basePropertiesSchema, multilingualFieldSchema } from '../src/schemas/baseSchema';

// Импортируем существующие схемы (они будут использованы как шаблоны)
const attributeSchemaRef = 'attributeSchema';
const tabularSectionSchemaRef = 'tabularSectionSchema';
const formSchemaRef = 'formSchema';
const commandSchemaRef = 'commandSchema';

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
 * Создает компактную схему для свойства
 */
function createCompactPropertySchema(prop: PropertyInfo): string {
    // Пропускаем базовые свойства
    if (['Name', 'Synonym', 'Comment', 'UseStandardCommands'].includes(prop.name)) {
        return '';
    }

    // Многоязычные поля
    if (prop.isMultilingual) {
        return `    ${prop.name}: multilingualFieldSchema,`;
    }

    // Массивы объектов
    if (prop.isArray) {
        const itemTypes = prop.types.filter(t => !t.startsWith('array<'));
        if (itemTypes.includes('object')) {
            return `    ${prop.name}: {\n      type: 'array',\n      title: '${prop.name}',\n      items: { type: 'object' }\n    },`;
        }
        return `    ${prop.name}: {\n      type: 'array',\n      title: '${prop.name}',\n      items: { type: 'string' }\n    },`;
    }

    // Простые типы
    const mainTypes = prop.types.filter(t => t !== 'null' && t !== 'multilingual' && !t.startsWith('array<'));
    
    if (mainTypes.length === 0) {
        return `    ${prop.name}: { type: 'string', title: '${prop.name}' },`;
    }

    const type = mainTypes[0];
    
    // Булево значение как строка
    if (type === 'string' && prop.examples.some(e => e === 'true' || e === 'false')) {
        return `    ${prop.name}: {\n      type: 'string',\n      title: '${prop.name}',\n      enum: ['true', 'false'],\n      default: 'false'\n    },`;
    }

    // Enum значения
    if (type === 'string' && prop.examples.length > 0 && prop.examples.every(e => typeof e === 'string' && e.length > 0)) {
        const uniqueExamples = [...new Set(prop.examples.filter(e => e && e !== ''))].slice(0, 10);
        if (uniqueExamples.length > 1 && uniqueExamples.length <= 10) {
            return `    ${prop.name}: {\n      type: 'string',\n      title: '${prop.name}',\n      enum: ${JSON.stringify(uniqueExamples)}\n    },`;
        }
    }

    // Простые типы
    if (type === 'object') {
        return `    ${prop.name}: { type: 'object', title: '${prop.name}' },`;
    }

    return `    ${prop.name}: { type: '${type}', title: '${prop.name}' },`;
}

/**
 * Создает схему для типа объекта
 */
function createCompactSchema(result: AnalysisResult): string {
    const schemaName = `${result.objectType.charAt(0).toLowerCase() + result.objectType.slice(1)}Schema`;
    const title = result.objectType;
    
    let schema = `/**\n * Схема для ${title}\n */\nexport const ${schemaName}: JSONSchema7 = {\n  type: 'object',\n  title: '${title}',\n  properties: {\n    ...basePropertiesSchema.properties,`;

    // Добавляем специфичные свойства
    const specificProps: string[] = [];
    for (const prop of result.properties) {
        const propSchema = createCompactPropertySchema(prop);
        if (propSchema) {
            specificProps.push(propSchema);
        }
    }

    if (specificProps.length > 0) {
        schema += '\n' + specificProps.join('\n');
    }

    // Добавляем общие элементы
    if (result.hasAttributes) {
        schema += `\n    attributes: {\n      type: 'array',\n      title: 'Реквизиты',\n      items: ${attributeSchemaRef}\n    },`;
    }

    if (result.hasTabularSections) {
        schema += `\n    tabularSections: {\n      type: 'array',\n      title: 'Табличные части',\n      items: ${tabularSectionSchemaRef}\n    },`;
    }

    if (result.hasForms) {
        schema += `\n    forms: {\n      type: 'array',\n      title: 'Формы',\n      items: ${formSchemaRef}\n    },`;
    }

    if (result.hasCommands) {
        schema += `\n    commands: {\n      type: 'array',\n      title: 'Команды',\n      items: ${commandSchemaRef}\n    },`;
    }

    schema += '\n  },\n  required: [\'Name\']\n};';

    return schema;
}

/**
 * Главная функция
 */
async function main() {
    console.log('[add-schemas-to-file] Начало генерации компактных схем...');

    // Загружаем результаты анализа
    const analysisPath = path.join(__dirname, 'analysis-results.json');
    if (!fs.existsSync(analysisPath)) {
        console.error(`[add-schemas-to-file] Файл ${analysisPath} не найден!`);
        process.exit(1);
    }

    const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    const results: Record<string, AnalysisResult> = analysisData.results;

    // Генерируем схемы
    const schemas: string[] = [];
    const objectTypeSchemasEntries: string[] = [];

    for (const [objectType, result] of Object.entries(results)) {
        console.log(`[add-schemas-to-file] Генерация схемы для ${objectType}...`);
        
        const schema = createCompactSchema(result as AnalysisResult);
        schemas.push(schema);

        const schemaName = `${objectType.charAt(0).toLowerCase() + objectType.slice(1)}Schema`;
        objectTypeSchemasEntries.push(`  ${objectType}: ${schemaName},`);
    }

    // Сохраняем код для вставки
    const codeOutputPath = path.join(__dirname, 'compact-schemas-code.txt');
    const codeOutput = [
        '// Автоматически сгенерированные компактные схемы',
        '// Вставьте этот код в src/schemas/objectSchemas.ts перед objectTypeSchemas',
        '',
        ...schemas,
        '',
        '// Обновите objectTypeSchemas:',
        'export const objectTypeSchemas: Record<string, JSONSchema7> = {',
        '  Document: documentSchema,',
        '  Catalog: catalogSchema,',
        '  Enum: enumSchema,',
        '  Form: formObjectSchema,',
        ...objectTypeSchemasEntries,
        '};'
    ].join('\n\n');

    fs.writeFileSync(codeOutputPath, codeOutput, 'utf-8');
    console.log(`[add-schemas-to-file] Компактные схемы сохранены в ${codeOutputPath}`);
    console.log(`[add-schemas-to-file] Всего сгенерировано схем: ${schemas.length}`);
}

// Запуск
if (require.main === module) {
    main().catch(error => {
        console.error('[add-schemas-to-file] Критическая ошибка:', error);
        process.exit(1);
    });
}
