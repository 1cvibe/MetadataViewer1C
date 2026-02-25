/**
 * Детальная проверка форматирования и структуры XML
 */
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const file1 = path.join(__dirname, 'compare', 'Form1.xml');
const file2 = path.join(__dirname, 'compare', 'Form2.xml');

console.log('=== Детальная проверка форматирования XML ===\n');

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

function analyzeFormatting(xml, label) {
  console.log(`\n=== ${label} ===\n`);
  
  const lines = xml.split('\n');
  console.log(`Всего строк: ${lines.length}`);
  
  // Проверяем пустые строки
  const emptyLines = lines.map((line, idx) => ({ line: idx + 1, isEmpty: line.trim() === '' }))
    .filter(item => item.isEmpty);
  console.log(`Пустых строк: ${emptyLines.length}`);
  if (emptyLines.length > 0 && emptyLines.length < 20) {
    console.log(`  На строках: ${emptyLines.map(e => e.line).join(', ')}`);
  }
  
  // Проверяем отступы (первые 30 строк)
  console.log('\n--- Анализ отступов (первые 30 строк) ---');
  const indentIssues = [];
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    
    const match = line.match(/^(\s*)/);
    const indent = match ? match[1] : '';
    const indentType = indent.includes('\t') ? 'tab' : (indent.includes(' ') ? 'space' : 'none');
    const indentCount = indent.length;
    
    // Проверяем смешанные отступы
    if (indent.includes('\t') && indent.includes(' ')) {
      indentIssues.push({ line: i + 1, issue: 'Смешанные табы и пробелы', indent });
    }
    
    if (i < 10) {
      console.log(`  Строка ${i + 1}: ${indentCount} символов (${indentType}) |${line.substring(0, 60)}|`);
    }
  }
  
  if (indentIssues.length > 0) {
    console.log(`\n⚠️  Найдено проблем с отступами: ${indentIssues.length}`);
    indentIssues.slice(0, 10).forEach(issue => {
      console.log(`  Строка ${issue.line}: ${issue.issue}`);
    });
  }
  
  // Проверяем форматирование корневого элемента
  console.log('\n--- Форматирование корневого элемента <Form> ---');
  const formOpenMatch = xml.match(/<Form[^>]*>/);
  const formCloseMatch = xml.match(/<\/Form>/);
  
  if (formOpenMatch) {
    const formOpenLine = xml.substring(0, formOpenMatch.index).split('\n').length;
    console.log(`  Открывающий тег <Form> на строке: ${formOpenLine}`);
    const beforeForm = xml.substring(0, formOpenMatch.index);
    const linesBefore = beforeForm.split('\n');
    const lastLineBefore = linesBefore[linesBefore.length - 1];
    console.log(`  Строка перед <Form>: |${lastLineBefore}|`);
  }
  
  // Проверяем форматирование ChildItems
  console.log('\n--- Форматирование <ChildItems> ---');
  const childItemsMatch = xml.match(/<ChildItems[^>]*>/);
  if (childItemsMatch) {
    const childItemsLine = xml.substring(0, childItemsMatch.index).split('\n').length;
    const beforeCI = xml.substring(0, childItemsMatch.index);
    const linesBeforeCI = beforeCI.split('\n');
    const lastLineBeforeCI = linesBeforeCI[linesBeforeCI.length - 1];
    const indentCI = lastLineBeforeCI.match(/^(\s*)/)?.[1] || '';
    console.log(`  Открывающий тег <ChildItems> на строке: ${childItemsLine}`);
    console.log(`  Отступ перед <ChildItems>: ${indentCI.length} символов (${indentCI.includes('\t') ? 'tab' : 'space'})`);
    console.log(`  Строка перед <ChildItems>: |${lastLineBeforeCI}|`);
    
    // Проверяем перенос строки после открывающего тега
    const afterCI = xml.substring(childItemsMatch.index + childItemsMatch[0].length, childItemsMatch.index + childItemsMatch[0].length + 10);
    console.log(`  После <ChildItems>: |${afterCI.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}|`);
  }
  
  // Проверяем форматирование первого элемента в ChildItems
  const firstChildInCI = xml.match(/<ChildItems[^>]*>\s*<(\w+)/);
  if (firstChildInCI) {
    const firstChildTag = firstChildInCI[1];
    const firstChildMatch = xml.match(new RegExp(`<ChildItems[^>]*>\\s*<${firstChildTag}[^>]*>`));
    if (firstChildMatch) {
      const beforeFirstChild = xml.substring(0, firstChildMatch.index + firstChildMatch[0].indexOf(`<${firstChildTag}`));
      const linesBeforeFirst = beforeFirstChild.split('\n');
      const lastLineBeforeFirst = linesBeforeFirst[linesBeforeFirst.length - 1];
      const indentFirst = lastLineBeforeFirst.match(/^(\s*)/)?.[1] || '';
      console.log(`  Первый элемент <${firstChildTag}> в ChildItems:`);
      console.log(`    Отступ: ${indentFirst.length} символов`);
      console.log(`    Строка перед элементом: |${lastLineBeforeFirst}|`);
    }
  }
  
  // Проверяем форматирование Attributes
  console.log('\n--- Форматирование <Attributes> ---');
  const attributesMatch = xml.match(/<Attributes[^>]*>/);
  if (attributesMatch) {
    const attributesLine = xml.substring(0, attributesMatch.index).split('\n').length;
    const beforeAttrs = xml.substring(0, attributesMatch.index);
    const linesBeforeAttrs = beforeAttrs.split('\n');
    const lastLineBeforeAttrs = linesBeforeAttrs[linesBeforeAttrs.length - 1];
    const indentAttrs = lastLineBeforeAttrs.match(/^(\s*)/)?.[1] || '';
    console.log(`  Открывающий тег <Attributes> на строке: ${attributesLine}`);
    console.log(`  Отступ перед <Attributes>: ${indentAttrs.length} символов`);
    console.log(`  Строка перед <Attributes>: |${lastLineBeforeAttrs}|`);
  }
  
  // Проверяем форматирование Commands
  console.log('\n--- Форматирование <Commands> ---');
  const commandsMatch = xml.match(/<Commands[^>]*>/);
  if (commandsMatch) {
    const commandsLine = xml.substring(0, commandsMatch.index).split('\n').length;
    const beforeCmds = xml.substring(0, commandsMatch.index);
    const linesBeforeCmds = beforeCmds.split('\n');
    const lastLineBeforeCmds = linesBeforeCmds[linesBeforeCmds.length - 1];
    const indentCmds = lastLineBeforeCmds.match(/^(\s*)/)?.[1] || '';
    console.log(`  Открывающий тег <Commands> на строке: ${commandsLine}`);
    console.log(`  Отступ перед <Commands>: ${indentCmds.length} символов`);
    console.log(`  Строка перед <Commands>: |${lastLineBeforeCmds}|`);
  }
  
  // Проверяем форматирование AutoCommandBar
  console.log('\n--- Форматирование <AutoCommandBar> ---');
  const autoCmdBarMatch = xml.match(/<AutoCommandBar[^>]*>/);
  if (autoCmdBarMatch) {
    const autoCmdBarLine = xml.substring(0, autoCmdBarMatch.index).split('\n').length;
    const beforeACB = xml.substring(0, autoCmdBarMatch.index);
    const linesBeforeACB = beforeACB.split('\n');
    const lastLineBeforeACB = linesBeforeACB[linesBeforeACB.length - 1];
    const indentACB = lastLineBeforeACB.match(/^(\s*)/)?.[1] || '';
    console.log(`  Открывающий тег <AutoCommandBar> на строке: ${autoCmdBarLine}`);
    console.log(`  Отступ перед <AutoCommandBar>: ${indentACB.length} символов`);
    console.log(`  Строка перед <AutoCommandBar>: |${lastLineBeforeACB}|`);
    
    // Проверяем содержимое AutoCommandBar
    const autoCmdBarClose = xml.indexOf('</AutoCommandBar>', autoCmdBarMatch.index);
    if (autoCmdBarClose > 0) {
      const autoCmdBarContent = xml.substring(autoCmdBarMatch.index + autoCmdBarMatch[0].length, autoCmdBarClose);
      const linesInACB = autoCmdBarContent.split('\n');
      console.log(`  Строк внутри <AutoCommandBar>: ${linesInACB.length}`);
      if (linesInACB.length > 0 && linesInACB.length < 10) {
        console.log(`  Первые строки внутри:`);
        linesInACB.slice(0, 5).forEach((line, idx) => {
          console.log(`    ${idx + 1}: |${line.substring(0, 60)}|`);
        });
      }
    }
  }
  
  // Проверяем форматирование Events
  console.log('\n--- Форматирование <Events> ---');
  const eventsMatch = xml.match(/<Events[^>]*>/);
  if (eventsMatch) {
    const eventsLine = xml.substring(0, eventsMatch.index).split('\n').length;
    const beforeEvents = xml.substring(0, eventsMatch.index);
    const linesBeforeEvents = beforeEvents.split('\n');
    const lastLineBeforeEvents = linesBeforeEvents[linesBeforeEvents.length - 1];
    const indentEvents = lastLineBeforeEvents.match(/^(\s*)/)?.[1] || '';
    console.log(`  Открывающий тег <Events> на строке: ${eventsLine}`);
    console.log(`  Отступ перед <Events>: ${indentEvents.length} символов`);
    
    // Проверяем Event элементы
    const eventsClose = xml.indexOf('</Events>', eventsMatch.index);
    if (eventsClose > 0) {
      const eventsContent = xml.substring(eventsMatch.index + eventsMatch[0].length, eventsClose);
      const eventMatches = eventsContent.match(/<Event[^>]*>/g);
      console.log(`  Количество <Event> элементов: ${eventMatches ? eventMatches.length : 0}`);
      
      if (eventMatches && eventMatches.length > 0) {
        const firstEventMatch = eventsContent.match(/<Event[^>]*>/);
        if (firstEventMatch) {
          const beforeFirstEvent = eventsContent.substring(0, firstEventMatch.index);
          const linesBeforeFirstEvent = beforeFirstEvent.split('\n');
          const lastLineBeforeFirstEvent = linesBeforeFirstEvent[linesBeforeFirstEvent.length - 1];
          const indentFirstEvent = lastLineBeforeFirstEvent.match(/^(\s*)/)?.[1] || '';
          console.log(`  Отступ первого <Event>: ${indentFirstEvent.length} символов`);
          console.log(`  Строка перед первым <Event>: |${lastLineBeforeFirstEvent}|`);
        }
      }
    }
  }
  
  return { lines, emptyLines, indentIssues };
}

try {
  const data1 = parseXml(file1);
  const data2 = parseXml(file2);
  
  const analysis1 = analyzeFormatting(data1.raw, 'Form1.xml (до изменения)');
  const analysis2 = analyzeFormatting(data2.raw, 'Form2.xml (после изменения)');
  
  console.log('\n=== СРАВНЕНИЕ ФОРМАТИРОВАНИЯ ===\n');
  
  // Сравниваем количество строк
  console.log(`Строк в Form1: ${analysis1.lines.length}`);
  console.log(`Строк в Form2: ${analysis2.lines.length}`);
  console.log(`Разница: ${analysis2.lines.length - analysis1.lines.length}`);
  
  // Сравниваем пустые строки
  console.log(`\nПустых строк:`);
  console.log(`  Form1: ${analysis1.emptyLines.length}`);
  console.log(`  Form2: ${analysis2.emptyLines.length}`);
  
  // Сравниваем проблемы с отступами
  console.log(`\nПроблем с отступами:`);
  console.log(`  Form1: ${analysis1.indentIssues.length}`);
  console.log(`  Form2: ${analysis2.indentIssues.length}`);
  
  console.log('\n=== ИТОГОВЫЙ ДИАГНОЗ ===\n');
  
  const issues = [];
  
  if (analysis2.lines.length !== analysis1.lines.length) {
    issues.push(`Разное количество строк: ${analysis1.lines.length} → ${analysis2.lines.length}`);
  }
  
  if (analysis2.emptyLines.length !== analysis1.emptyLines.length) {
    issues.push(`Разное количество пустых строк: ${analysis1.emptyLines.length} → ${analysis2.emptyLines.length}`);
  }
  
  if (analysis2.indentIssues.length > analysis1.indentIssues.length) {
    issues.push(`Увеличилось количество проблем с отступами: ${analysis1.indentIssues.length} → ${analysis2.indentIssues.length}`);
  }
  
  if (issues.length === 0) {
    console.log('✅ Форматирование корректно');
  } else {
    console.log('❌ НАЙДЕНЫ ПРОБЛЕМЫ:');
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }
  
} catch (error) {
  console.error('\n❌ ОШИБКА:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
}

