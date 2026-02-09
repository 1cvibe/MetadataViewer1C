/**
 * Сериализация дерева СКД обратно в XML с сохранением структуры через xmldom.
 *
 * ВАЖНО: Используется xmldom (а не fast-xml-parser) для сохранения структуры XML.
 */

import { XMLSerializer } from '@xmldom/xmldom';
import type { ParsedDcsNode } from './dcsParserXmldom';

/**
 * Обновляет DOM документ на основе изменений в дереве ParsedDcsNode
 * 
 * @param doc - DOM документ для обновления
 * @param rootElement - корневой элемент (<DataCompositionSchema>)
 * @param newChildren - новое дерево детей
 */
export function updateDomFromNodes(
  doc: Document,
  rootElement: Element,
  newChildren: ParsedDcsNode[]
): void {
  // ВАЖНО: Удаляем ВСЕ дочерние узлы (включая текстовые)
  // чтобы создать чистую структуру без лишних пустых строк
  while (rootElement.firstChild) {
    rootElement.removeChild(rootElement.firstChild);
  }
  
  // Добавляем начальный перенос строки
  rootElement.appendChild(doc.createTextNode('\n'));
  
  // Добавляем новые элементы
  for (const childNode of newChildren) {
    // Отступ (1 табуляция для корневых элементов)
    rootElement.appendChild(doc.createTextNode('\t'));
    
    // Сам элемент
    const element = createElementFromNode(doc, childNode, 1);
    rootElement.appendChild(element);
    
    // Перенос строки после элемента
    rootElement.appendChild(doc.createTextNode('\n'));
  }
}

/**
 * Рекурсивно создает DOM элемент из ParsedDcsNode
 * 
 * @param doc - DOM документ
 * @param node - узел для преобразования
 * @param depth - текущий уровень вложенности (для отступов)
 */
function createElementFromNode(doc: Document, node: ParsedDcsNode, depth: number): Element {
  // Создаем элемент (может содержать namespace prefix)
  const element = doc.createElement(node.tag);
  
  // Устанавливаем атрибуты
  for (const [key, value] of Object.entries(node.attrs || {})) {
    // Убираем префикс @_ который мы добавили при парсинге
    const attrName = key.startsWith('@_') ? key.slice(2) : key;
    element.setAttribute(attrName, String(value));
  }
  
  // Если есть дочерние элементы
  if (node.children && node.children.length > 0) {
    // Добавляем перенос строки после открывающего тега
    element.appendChild(doc.createTextNode('\n'));
    
    // Отступ для детей (depth + 1 табуляций)
    const childIndent = '\t'.repeat(depth + 1);
    
    for (const child of node.children) {
      // Отступ перед элементом
      element.appendChild(doc.createTextNode(childIndent));
      
      // Сам элемент (рекурсивно)
      const childElement = createElementFromNode(doc, child, depth + 1);
      element.appendChild(childElement);
      
      // Перенос строки после элемента
      element.appendChild(doc.createTextNode('\n'));
    }
    
    // Отступ перед закрывающим тегом (depth табуляций)
    element.appendChild(doc.createTextNode('\t'.repeat(depth)));
  }
  // Если нет детей, но есть текст
  else if (node.text) {
    element.appendChild(doc.createTextNode(node.text));
  }
  
  return element;
}

/**
 * Сериализует DOM документ обратно в XML строку с BOM
 * 
 * @param doc - DOM документ
 * @returns XML строка (без BOM - BOM добавляется при сохранении файла)
 */
export function serializeDomToXml(doc: Document): string {
  const serializer = new XMLSerializer();
  let xml = serializer.serializeToString(doc);
  
  // Проверяем, есть ли уже <?xml ?> декларация
  if (!xml.startsWith('<?xml')) {
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
  }
  
  // xmldom иногда удваивает декларацию, исправляем
  xml = xml.replace(/^(<\?xml[^>]+\?>)\s*(<\?xml[^>]+\?>)/, '$1');
  
  return xml;
}

/**
 * Основная функция сериализации: обновляет DOM и сериализует в XML
 * 
 * @param doc - исходный DOM документ
 * @param rootTag - имя корневого тега (обычно DataCompositionSchema)
 * @param newChildren - новое дерево детей
 * @param rootAttrs - атрибуты корневого элемента (включая xmlns)
 * @returns XML строка
 */
export function serializeToXml(
  doc: Document,
  rootTag: string,
  newChildren: ParsedDcsNode[],
  rootAttrs?: Record<string, any>
): string {
  // Клонируем документ, чтобы не изменять оригинал
  const newDoc = doc.cloneNode(true) as Document;
  const rootElement = newDoc.documentElement;
  
  if (!rootElement || rootElement.tagName !== rootTag) {
    throw new Error(`Expected root tag ${rootTag}, got ${rootElement?.tagName}`);
  }
  
  // Обновляем атрибуты корневого элемента (если переданы)
  if (rootAttrs) {
    // Сначала удаляем все атрибуты, кроме xmlns (они могут быть важны)
    const attrsToRemove: string[] = [];
    if (rootElement.attributes) {
      for (let i = 0; i < rootElement.attributes.length; i++) {
        const attr = rootElement.attributes[i];
        if (!attr.name.startsWith('xmlns')) {
          attrsToRemove.push(attr.name);
        }
      }
    }
    attrsToRemove.forEach(name => rootElement.removeAttribute(name));
    
    // Добавляем новые атрибуты
    for (const [key, value] of Object.entries(rootAttrs)) {
      const attrName = key.startsWith('@_') ? key.slice(2) : key;
      rootElement.setAttribute(attrName, String(value));
    }
  }
  
  // Обновляем содержимое
  updateDomFromNodes(newDoc, rootElement, newChildren);
  
  // Сериализуем
  return serializeDomToXml(newDoc);
}

