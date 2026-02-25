/**
 * Комплексная проверка форматирования всех элементов XML
 */
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const file1 = path.join(__dirname, 'compare', 'Form1.xml');
const file2 = path.join(__dirname, 'compare', 'Form2.xml');

console.log('=== Комплексная проверка форматирования всех элементов ===\n');

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

function getElementIndent(xml, elementIndex) {
  const beforeElement = xml.substring(0, elementIndex);
  const lastNewline = beforeElement.lastIndexOf('\n');
  if (lastNewline < 0) return '';
  const lineBefore = beforeElement.substring(lastNewline + 1);
  const match = lineBefore.match(/^(\s*)/);
  return match ? match[1] : '';
}

function analyzeElementFormatting(xml, elementName, label) {
  console.log(`\n=== ${label}: ${elementName} ===\n`);
  
  const regex = new RegExp(`<${elementName}([^>]*)>`, 'g');
  const matches = [];
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    const elementIndex = match.index;
    const indent = getElementIndent(xml, elementIndex);
    const indentCount = indent.length;
    const indentType = indent.includes('\t') ? 'tab' : (indent.includes(' ') ? 'space' : 'none');
    
    // Находим закрывающий тег
    const tagContent = match[0];
    const isSelfClosing = tagContent.endsWith('/>');
    
    let closeIndex = -1;
    if (!isSelfClosing) {
      const closeTag = `</${elementName}>`;
      closeIndex = xml.indexOf(closeTag, elementIndex + tagContent.length);
    }
    
    // Проверяем содержимое
    let hasChildren = false;
    let childrenCount = 0;
    let firstChildIndent = '';
    
    if (closeIndex > 0) {
      const content = xml.substring(elementIndex + tagContent.length, closeIndex);
      const trimmedContent = content.trim();
      hasChildren = trimmedContent.length > 0;
      
      if (hasChildren) {
        // Проверяем, есть ли дочерние элементы (не только текст)
        const childElementRegex = /<(\w+)[^>]*>/g;
        const childMatches = [];
        let childMatch;
        while ((childMatch = childElementRegex.exec(content)) !== null) {
          childMatches.push({
            name: childMatch[1],
            index: childMatch.index,
            indent: getElementIndent(content, childMatch.index)
          });
        }
        
        childrenCount = childMatches.length;
        if (childMatches.length > 0) {
          firstChildIndent = childMatches[0].indent;
        }
      }
    }
    
    matches.push({
      index: elementIndex,
      indent: indent,
      indentCount: indentCount,
      indentType: indentType,
      isSelfClosing: isSelfClosing,
      hasChildren: hasChildren,
      childrenCount: childrenCount,
      firstChildIndent: firstChildIndent,
      firstChildIndentCount: firstChildIndent.length
    });
  }
  
  if (matches.length === 0) {
    console.log(`  Элемент ${elementName} не найден`);
    return [];
  }
  
  console.log(`  Найдено элементов: ${matches.length}`);
  
  matches.forEach((m, idx) => {
    console.log(`\n  Элемент ${idx + 1}:`);
    console.log(`    Отступ: ${m.indentCount} символов (${m.indentType})`);
    console.log(`    Самозакрывающийся: ${m.isSelfClosing ? 'да' : 'нет'}`);
    if (!m.isSelfClosing) {
      console.log(`    Есть дочерние элементы: ${m.hasChildren ? 'да' : 'нет'}`);
      if (m.hasChildren) {
        console.log(`    Количество дочерних элементов: ${m.childrenCount}`);
        if (m.firstChildIndentCount > 0) {
          console.log(`    Отступ первого дочернего элемента: ${m.firstChildIndentCount} символов`);
          console.log(`    Ожидаемый отступ: ${m.indentCount + 1} символов`);
          if (m.firstChildIndentCount !== m.indentCount + 1) {
            console.log(`    ⚠️  НЕПРАВИЛЬНЫЙ ОТСТУП! Должно быть ${m.indentCount + 1}, а фактически ${m.firstChildIndentCount}`);
          }
        }
      }
    }
  });
  
  return matches;
}

function compareElementFormatting(matches1, matches2, elementName) {
  console.log(`\n=== Сравнение ${elementName} ===\n`);
  
  if (matches1.length !== matches2.length) {
    console.log(`  ⚠️  Разное количество элементов: ${matches1.length} → ${matches2.length}`);
  }
  
  const minLen = Math.min(matches1.length, matches2.length);
  for (let i = 0; i < minLen; i++) {
    const m1 = matches1[i];
    const m2 = matches2[i];
    
    if (m1.indentCount !== m2.indentCount) {
      console.log(`  Элемент ${i + 1}: отступ ${m1.indentCount} → ${m2.indentCount} ${m1.indentCount !== m2.indentCount ? '❌' : ''}`);
    }
    
    if (m1.firstChildIndentCount !== m2.firstChildIndentCount) {
      console.log(`  Элемент ${i + 1}: отступ первого дочернего ${m1.firstChildIndentCount} → ${m2.firstChildIndentCount} ${m1.firstChildIndentCount !== m2.firstChildIndentCount ? '❌' : ''}`);
    }
  }
}

try {
  const data1 = parseXml(file1);
  const data2 = parseXml(file2);
  
  // Проверяем основные элементы
  const elementsToCheck = [
    'Form',
    'AutoTime',
    'UsePostingMode',
    'RepostOnWrite',
    'AutoCommandBar',
    'Events',
    'Event',
    'ChildItems',
    'UsualGroup',
    'InputField',
    'Attributes',
    'Attribute',
    'Commands',
    'Command',
    'CommandInterface'
  ];
  
  console.log('=== АНАЛИЗ Form1.xml ===\n');
  const results1 = {};
  for (const elem of elementsToCheck) {
    results1[elem] = analyzeElementFormatting(data1.raw, elem, `Form1: ${elem}`);
  }
  
  console.log('\n\n=== АНАЛИЗ Form2.xml ===\n');
  const results2 = {};
  for (const elem of elementsToCheck) {
    results2[elem] = analyzeElementFormatting(data2.raw, elem, `Form2: ${elem}`);
  }
  
  console.log('\n\n=== СРАВНЕНИЕ ===\n');
  for (const elem of elementsToCheck) {
    compareElementFormatting(results1[elem] || [], results2[elem] || [], elem);
  }
  
  // Детальная проверка AutoCommandBar
  console.log('\n\n=== ДЕТАЛЬНАЯ ПРОВЕРКА AutoCommandBar ===\n');
  
  const autoCmdBar1 = data1.raw.match(/<AutoCommandBar[^>]*>[\s\S]*?<\/AutoCommandBar>/);
  const autoCmdBar2 = data2.raw.match(/<AutoCommandBar[^>]*>[\s\S]*?<\/AutoCommandBar>/);
  
  if (autoCmdBar1 && autoCmdBar2) {
    console.log('Form1 AutoCommandBar:');
    console.log(autoCmdBar1[0].substring(0, 200));
    console.log('\nForm2 AutoCommandBar:');
    console.log(autoCmdBar2[0].substring(0, 200));
    
    // Проверяем дочерние элементы AutoCommandBar
    const childElements1 = autoCmdBar1[0].match(/<(\w+)[^>]*>/g) || [];
    const childElements2 = autoCmdBar2[0].match(/<(\w+)[^>]*>/g) || [];
    
    console.log(`\nДочерних элементов в AutoCommandBar:`);
    console.log(`  Form1: ${childElements1.length - 1}`); // -1 для самого AutoCommandBar
    console.log(`  Form2: ${childElements2.length - 1}`);
    
    if (childElements1.length !== childElements2.length) {
      console.log(`  ⚠️  Разное количество дочерних элементов!`);
    }
  }
  
  // Детальная проверка вложенных ChildItems
  console.log('\n\n=== ДЕТАЛЬНАЯ ПРОВЕРКА ВЛОЖЕННЫХ ChildItems ===\n');
  
  const childItemsMatches1 = data1.raw.matchAll(/<ChildItems[^>]*>([\s\S]*?)<\/ChildItems>/g);
  const childItemsMatches2 = data2.raw.matchAll(/<ChildItems[^>]*>([\s\S]*?)<\/ChildItems>/g);
  
  const ci1Array = Array.from(childItemsMatches1);
  const ci2Array = Array.from(childItemsMatches2);
  
  console.log(`Найдено ChildItems:`);
  console.log(`  Form1: ${ci1Array.length}`);
  console.log(`  Form2: ${ci2Array.length}`);
  
  const minCI = Math.min(ci1Array.length, ci2Array.length);
  for (let i = 0; i < minCI; i++) {
    const ci1 = ci1Array[i][1];
    const ci2 = ci2Array[i][1];
    
    // Находим первый дочерний элемент
    const firstChild1 = ci1.match(/^\s*(<(\w+)[^>]*>)/m);
    const firstChild2 = ci2.match(/^\s*(<(\w+)[^>]*>)/m);
    
    if (firstChild1 && firstChild2) {
      const indent1 = firstChild1[0].match(/^(\s*)/)?.[1] || '';
      const indent2 = firstChild2[0].match(/^(\s*)/)?.[1] || '';
      
      console.log(`\n  ChildItems ${i + 1}:`);
      console.log(`    Form1: отступ первого элемента = ${indent1.length} символов`);
      console.log(`    Form2: отступ первого элемента = ${indent2.length} символов`);
      
      if (indent1.length !== indent2.length) {
        console.log(`    ⚠️  РАЗНЫЕ ОТСТУПЫ!`);
      }
    }
  }
  
  console.log('\n=== ИТОГОВЫЙ ДИАГНОЗ ===\n');
  console.log('✅ Проверка завершена. Смотрите детали выше.');
  
} catch (error) {
  console.error('\n❌ ОШИБКА:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
}

