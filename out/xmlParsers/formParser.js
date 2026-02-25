"use strict";
/**
 * Парсер форм для редактора форм.
 *
 * ВАЖНО: Теперь использует xmldom вместо fast-xml-parser для сохранения структуры XML.
 * Все функции парсинга перенесены в formParserXmldom.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFormFile = exports.parseFormXmlFull = exports.parseFormXml = void 0;
const fileUtils_1 = require("../utils/fileUtils");
/**
 * Парсинг XML файла формы (Form.xml)
 *
 * ВАЖНО: Теперь использует xmldom вместо fast-xml-parser для сохранения структуры XML.
 */
async function parseFormXml(xmlPath) {
    // Используем новый парсер на основе xmldom
    const { parseFormXmlFullXmldom } = await Promise.resolve().then(() => __importStar(require('./formParserXmldom')));
    const parsed = await parseFormXmlFullXmldom(xmlPath);
    // Преобразуем в ParsedFormObject
    // Для typeDisplay извлекаем из type структуры
    const getTypeDisplay = (typeValue) => {
        if (!typeValue)
            return 'Unknown';
        if (typeof typeValue === 'string')
            return typeValue;
        if (typeValue['v8:Type'])
            return String(typeValue['v8:Type']);
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
exports.parseFormXml = parseFormXml;
/**
 * Полный парсинг XML файла формы для редактора (включая ChildItems)
 *
 * ВАЖНО: Теперь использует xmldom вместо fast-xml-parser для сохранения структуры XML.
 */
async function parseFormXmlFull(xmlPath) {
    // Используем новый парсер на основе xmldom
    const { parseFormXmlFullXmldom } = await Promise.resolve().then(() => __importStar(require('./formParserXmldom')));
    const parsed = await parseFormXmlFullXmldom(xmlPath);
    // Удаляем служебные поля перед отправкой в webview (DOM документ не сериализуется)
    const { _originalXml, _domDocument, _rootAttrs, ...formData } = parsed;
    // Добавляем typeDisplay для атрибутов, если его нет
    const attributesWithDisplay = formData.attributes.map(attr => {
        if (attr.typeDisplay)
            return attr;
        // Извлекаем typeDisplay из type
        const getTypeDisplay = (typeValue) => {
            if (!typeValue)
                return 'Unknown';
            if (typeof typeValue === 'string')
                return typeValue;
            if (typeValue['v8:Type'])
                return String(typeValue['v8:Type']);
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
exports.parseFormXmlFull = parseFormXmlFull;
/**
 * Проверка является ли файл формой
 */
async function isFormFile(xmlPath) {
    try {
        const xml = await (0, fileUtils_1.safeReadFile)(xmlPath);
        return xml.includes('<Form xmlns=');
    }
    catch {
        return false;
    }
}
exports.isFormFile = isFormFile;
//# sourceMappingURL=formParser.js.map