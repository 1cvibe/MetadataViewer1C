/**
 * Скрипт для генерации отчета на основе результатов анализа
 */

import * as fs from 'fs';
import * as path from 'path';

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

function formatPropertyList(properties: PropertyInfo[]): string {
    const specificProps = properties.filter(p => 
        !['Name', 'Synonym', 'Comment', 'UseStandardCommands'].includes(p.name)
    );
    
    if (specificProps.length === 0) {
        return '- Нет специфичных свойств (используются только базовые)';
    }
    
    return specificProps.map(prop => {
        const typeStr = prop.types.join(' | ');
        const required = prop.isRequired ? ' (обязательное)' : '';
        const array = prop.isArray ? ' (массив)' : '';
        const multilingual = prop.isMultilingual ? ' (многоязычное)' : '';
        return `  - \`${prop.name}\` (тип: ${typeStr}${required}${array}${multilingual})`;
    }).join('\n');
}

async function main() {
    console.log('[generate-report] Генерация отчета...');

    // Загружаем результаты анализа
    const analysisPath = path.join(__dirname, 'analysis-results.json');
    if (!fs.existsSync(analysisPath)) {
        console.error(`[generate-report] Файл ${analysisPath} не найден!`);
        process.exit(1);
    }

    const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    const results: Record<string, AnalysisResult> = analysisData.results;

    // Читаем шаблон отчета
    const reportTemplatePath = path.join(__dirname, '..', 'reports', 'schema-extension-report.md');
    let report = fs.readFileSync(reportTemplatePath, 'utf-8');

    // Обновляем сводку
    const totalTypes = Object.keys(results).length;
    const totalObjects = Object.values(results).reduce((sum, r) => sum + r.analyzedCount, 0);
    const totalSchemas = totalTypes;
    const totalProperties = Object.values(results).reduce((sum, r) => {
        const specificProps = r.properties.filter(p => 
            !['Name', 'Synonym', 'Comment', 'UseStandardCommands'].includes(p.name)
        );
        return sum + specificProps.length;
    }, 0);

    report = report.replace(/\[будет заполнено после анализа\]/g, (match, offset) => {
        const context = report.substring(Math.max(0, offset - 50), offset + 50);
        if (context.includes('Всего проанализировано типов объектов')) {
            return totalTypes.toString();
        } else if (context.includes('Всего проанализировано объектов')) {
            return totalObjects.toString();
        } else if (context.includes('Всего добавлено схем')) {
            return totalSchemas.toString();
        } else if (context.includes('Всего добавлено свойств')) {
            return totalProperties.toString();
        }
        return match;
    });

    // Обновляем дату
    report = report.replace(/Дата создания:.*/, `Дата создания: ${new Date().toLocaleDateString('ru-RU')}`);

    // Обновляем детали по каждому типу
    for (const [objectType, result] of Object.entries(results)) {
        const sectionStart = report.indexOf(`### ${objectType}`);
        if (sectionStart === -1) continue;

        const sectionEnd = report.indexOf('### ', sectionStart + 1);
        const section = sectionEnd === -1 
            ? report.substring(sectionStart)
            : report.substring(sectionStart, sectionEnd);

        // Обновляем количество объектов
        const updatedSection = section
            .replace(/\*\*Количество проанализированных объектов:\*\* \d+/, 
                `**Количество проанализированных объектов:** ${result.analyzedCount}`)
            .replace(/\[Список будет заполнен после анализа\]/, formatPropertyList(result.properties))
            .replace(/\[список или "нет"\]/g, (match, offset) => {
                const context = section.substring(Math.max(0, offset - 100), offset + 100);
                if (context.includes('Добавленные атрибуты')) {
                    return result.hasAttributes ? 'Да (используется attributeSchema)' : 'нет';
                } else if (context.includes('Добавленные табличные части')) {
                    return result.hasTabularSections ? 'Да (используется tabularSectionSchema)' : 'нет';
                } else if (context.includes('Добавленные формы')) {
                    return result.hasForms ? 'Да (используется formSchema)' : 'нет';
                } else if (context.includes('Добавленные команды')) {
                    return result.hasCommands ? 'Да (используется commandSchema)' : 'нет';
                }
                return match;
            });

        report = report.replace(section, updatedSection);
    }

    // Сохраняем обновленный отчет
    fs.writeFileSync(reportTemplatePath, report, 'utf-8');
    console.log(`[generate-report] Отчет обновлен: ${reportTemplatePath}`);
}

if (require.main === module) {
    main().catch(error => {
        console.error('[generate-report] Критическая ошибка:', error);
        process.exit(1);
    });
}
