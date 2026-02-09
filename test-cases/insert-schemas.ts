/**
 * Скрипт для вставки сгенерированных схем в objectSchemas.ts
 */

import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const compactSchemasPath = path.join(__dirname, 'compact-schemas-code.txt');
    const objectSchemasPath = path.join(__dirname, '..', 'src', 'schemas', 'objectSchemas.ts');

    // Читаем файл со схемами
    const compactSchemas = fs.readFileSync(compactSchemasPath, 'utf-8');
    
    // Извлекаем все схемы до комментария "// Обновите objectTypeSchemas:"
    const schemasEndIndex = compactSchemas.indexOf('// Обновите objectTypeSchemas:');
    if (schemasEndIndex === -1) {
        console.error('Не найден маркер "// Обновите objectTypeSchemas:" в файле');
        process.exit(1);
    }
    
    // Пропускаем первые 4 строки (комментарии)
    const lines = compactSchemas.substring(0, schemasEndIndex).split('\n');
    const schemasOnly = lines.slice(4).join('\n').trim();
    
    // Читаем objectSchemas.ts
    let objectSchemasContent = fs.readFileSync(objectSchemasPath, 'utf-8');
    
    // Находим место для вставки (перед objectTypeSchemas)
    const insertMarker = '// ============================================\n// Автоматически сгенерированные схемы\n// ============================================\n\n// Схемы будут добавлены здесь из scripts/compact-schemas-code.txt';
    
    if (objectSchemasContent.includes(insertMarker)) {
        // Заменяем маркер на реальные схемы
        objectSchemasContent = objectSchemasContent.replace(
            insertMarker,
            schemasOnly
        );
    } else {
        // Ищем место перед objectTypeSchemas
        const objectTypeSchemasIndex = objectSchemasContent.indexOf('export const objectTypeSchemas');
        if (objectTypeSchemasIndex === -1) {
            console.error('Не найдено место для вставки схем');
            process.exit(1);
        }
        
        // Вставляем схемы перед objectTypeSchemas
        objectSchemasContent = objectSchemasContent.substring(0, objectTypeSchemasIndex) +
            schemasOnly + '\n\n' +
            objectSchemasContent.substring(objectTypeSchemasIndex);
    }
    
    // Обновляем objectTypeSchemas
    const objectTypeSchemasMatch = compactSchemas.match(/export const objectTypeSchemas: Record<string, JSONSchema7> = \{([\s\S]*?)\};/);
    if (objectTypeSchemasMatch) {
        const newObjectTypeSchemas = objectTypeSchemasMatch[0];
        const oldObjectTypeSchemasMatch = objectSchemasContent.match(/export const objectTypeSchemas: Record<string, JSONSchema7> = \{[\s\S]*?\};/);
        if (oldObjectTypeSchemasMatch) {
            objectSchemasContent = objectSchemasContent.replace(
                oldObjectTypeSchemasMatch[0],
                newObjectTypeSchemas
            );
        }
    }
    
    // Сохраняем обновленный файл
    fs.writeFileSync(objectSchemasPath, objectSchemasContent, 'utf-8');
    console.log(`[insert-schemas] Схемы успешно добавлены в ${objectSchemasPath}`);
}

if (require.main === module) {
    main().catch(error => {
        console.error('[insert-schemas] Критическая ошибка:', error);
        process.exit(1);
    });
}
