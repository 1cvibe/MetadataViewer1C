/**
 * Парсер СКД (DataCompositionSchema) для «Редактор СКД» на основе xmldom.
 *
 * ВАЖНО: Используется xmldom (а не fast-xml-parser) для сохранения структуры XML.
 *
 * Источник данных:
 * - Report XML: <Properties><MainDataCompositionSchema> = Report.<Name>.Template.<TemplateName>
 * - Само содержимое СКД лежит в: Reports/<ReportName>/Templates/<TemplateName>/Ext/Template.xml
 */

import * as fs from 'fs';
import * as path from 'path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

export type ParsedDcsNode = {
  /** Путь в дереве, например "0.1.2" (как в редакторе форм) */
  path: string;
  tag: string;
  /** Атрибуты узла */
  attrs: Record<string, any>;
  /** Текстовое содержимое (если есть) */
  text?: string;
  /** Дочерние элементы (строго в порядке XML) */
  children: ParsedDcsNode[];
  /** Ссылка на оригинальный DOM элемент (для обратного обновления) 
   * ВАЖНО: Не сериализуется в JSON! Используется только внутри парсера. */
  _domElement?: Element;
};

export interface ParsedDcsSchema {
  /** Путь к Template.xml */
  sourcePath: string;
  /** Корневой тег (обычно DataCompositionSchema) */
  rootTag: string;
  /** Дети корня */
  children: ParsedDcsNode[];
  /** Исходный XML Template.xml (для сохранения структуры при записи) */
  _originalXml: string;
  /** DOM документ (вместо _raw с preserveOrder) */
  _domDocument: Document;
  /** Атрибуты корневого элемента (включая xmlns) */
  _rootAttrs?: Record<string, any>;
}

export interface ParsedReportDcs {
  reportName: string;
  reportPath: string;
  templateName: string;
  templatePath: string;
  mainRef: string;
  schema: ParsedDcsSchema;
  /** Исходный XML Report.xml (для потенциального обновления MainDataCompositionSchema) */
  _originalReportXml: string;
}

function safeReadFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function createDomParser(): DOMParser {
  return new DOMParser({
    locator: {},
    errorHandler: {
      warning: (w: any) => console.warn('[xmldom DCS] Warning:', w),
      error: (e: any) => console.error('[xmldom DCS] Error:', e),
      fatalError: (e: any) => {
        console.error('[xmldom DCS] Fatal error:', e);
        throw new Error(`XML parsing error: ${e}`);
      }
    }
  });
}

/**
 * Извлекает атрибуты элемента в объект
 */
function extractAttributes(element: Element): Record<string, any> {
  const attrs: Record<string, any> = {};
  if (element.attributes) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      // Сохраняем namespace атрибутов с префиксом @_
      attrs[`@_${attr.name}`] = attr.value;
    }
  }
  return attrs;
}

/**
 * Рекурсивно строит ParsedDcsNode дерево из DOM элемента
 */
function buildNodeFromElement(element: Element, nodePath: string): ParsedDcsNode {
  const tag = element.tagName;
  const attrs = extractAttributes(element);
  
  // Собираем текстовое содержимое (только прямые текстовые узлы, не вложенные)
  let text = '';
  const children: ParsedDcsNode[] = [];
  
  let childIndex = 0;
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    
    // Текстовые узлы
    if (child.nodeType === 3) { // TEXT_NODE
      const textContent = child.textContent || '';
      if (textContent.trim()) {
        text += textContent;
      }
    }
    
    // Элементы
    else if (child.nodeType === 1) { // ELEMENT_NODE
      const childPath = nodePath ? `${nodePath}.${childIndex}` : `${childIndex}`;
      const childNode = buildNodeFromElement(child as Element, childPath);
      children.push(childNode);
      childIndex++;
    }
    
    // CDATA, комментарии игнорируем (сохраняются в DOM)
  }
  
  return {
    path: nodePath,
    tag,
    attrs,
    text: text.trim() || undefined,
    children,
    _domElement: element,
  };
}

/**
 * Парсит Template.xml в структуру ParsedDcsSchema
 */
function parseTemplateXml(templateXml: string, templatePath: string): ParsedDcsSchema {
  // Удаляем BOM если есть
  let cleanXml = templateXml;
  if (templateXml.charCodeAt(0) === 0xFEFF) {
    cleanXml = templateXml.slice(1);
  }
  
  const parser = createDomParser();
  const doc = parser.parseFromString(cleanXml, 'text/xml');
  
  // Проверяем на ошибки парсинга
  const parserError = doc.getElementsByTagName('parsererror');
  if (parserError.length > 0) {
    throw new Error(`XML parsing error in ${templatePath}: ${parserError[0].textContent}`);
  }
  
  const rootElement = doc.documentElement;
  if (!rootElement) {
    throw new Error(`No root element in ${templatePath}`);
  }
  
  const rootTag = rootElement.tagName;
  const rootAttrs = extractAttributes(rootElement);
  
  // Строим дерево из детей корневого элемента
  const children: ParsedDcsNode[] = [];
  let childIndex = 0;
  for (let i = 0; i < rootElement.childNodes.length; i++) {
    const child = rootElement.childNodes[i];
    if (child.nodeType === 1) { // ELEMENT_NODE
      const childPath = `${childIndex}`;
      const childNode = buildNodeFromElement(child as Element, childPath);
      children.push(childNode);
      childIndex++;
    }
  }
  
  return {
    sourcePath: templatePath,
    rootTag,
    children,
    _originalXml: templateXml,
    _domDocument: doc,
    _rootAttrs: rootAttrs,
  };
}

function parseTemplateNameFromMainRef(mainRef: string): string {
  const s = String(mainRef || '').trim();
  const idx = s.lastIndexOf('.Template.');
  if (idx >= 0) return s.slice(idx + '.Template.'.length);
  const idx2 = s.indexOf('Template.');
  if (idx2 >= 0) return s.slice(idx2 + 'Template.'.length);
  return '';
}

function resolveTemplateXmlPath(sourceRoot: string, reportName: string, templateName: string): string {
  const reportDir = path.join(sourceRoot, 'Reports', reportName);
  const candidate1 = path.join(reportDir, 'Templates', templateName, 'Ext', 'Template.xml');
  if (fs.existsSync(candidate1)) return candidate1;
  const candidate2 = path.join(reportDir, 'Templates', `${templateName}.xml`);
  if (fs.existsSync(candidate2)) return candidate2;
  // fallback: первый Template.xml в Templates
  const templatesDir = path.join(reportDir, 'Templates');
  if (fs.existsSync(templatesDir)) {
    const found = findFirstFileByName(templatesDir, 'Template.xml');
    if (found) return found;
  }
  throw new Error(`Не найден Template.xml для отчета ${reportName} / шаблона ${templateName}`);
}

function findFirstFileByName(rootDir: string, fileName: string): string | null {
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop()!;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && e.name === fileName) return full;
    }
  }
  return null;
}

/**
 * Парсит Report.xml и Template.xml для редактора СКД
 */
/**
 * Рекурсивно удаляет _domElement из узлов (для сериализации в JSON)
 * ВАЖНО: DOM элементы содержат циклические ссылки и не могут быть сериализованы
 */
function removeDomElements(node: ParsedDcsNode): ParsedDcsNode {
  const cleaned: ParsedDcsNode = {
    path: node.path,
    tag: node.tag,
    attrs: node.attrs,
    text: node.text,
    children: node.children.map(child => removeDomElements(child)),
    // _domElement НЕ копируем!
  };
  return cleaned;
}

export async function parseReportXmlForDcs(sourceRoot: string, reportXmlPath: string): Promise<ParsedReportDcs> {
  const reportXml = safeReadFile(reportXmlPath);
  
  // Парсим Report.xml, чтобы найти MainDataCompositionSchema
  const parser = createDomParser();
  const reportDoc = parser.parseFromString(reportXml, 'text/xml');
  
  // Ищем Report/Properties/Name
  const nameElement = reportDoc.getElementsByTagName('Name')[0];
  const reportName = nameElement?.textContent?.trim() || 
    path.basename(reportXmlPath, path.extname(reportXmlPath));
  
  // Ищем Report/Properties/MainDataCompositionSchema
  const mainRefElement = reportDoc.getElementsByTagName('MainDataCompositionSchema')[0];
  const mainRef = mainRefElement?.textContent?.trim() || '';
  
  const templateName = parseTemplateNameFromMainRef(mainRef);
  if (!templateName) {
    throw new Error(`Отчет ${reportName}: не найден/не распознан MainDataCompositionSchema`);
  }

  const templatePath = resolveTemplateXmlPath(sourceRoot, reportName, templateName);
  const templateXml = safeReadFile(templatePath);
  
  const schema = parseTemplateXml(templateXml, templatePath);

  // ВАЖНО: Удаляем _domElement из children перед отправкой в webview
  // DOM элементы содержат циклические ссылки и не могут быть сериализованы в JSON
  const cleanedChildren = schema.children.map(child => removeDomElements(child));

  return {
    reportName,
    reportPath: reportXmlPath,
    templateName,
    templatePath,
    mainRef,
    schema: {
      ...schema,
      children: cleanedChildren,
    },
    _originalReportXml: reportXml,
  };
}

