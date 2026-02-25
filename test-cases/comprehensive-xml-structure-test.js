/**
 * Комплексный тест структуры XML для выявления всех различий
 */
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const file1 = path.join(__dirname, 'compare', 'Form1.xml');
const file2 = path.join(__dirname, 'compare', 'Form2.xml');

console.log('=== КОМПЛЕКСНЫЙ ТЕСТ СТРУКТУРЫ XML ===\n');
console.log(`Form1.xml: ${file1}`);
console.log(`Form2.xml: ${file2}\n`);

function parseXml(filePath) {
  const xml = fs.readFileSync(filePath, 'utf8');
  const parser = new DOMParser({
    errorHandler: {
      warning: (w) => console.warn(`[${path.basename(filePath)}] Warning:`, w),
      error: (e) => console.error(`[${path.basename(filePath)}] Error:`, e),
      fatalError: (e) => {
        console.error(`[${path.basename(filePath)}] Fatal:`, e);
        throw new Error(`XML parsing error: ${e}`);
      }
    }
  });

  let cleanXml = xml;
  if (xml.charCodeAt(0) === 0xFEFF) {
    cleanXml = xml.slice(1);
  }

  return { doc: parser.parseFromString(cleanXml, 'text/xml'), raw: xml };
}

function getAllElements(doc, parent = null) {
  const elements = [];
  const root = parent || doc.documentElement;
  
  function traverse(node) {
    if (node.nodeType === 1) { // ELEMENT_NODE
      const element = {
        tagName: node.tagName,
        attributes: {},
        children: [],
        textContent: node.textContent?.trim() || '',
        lineNumber: node.lineNumber || -1,
        columnNumber: node.columnNumber || -1
      };
      
      // Собираем атрибуты
      if (node.attributes) {
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          element.attributes[attr.name] = attr.value;
        }
      }
      
      // Собираем дочерние элементы
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === 1) {
          const childElement = traverse(child);
          element.children.push(childElement);
        }
      }
      
      elements.push(element);
      return element;
    }
    return null;
  }
  
  traverse(root);
  return elements;
}

function getElementPath(element, path = []) {
  const currentPath = [...path, element.tagName];
  if (element.children && element.children.length > 0) {
    return element.children.flatMap(child => getElementPath(child, currentPath));
  }
  return [currentPath.join('/')];
}

function compareStructures(doc1, doc2, label1, label2) {
  const elements1 = getAllElements(doc1);
  const elements2 = getAllElements(doc2);
  
  console.log(`\n=== СРАВНЕНИЕ СТРУКТУРЫ ===\n`);
  console.log(`${label1}: ${elements1.length} элементов`);
  console.log(`${label2}: ${elements2.length} элементов\n`);
  
  // Группируем по тегам
  const byTag1 = {};
  const byTag2 = {};
  
  elements1.forEach(el => {
    if (!byTag1[el.tagName]) {
      byTag1[el.tagName] = [];
    }
    byTag1[el.tagName].push(el);
  });
  
  elements2.forEach(el => {
    if (!byTag2[el.tagName]) {
      byTag2[el.tagName] = [];
    }
    byTag2[el.tagName].push(el);
  });
  
  // Проверяем количество элементов по тегам
  const allTags = new Set([...Object.keys(byTag1), ...Object.keys(byTag2)]);
  const differences = [];
  
  for (const tag of allTags) {
    const count1 = byTag1[tag]?.length || 0;
    const count2 = byTag2[tag]?.length || 0;
    
    if (count1 !== count2) {
      differences.push({
        tag,
        count1,
        count2,
        diff: count2 - count1
      });
    }
  }
  
  if (differences.length > 0) {
    console.log('❌ РАЗЛИЧИЯ В КОЛИЧЕСТВЕ ЭЛЕМЕНТОВ:\n');
    differences.forEach(diff => {
      console.log(`  <${diff.tag}>: ${diff.count1} → ${diff.count2} (${diff.diff > 0 ? '+' : ''}${diff.diff})`);
    });
  } else {
    console.log('✅ Количество элементов по тегам совпадает');
  }
  
  // Проверяем порядок элементов на корневом уровне
  const root1 = doc1.documentElement;
  const root2 = doc2.documentElement;
  
  const rootChildren1 = Array.from(root1.childNodes).filter(n => n.nodeType === 1).map(n => n.tagName);
  const rootChildren2 = Array.from(root2.childNodes).filter(n => n.nodeType === 1).map(n => n.tagName);
  
  console.log(`\n=== ПОРЯДОК КОРНЕВЫХ ЭЛЕМЕНТОВ ===\n`);
  console.log(`${label1}: ${rootChildren1.join(', ')}`);
  console.log(`${label2}: ${rootChildren2.join(', ')}\n`);
  
  if (JSON.stringify(rootChildren1) !== JSON.stringify(rootChildren2)) {
    console.log('❌ Порядок корневых элементов различается!\n');
    
    // Находим различия
    const maxLen = Math.max(rootChildren1.length, rootChildren2.length);
    for (let i = 0; i < maxLen; i++) {
      const tag1 = rootChildren1[i] || '(отсутствует)';
      const tag2 = rootChildren2[i] || '(отсутствует)';
      if (tag1 !== tag2) {
        console.log(`  Позиция ${i + 1}: ${tag1} → ${tag2}`);
      }
    }
  } else {
    console.log('✅ Порядок корневых элементов совпадает');
  }
  
  return { differences, rootChildren1, rootChildren2 };
}

function analyzeFormatting(xml1, xml2) {
  console.log(`\n=== АНАЛИЗ ФОРМАТИРОВАНИЯ ===\n`);
  
  const lines1 = xml1.split('\n');
  const lines2 = xml2.split('\n');
  
  console.log(`Form1.xml: ${lines1.length} строк`);
  console.log(`Form2.xml: ${lines2.length} строк`);
  console.log(`Разница: ${lines2.length - lines1.length} строк\n`);
  
  // Проверяем отступы
  const indentIssues = [];
  const maxLines = Math.min(lines1.length, lines2.length);
  
  for (let i = 0; i < maxLines; i++) {
    const line1 = lines1[i];
    const line2 = lines2[i];
    
    if (line1.trim() && line2.trim()) {
      const indent1 = line1.match(/^(\s*)/)?.[1]?.length || 0;
      const indent2 = line2.match(/^(\s*)/)?.[1]?.length || 0;
      
      if (indent1 !== indent2 && line1.trim() === line2.trim()) {
        indentIssues.push({
          line: i + 1,
          indent1,
          indent2,
          content: line1.trim().substring(0, 50)
        });
      }
    }
  }
  
  if (indentIssues.length > 0) {
    console.log(`❌ Найдено ${indentIssues.length} различий в отступах:\n`);
    indentIssues.slice(0, 20).forEach(issue => {
      console.log(`  Строка ${issue.line}: отступ ${issue.indent1} → ${issue.indent2} (${issue.content})`);
    });
    if (indentIssues.length > 20) {
      console.log(`  ... и еще ${indentIssues.length - 20} различий`);
    }
  } else {
    console.log('✅ Отступы совпадают');
  }
}

try {
  const { doc: doc1, raw: xml1 } = parseXml(file1);
  const { doc: doc2, raw: xml2 } = parseXml(file2);
  
  const comparison = compareStructures(doc1, doc2, 'Form1.xml', 'Form2.xml');
  analyzeFormatting(xml1, xml2);
  
  console.log('\n=== ИТОГОВЫЙ ДИАГНОЗ ===\n');
  if (comparison.differences.length > 0 || JSON.stringify(comparison.rootChildren1) !== JSON.stringify(comparison.rootChildren2)) {
    console.log('❌ НАЙДЕНЫ КРИТИЧЕСКИЕ РАЗЛИЧИЯ В СТРУКТУРЕ XML');
    console.log('   Требуется исправление кода сериализации.');
  } else {
    console.log('✅ Критических различий в структуре не обнаружено.');
  }
  
} catch (error) {
  console.error('\n❌ ОШИБКА:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
}

