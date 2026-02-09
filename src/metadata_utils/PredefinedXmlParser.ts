import * as fs from "fs";
import { XMLParser } from "fast-xml-parser";
import type { MetadataMember } from "./UniversalMetadataParser";

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
export async function parsePredefinedXml(predefinedXmlPath: string): Promise<MetadataMember[]> {
  try {
    // BOM в UTF-8 встречается часто
    let xml = await fs.promises.readFile(predefinedXmlPath, "utf8");
    if (xml.charCodeAt(0) === 0xfeff) xml = xml.slice(1);

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      textNodeName: "text",
      allowBooleanAttributes: true,
      preserveOrder: false
    });

    const j: any = parser.parse(xml);
    const root = j?.PredefinedData || j?.Predefined || j;
    const itemsNode =
      root?.Item ||
      root?.Items?.Item ||
      root?.PredefinedItems?.Item ||
      root?.Items ||
      null;

    const items = itemsNode ? (Array.isArray(itemsNode) ? itemsNode : [itemsNode]) : [];

    return items
      .filter((it: any) => it && typeof it === "object")
      .map((it: any, idx: number) => {
        const props: Record<string, any> = {};

        // Атрибуты item (например id)
        for (const [k, v] of Object.entries(it)) {
          if (k.startsWith("@")) continue;
          if (k === "text") continue;
          props[stripNs(k)] = unwrap(v);
        }
        // fast-xml-parser кладет атрибуты в поле вида { id: '...' } при attributeNamePrefix: ''
        // но иногда это может быть '@_id' в зависимости от версии/настроек.
        if (typeof (it as any).id === "string") props.id = (it as any).id;
        if (typeof (it as any)["@_id"] === "string") props.id = (it as any)["@_id"];

        const name =
          (typeof props.Name === "string" && props.Name) ||
          (typeof props.name === "string" && props.name) ||
          (typeof (it as any).Name === "string" ? (it as any).Name : undefined) ||
          String(idx);

        return {
          kind: "PredefinedItem",
          name,
          path: ["Ext", "Predefined", name],
          properties: props,
          raw: it
        } satisfies MetadataMember;
      });
  } catch {
    return [];
  }
}

function unwrap(v: any): any {
  if (v === null || v === undefined) return v;
  if (typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(unwrap);
  if (Object.keys(v).length === 1 && "text" in v) return (v as any).text;
  // убираем ns-префиксы у ключей
  const out: any = {};
  for (const [k, vv] of Object.entries(v)) out[stripNs(k)] = unwrap(vv);
  return out;
}

function stripNs(key: string): string {
  const idx = key.indexOf(":");
  return idx === -1 ? key : key.slice(idx + 1);
}
