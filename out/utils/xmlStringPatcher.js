"use strict";
/**
 * Утилита для применения изменений к XML строке с сохранением структуры
 *
 * Использует xmldom для точного сохранения структуры элементов и атрибутов
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyChangesToXmlString = void 0;
const xmlDomUtils_1 = require("./xmlDomUtils");
/**
 * Применяет изменения к исходному XML, сохраняя структуру элементов/атрибутов
 *
 * @param originalXml Исходный XML как строка
 * @param obj Объект с изменениями
 * @param xmlObjectType Тип объекта в XML (Document, Catalog и т.д.)
 * @returns Обновленный XML с сохранением структуры
 */
function applyChangesToXmlString(originalXml, obj, xmlObjectType) {
    // Используем xmldom для точного сохранения структуры XML
    return (0, xmlDomUtils_1.applyChangesToXmlStringWithDom)(originalXml, obj, xmlObjectType);
}
exports.applyChangesToXmlString = applyChangesToXmlString;
//# sourceMappingURL=xmlStringPatcher.js.map