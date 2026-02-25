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
exports.parsePredefinedXml = void 0;
const fs = __importStar(require("fs"));
const fast_xml_parser_1 = require("fast-xml-parser");
/**
 * Парсер Ext/Predefined.xml.
 *
 * Формат в выгрузке 1С обычно:
 * <PredefinedData ...>
 *   <Item id="...">
 *     <Name>...</Name>
 *     <IsFolder>true/false</IsFolder>
 *     ...произвольные поля...
 *   </Item>
 * </PredefinedData>
 *
 * Цель: максимальное покрытие — сохраняем все поля в properties, не пытаясь типизировать.
 */
async function parsePredefinedXml(predefinedXmlPath) {
    try {
        // BOM в UTF-8 встречается часто
        let xml = await fs.promises.readFile(predefinedXmlPath, "utf8");
        if (xml.charCodeAt(0) === 0xfeff)
            xml = xml.slice(1);
        const parser = new fast_xml_parser_1.XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            textNodeName: "text",
            allowBooleanAttributes: true,
            preserveOrder: false
        });
        const j = parser.parse(xml);
        const root = j?.PredefinedData || j?.Predefined || j;
        const itemsNode = root?.Item ||
            root?.Items?.Item ||
            root?.PredefinedItems?.Item ||
            root?.Items ||
            null;
        const items = itemsNode ? (Array.isArray(itemsNode) ? itemsNode : [itemsNode]) : [];
        return items
            .filter((it) => it && typeof it === "object")
            .map((it, idx) => {
            const props = {};
            // Атрибуты item (например id)
            for (const [k, v] of Object.entries(it)) {
                if (k.startsWith("@"))
                    continue;
                if (k === "text")
                    continue;
                props[stripNs(k)] = unwrap(v);
            }
            // fast-xml-parser кладет атрибуты в поле вида { id: '...' } при attributeNamePrefix: ''
            // но иногда это может быть '@_id' в зависимости от версии/настроек.
            if (typeof it.id === "string")
                props.id = it.id;
            if (typeof it["@_id"] === "string")
                props.id = it["@_id"];
            const name = (typeof props.Name === "string" && props.Name) ||
                (typeof props.name === "string" && props.name) ||
                (typeof it.Name === "string" ? it.Name : undefined) ||
                String(idx);
            return {
                kind: "PredefinedItem",
                name,
                path: ["Ext", "Predefined", name],
                properties: props,
                raw: it
            };
        });
    }
    catch {
        return [];
    }
}
exports.parsePredefinedXml = parsePredefinedXml;
function unwrap(v) {
    if (v === null || v === undefined)
        return v;
    if (typeof v !== "object")
        return v;
    if (Array.isArray(v))
        return v.map(unwrap);
    if (Object.keys(v).length === 1 && "text" in v)
        return v.text;
    // убираем ns-префиксы у ключей
    const out = {};
    for (const [k, vv] of Object.entries(v))
        out[stripNs(k)] = unwrap(vv);
    return out;
}
function stripNs(key) {
    const idx = key.indexOf(":");
    return idx === -1 ? key : key.slice(idx + 1);
}
//# sourceMappingURL=PredefinedXmlParser.js.map