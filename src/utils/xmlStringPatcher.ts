/**
 * Утилита для применения изменений к XML строке с сохранением структуры
 * 
 * Использует xmldom для точного сохранения структуры элементов и атрибутов
 */

import type { ParsedMetadataObject } from "../xmlParsers/metadataParser";
import { applyChangesToXmlStringWithDom } from "./xmlDomUtils";

/**
 * Применяет изменения к исходному XML, сохраняя структуру элементов/атрибутов
 * 
 * @param originalXml Исходный XML как строка
 * @param obj Объект с изменениями
 * @param xmlObjectType Тип объекта в XML (Document, Catalog и т.д.)
 * @returns Обновленный XML с сохранением структуры
 */
export function applyChangesToXmlString(
    originalXml: string,
    obj: ParsedMetadataObject,
    xmlObjectType: string
): string {
    // Используем xmldom для точного сохранения структуры XML
    return applyChangesToXmlStringWithDom(originalXml, obj, xmlObjectType);
}
