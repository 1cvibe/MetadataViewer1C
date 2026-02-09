/**
 * Парсер форм для редактора форм.
 * 
 * ВАЖНО: Теперь использует xmldom вместо fast-xml-parser для сохранения структуры XML.
 * Все функции парсинга перенесены в formParserXmldom.ts
 */

import { safeReadFile } from "../utils/fileUtils";

export interface ParsedFormObject {
    objectType: string;
    name: string;
    sourcePath: string;
    properties: Record<string, any>;
    attributes: any[];
    commands: any[];
    isForm: boolean; // Маркер что это форма
}

/**
 * Полная структура формы для редактора
 */
export interface ParsedFormFull {
    name: string;
    formType?: string;
    sourcePath: string;
    properties: Record<string, any>;
    attributes: FormAttribute[];
    commands: FormCommand[];
    childItems: FormItem[];
}

/**
 * Элемент формы (Group, InputField, Table, Button и т.д.)
 */
export interface FormItem {
    type: string; // Group, InputField, Table, Button и т.д.
    name?: string;
    id?: string;
    properties: Record<string, any>;
    childItems?: FormItem[];
}

/**
 * Реквизит формы
 */
export interface FormAttribute {
    name: string;
    /**
     * Тип реквизита в формате редактора типов данных (TypeWidget):
     * - примитив: { 'v8:Type': 'xs:decimal', 'v8:NumberQualifiers': { ... } }
     * - определяемый тип: { 'v8:TypeSet': 'cfg:DefinedType....' }
     * - составной тип: { Type: [{ Type: 'xs:string', StringQualifiers: {...} }, ...] }
     */
    type: any;
    typeDisplay?: string;
    properties: Record<string, any>;
}

/**
 * Команда формы
 */
export interface FormCommand {
    name: string;
    properties: Record<string, any>;
}

/**
 * Парсинг XML файла формы (Form.xml)
 * 
 * ВАЖНО: Теперь использует xmldom вместо fast-xml-parser для сохранения структуры XML.
 */
export async function parseFormXml(xmlPath: string): Promise<ParsedFormObject> {
    // Используем новый парсер на основе xmldom
    const { parseFormXmlFullXmldom } = await import('./formParserXmldom');
    const parsed = await parseFormXmlFullXmldom(xmlPath);
    
    // Преобразуем в ParsedFormObject
    // Для typeDisplay извлекаем из type структуры
    const getTypeDisplay = (typeValue: any): string => {
        if (!typeValue) return 'Unknown';
        if (typeof typeValue === 'string') return typeValue;
        if (typeValue['v8:Type']) return String(typeValue['v8:Type']);
        return 'Unknown';
    };
    
    return {
        objectType: "Form",
        name: parsed.name,
        sourcePath: parsed.sourcePath,
        properties: parsed.properties,
        attributes: parsed.attributes.map(attr => ({
            name: attr.name,
            type: { kind: getTypeDisplay(attr.type) },
            typeDisplay: getTypeDisplay(attr.type),
            properties: attr.properties
        })),
        commands: parsed.commands.map(cmd => ({
            name: cmd.name,
            properties: cmd.properties
        })),
        isForm: true
    };
}

/**
 * Полный парсинг XML файла формы для редактора (включая ChildItems)
 * 
 * ВАЖНО: Теперь использует xmldom вместо fast-xml-parser для сохранения структуры XML.
 */
export async function parseFormXmlFull(xmlPath: string): Promise<ParsedFormFull> {
    // Используем новый парсер на основе xmldom
    const { parseFormXmlFullXmldom } = await import('./formParserXmldom');
    const parsed = await parseFormXmlFullXmldom(xmlPath);
    
    // Удаляем служебные поля перед отправкой в webview (DOM документ не сериализуется)
    const { _originalXml, _domDocument, _rootAttrs, ...formData } = parsed;
    
    // Добавляем typeDisplay для атрибутов, если его нет
    const attributesWithDisplay = formData.attributes.map(attr => {
        if (attr.typeDisplay) return attr;
        // Извлекаем typeDisplay из type
        const getTypeDisplay = (typeValue: any): string => {
            if (!typeValue) return 'Unknown';
            if (typeof typeValue === 'string') return typeValue;
            if (typeValue['v8:Type']) return String(typeValue['v8:Type']);
            return 'Unknown';
        };
        return {
            ...attr,
            typeDisplay: getTypeDisplay(attr.type)
        };
    });
    
    return {
        ...formData,
        attributes: attributesWithDisplay
    };
}

/**
 * Проверка является ли файл формой
 */
export async function isFormFile(xmlPath: string): Promise<boolean> {
    try {
        const xml = await safeReadFile(xmlPath);
        return xml.includes('<Form xmlns=');
    } catch {
        return false;
    }
}
