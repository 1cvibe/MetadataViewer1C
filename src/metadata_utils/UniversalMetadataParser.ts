import * as path from "path";
import * as fs from "fs";
import { XMLParser } from "fast-xml-parser";
import { decode1CUnicodeEscapes } from "./UnicodeName";
import type { MetadataFileRef } from "./MetadataScanner";
import { parsePredefinedXml } from "./PredefinedXmlParser";

export interface TypeRef {
  kind: string;
  details?: any;
}

export interface MetadataMember {
  kind: string; // Attribute | TabularSection | Form | Command | Template | ...
  name?: string;
  /** Путь в иерархии (для UI/поиска/дифа): ["ChildObjects","TabularSection","Товары","Attribute","Номенклатура", ...] */
  path?: string[];
  properties?: Record<string, any>;
  /** сырые данные узла (на случай если properties не хватает) */
  raw?: any;
}

export interface ParsedMetadataObject {
  objectType: string;          // Catalog, Document, Subsystem, ...
  objectTypeDir?: string;      // Catalogs, Documents, ...
  name: string;                // логическое имя (по возможности из Properties.Name)
  displayName: string;         // декодированное для UI
  sourcePath: string;          // путь к основному XML
  properties: Record<string, any>;
  members: MetadataMember[];   // универсальный список дочерних элементов
  /** быстрые индексы по часто используемым секциям */
  attributes?: MetadataMember[];
  tabularSections?: MetadataMember[];
  forms?: MetadataMember[];
  commands?: MetadataMember[];
  templates?: MetadataMember[];
  predefined?: MetadataMember[]; // предопределенные элементы (если Ext/Predefined.xml)
}

/** Создаем XML парсер с настройками под формат выгрузки 1С. */
function createParser(): XMLParser {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "text",
    allowBooleanAttributes: true,
    preserveOrder: false
  });
}

/** Убираем префиксы пространств имен из ключа (xr:, xsi:, v8:, cfg: и т.д.) */
function stripNs(key: string): string {
  const idx = key.indexOf(":");
  return idx === -1 ? key : key.slice(idx + 1);
}

function cleanNsDeep(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanNsDeep);
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("@")) continue; // служебные
    out[stripNs(k)] = cleanNsDeep(v);
  }
  return out;
}

/** Превращает <Properties> в плоский словарь без ns-префиксов. */
function parseProperties(node: any): Record<string, any> {
  if (!node || typeof node !== "object") return {};
  const cleaned = cleanNsDeep(node);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(cleaned)) {
    if (k === "text") continue;
    // Упрощение примитивов
    out[k] = unwrapText(v);
  }
  return out;
}

function unwrapText(v: any): any {
  if (v === null || v === undefined) return v;
  if (typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(unwrapText);
  // fast-xml-parser может давать {text: "..."} для текстовых узлов
  if (Object.keys(v).length === 1 && "text" in v) return (v as any).text;
  return v;
}

/** Пытаемся определить логическое имя объекта. */
function detectObjectName(objNode: any, fallbackFromFile: string): string {
  const props = objNode?.Properties;
  const tryVal = (x: any) => (typeof x === "string" && x.trim() ? x.trim() : undefined);
  const byProps = tryVal(props?.Name) || tryVal(props?.name);
  return byProps || tryVal(objNode?.name) || fallbackFromFile;
}

/**
 * Универсальный парсинг MetaDataObject/*.xml в обобщенную модель.
 * Цель: максимальное покрытие — мы сохраняем raw и properties для любого неизвестного узла.
 */
export async function parseMetadataObject(ref: MetadataFileRef): Promise<ParsedMetadataObject> {
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

  const parsed: ParsedMetadataObject = {
    objectType,
    objectTypeDir: ref.objectTypeDir,
    name,
    displayName: decode1CUnicodeEscapes(name),
    sourcePath: ref.mainXmlPath,
    properties,
    members,
    attributes: attributes.length ? attributes : undefined,
    tabularSections: tabularSections.length ? tabularSections : undefined,
    forms: forms.length ? forms : undefined,
    commands: commands.length ? commands : undefined,
    templates: templates.length ? templates : undefined,
    predefined: ref.predefinedXmlPath ? await parsePredefinedXml(ref.predefinedXmlPath) : undefined
  };

  return parsed;
}

function parseChildObjectsDeep(childObjectsNode: any): MetadataMember[] {
  if (!childObjectsNode || typeof childObjectsNode !== "object") return [];

  const cleaned = cleanNsDeep(childObjectsNode);

  // Мы flatten'им иерархию: так проще искать и строить diff.
  // При этом сохраняем путь до узла.
  const members: MetadataMember[] = [];

  const MAX_DEPTH = 5;
  const MAX_MEMBERS = 50_000;

  const pushNode = (kind: string, n: any, pathSegs: string[]) => {
    if (members.length >= MAX_MEMBERS) return;
    const props = parseProperties(n?.Properties);
    const name =
      (typeof props.Name === "string" && props.Name) ||
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

  const walk = (node: any, parentPath: string[], depth: number) => {
    if (!node || typeof node !== "object") return;
    if (depth > MAX_DEPTH) return;
    if (members.length >= MAX_MEMBERS) return;

    const obj = cleanNsDeep(node);
    for (const [kindRaw, value] of Object.entries(obj)) {
      const kind = stripNs(kindRaw);
      const arr = Array.isArray(value) ? value : [value];
      let idx = 0;
      for (const n of arr) {
        if (!n || typeof n !== "object") continue;
        const props = parseProperties((n as any).Properties);
        const name =
          (typeof props.Name === "string" && props.Name) ||
          (typeof (n as any).Name === "string" ? (n as any).Name : undefined) ||
          (typeof (n as any).name === "string" ? (n as any).name : undefined) ||
          String(idx);

        const myPath = [...parentPath, kind, name];
        pushNode(kind, n, myPath);

        // Рекурсивно парсим вложенные ChildObjects, если они есть.
        if ((n as any).ChildObjects) {
          walk((n as any).ChildObjects, [...myPath, "ChildObjects"], depth + 1);
        }
        idx++;
      }
    }
  };

  walk(cleaned, ["ChildObjects"], 0);
  return members;
}

/** Вспомогательная утилита для формирования ссылки на объект по пути (например для UI). */
export function toMetadataKey(obj: ParsedMetadataObject): string {
  const typePart = obj.objectTypeDir || obj.objectType;
  return `${typePart}/${obj.name}`;
}

/** Пытается вывести relative-путь от корня выгрузки — удобно для логов. */
export function relativeTo(root: string, filePath: string): string {
  return path.relative(root, filePath).replace(/\\/g, "/");
}
