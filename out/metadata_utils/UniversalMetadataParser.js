"use strict";
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
exports.relativeTo = exports.toMetadataKey = exports.parseMetadataObject = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fast_xml_parser_1 = require("fast-xml-parser");
const UnicodeName_1 = require("./UnicodeName");
const PredefinedXmlParser_1 = require("./PredefinedXmlParser");
/** Создаем XML парсер с настройками под формат выгрузки 1С. */
function createParser() {
    return new fast_xml_parser_1.XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        textNodeName: "text",
        allowBooleanAttributes: true,
        preserveOrder: false
    });
}
/** Убираем префиксы пространств имен из ключа (xr:, xsi:, v8:, cfg: и т.д.) */
function stripNs(key) {
    const idx = key.indexOf(":");
    return idx === -1 ? key : key.slice(idx + 1);
}
function cleanNsDeep(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj !== "object")
        return obj;
    if (Array.isArray(obj))
        return obj.map(cleanNsDeep);
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (k.startsWith("@"))
            continue; // служебные
        out[stripNs(k)] = cleanNsDeep(v);
    }
    return out;
}
/** Превращает <Properties> в плоский словарь без ns-префиксов. */
function parseProperties(node) {
    if (!node || typeof node !== "object")
        return {};
    const cleaned = cleanNsDeep(node);
    const out = {};
    for (const [k, v] of Object.entries(cleaned)) {
        if (k === "text")
            continue;
        // Упрощение примитивов
        out[k] = unwrapText(v);
    }
    return out;
}
function unwrapText(v) {
    if (v === null || v === undefined)
        return v;
    if (typeof v !== "object")
        return v;
    if (Array.isArray(v))
        return v.map(unwrapText);
    // fast-xml-parser может давать {text: "..."} для текстовых узлов
    if (Object.keys(v).length === 1 && "text" in v)
        return v.text;
    return v;
}
/** Пытаемся определить логическое имя объекта. */
function detectObjectName(objNode, fallbackFromFile) {
    const props = objNode?.Properties;
    const tryVal = (x) => (typeof x === "string" && x.trim() ? x.trim() : undefined);
    const byProps = tryVal(props?.Name) || tryVal(props?.name);
    return byProps || tryVal(objNode?.name) || fallbackFromFile;
}
/**
 * Универсальный парсинг MetaDataObject/*.xml в обобщенную модель.
 * Цель: максимальное покрытие — мы сохраняем raw и properties для любого неизвестного узла.
 */
async function parseMetadataObject(ref) {
    const xml = await fs.promises.readFile(ref.mainXmlPath, "utf8");
    const parser = createParser();
    const j = parser.parse(xml);
    const meta = j?.MetaDataObject;
    if (!meta || typeof meta !== "object") {
        throw new Error(`Invalid metadata in ${ref.mainXmlPath}: no <MetaDataObject>`);
    }
    const topKeys = Object.keys(meta).filter(k => k !== "@_xmlns" && !k.startsWith("@"));
    if (topKeys.length === 0) {
        throw new Error(`Invalid metadata in ${ref.mainXmlPath}: empty MetaDataObject`);
    }
    const objectType = stripNs(topKeys[0]);
    const objNode = meta[topKeys[0]];
    const name = detectObjectName(objNode, ref.displayName);
    const properties = parseProperties(objNode?.Properties);
    // Важно: внутри TabularSection/Form/Command/и т.п. могут быть вложенные ChildObjects.
    // Для максимального покрытия делаем рекурсивный (но ограниченный) обход.
    const members = parseChildObjectsDeep(objNode?.ChildObjects);
    // быстрые срезы
    // Для максимального покрытия учитываем типовые варианты названий реквизитов в разных объектах
    const attributeKinds = new Set(["Attribute", "Dimension", "Resource", "Measure", "AccountingFlag", "Characteristic", "Requisite"]);
    const attributes = members.filter(m => attributeKinds.has(m.kind));
    const tabularSections = members.filter(m => m.kind === "TabularSection");
    const forms = members.filter(m => m.kind === "Form");
    const commands = members.filter(m => m.kind === "Command");
    const templates = members.filter(m => m.kind === "Template" || m.kind === "Layout");
    const parsed = {
        objectType,
        objectTypeDir: ref.objectTypeDir,
        name,
        displayName: (0, UnicodeName_1.decode1CUnicodeEscapes)(name),
        sourcePath: ref.mainXmlPath,
        properties,
        members,
        attributes: attributes.length ? attributes : undefined,
        tabularSections: tabularSections.length ? tabularSections : undefined,
        forms: forms.length ? forms : undefined,
        commands: commands.length ? commands : undefined,
        templates: templates.length ? templates : undefined,
        predefined: ref.predefinedXmlPath ? await (0, PredefinedXmlParser_1.parsePredefinedXml)(ref.predefinedXmlPath) : undefined
    };
    return parsed;
}
exports.parseMetadataObject = parseMetadataObject;
function parseChildObjectsDeep(childObjectsNode) {
    if (!childObjectsNode || typeof childObjectsNode !== "object")
        return [];
    const cleaned = cleanNsDeep(childObjectsNode);
    // Мы flatten'им иерархию: так проще искать и строить diff.
    // При этом сохраняем путь до узла.
    const members = [];
    const MAX_DEPTH = 5;
    const MAX_MEMBERS = 50000;
    const pushNode = (kind, n, pathSegs) => {
        if (members.length >= MAX_MEMBERS)
            return;
        const props = parseProperties(n?.Properties);
        const name = (typeof props.Name === "string" && props.Name) ||
            (typeof n?.Name === "string" ? n.Name : undefined) ||
            (typeof n?.name === "string" ? n.name : undefined);
        members.push({
            kind,
            name,
            path: pathSegs,
            properties: Object.keys(props).length ? props : undefined,
            raw: n
        });
    };
    const walk = (node, parentPath, depth) => {
        if (!node || typeof node !== "object")
            return;
        if (depth > MAX_DEPTH)
            return;
        if (members.length >= MAX_MEMBERS)
            return;
        const obj = cleanNsDeep(node);
        for (const [kindRaw, value] of Object.entries(obj)) {
            const kind = stripNs(kindRaw);
            const arr = Array.isArray(value) ? value : [value];
            let idx = 0;
            for (const n of arr) {
                if (!n || typeof n !== "object")
                    continue;
                const props = parseProperties(n.Properties);
                const name = (typeof props.Name === "string" && props.Name) ||
                    (typeof n.Name === "string" ? n.Name : undefined) ||
                    (typeof n.name === "string" ? n.name : undefined) ||
                    String(idx);
                const myPath = [...parentPath, kind, name];
                pushNode(kind, n, myPath);
                // Рекурсивно парсим вложенные ChildObjects, если они есть.
                if (n.ChildObjects) {
                    walk(n.ChildObjects, [...myPath, "ChildObjects"], depth + 1);
                }
                idx++;
            }
        }
    };
    walk(cleaned, ["ChildObjects"], 0);
    return members;
}
/** Вспомогательная утилита для формирования ссылки на объект по пути (например для UI). */
function toMetadataKey(obj) {
    const typePart = obj.objectTypeDir || obj.objectType;
    return `${typePart}/${obj.name}`;
}
exports.toMetadataKey = toMetadataKey;
/** Пытается вывести relative-путь от корня выгрузки — удобно для логов. */
function relativeTo(root, filePath) {
    return path.relative(root, filePath).replace(/\\/g, "/");
}
exports.relativeTo = relativeTo;
//# sourceMappingURL=UniversalMetadataParser.js.map