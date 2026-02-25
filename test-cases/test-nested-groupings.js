/**
 * Тест вложенных группировок в СКД на реальных отчетах
 * Берет 10 реальных отчетов из D:\1C\RZDZUP\src\cf\Reports
 * и тестирует функциональность вложенных группировок
 */

const fs = require('fs');
const path = require('path');

// Динамически импортируем из out/
const dcsParserPath = path.join(__dirname, '..', 'out', 'xmlParsers', 'dcsParserXmldom.js');
const dcsSerializerPath = path.join(__dirname, '..', 'out', 'xmlParsers', 'dcsSerializerXmldom.js');

if (!fs.existsSync(dcsParserPath)) {
  console.error('❌ Файл не найден:', dcsParserPath);
  console.error('   Запустите "npm run compile" перед тестом!');
  process.exit(1);
}

const { parseReportXmlForDcs } = require(dcsParserPath);
const { serializeToXml } = require(dcsSerializerPath);

const sourceRoot = 'D:\\1C\\RZDZUP\\src\\cf';
const reportsDir = path.join(sourceRoot, 'Reports');

/**
 * Рекурсивно ищет Template.xml в папке
 */
function findTemplateXml(dir, maxDepth = 3) {
  const stack = [{ dir, depth: 0 }];
  
  while (stack.length > 0) {
    const { dir: currentDir, depth } = stack.pop();
    
    if (depth > maxDepth) continue;
    
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isFile() && entry.name === 'Template.xml') {
          return fullPath;
        }
        
        if (entry.isDirectory() && depth < maxDepth) {
          stack.push({ dir: fullPath, depth: depth + 1 });
        }
      }
    } catch (err) {
      // Игнорируем ошибки доступа
    }
  }
  
  return null;
}

/**
 * Находит отчеты с DCS схемами
 */
function findReportsWithDCS(reportsDir, limit = 10) {
  const reports = [];
  
  try {
    const reportDirs = fs.readdirSync(reportsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const reportName of reportDirs) {
      if (reports.length >= limit) break;
      
      const reportDir = path.join(reportsDir, reportName);
      
      // Ищем Template.xml в папке Templates (проверяем стандартные пути)
      const templatesDir = path.join(reportDir, 'Templates');
      if (!fs.existsSync(templatesDir)) {
        if (reports.length === 0 && reportDirs.indexOf(reportName) < 3) {
          console.log(`  [DEBUG] ${reportName}: нет папки Templates`);
        }
        continue;
      }
      
      // Проверяем стандартные пути
      const templatePaths = [
        path.join(templatesDir, 'ОсновнаяСхемаКомпоновкиДанных', 'Ext', 'Template.xml'),
        path.join(templatesDir, 'ОсновнаяСхемаКомпоновкиДанных', 'Template.xml'),
      ];
      
      // Также ищем рекурсивно
      let templatePath = findTemplateXml(templatesDir, 4);
      
      // Если не нашли рекурсивно, проверяем стандартные пути
      if (!templatePath) {
        for (const tp of templatePaths) {
          if (fs.existsSync(tp)) {
            templatePath = tp;
            break;
          }
        }
      }
      
      if (templatePath) {
        // Ищем Report.xml - может быть в разных местах
        const reportXmlPath1 = path.join(reportDir, `${reportName}.xml`);
        const reportXmlPath2 = path.join(reportDir, 'Ext', `${reportName}.xml`);
        
        let reportXmlPath = null;
        if (fs.existsSync(reportXmlPath1)) {
          reportXmlPath = reportXmlPath1;
        } else if (fs.existsSync(reportXmlPath2)) {
          reportXmlPath = reportXmlPath2;
        } else {
          // Пробуем найти любой .xml файл в корне отчета
          try {
            const xmlFiles = fs.readdirSync(reportDir)
              .filter(f => f.endsWith('.xml') && !f.includes('Template'));
            if (xmlFiles.length > 0) {
              reportXmlPath = path.join(reportDir, xmlFiles[0]);
            }
          } catch (e) {
            // Игнорируем
          }
        }
        
        // Для теста вложенных группировок достаточно Template.xml
        // Report.xml не обязателен
        if (templatePath) {
          // Если Report.xml не найден, создаем фиктивный путь или используем templatePath
          let finalReportPath = reportXmlPath;
          if (!finalReportPath) {
            // Пробуем найти любой XML файл в корне отчета как Report.xml
            try {
              const files = fs.readdirSync(reportDir)
                .filter(f => f.endsWith('.xml') && !f.includes('Template'));
              if (files.length > 0) {
                finalReportPath = path.join(reportDir, files[0]);
              } else {
                // Используем templatePath как fallback (для парсинга нам нужен только Template.xml)
                finalReportPath = templatePath;
              }
            } catch (e) {
              finalReportPath = templatePath;
            }
          }
          
          reports.push({
            name: reportName,
            reportPath: finalReportPath,
            templatePath: templatePath
          });
        }
      }
    }
  } catch (err) {
    console.error('Ошибка при поиске отчетов:', err.message);
  }
  
  return reports;
}

/**
 * Рекурсивно ищет вложенные группировки в структуре
 */
function findNestedGroupings(node, depth = 0, path = '') {
  const results = [];
  
  if (!node || !node.children) return results;
  
  const localTag = (tag) => {
    const t = String(tag || '');
    const idx = t.lastIndexOf(':');
    return idx >= 0 ? t.slice(idx + 1) : t;
  };
  
  for (const child of node.children) {
    const childLocalTag = localTag(child.tag);
    const childType = String(child.attrs?.['@_xsi:type'] || '').trim();
    const childPath = path ? `${path}.${node.children.indexOf(child)}` : `${node.children.indexOf(child)}`;
    
    // Проверяем, является ли это элементом структуры
    if (childLocalTag === 'item') {
      const isGroup = childType.includes('StructureItemGroup');
      const isTable = childType.includes('StructureItemTable');
      
      if (isGroup || isTable) {
        results.push({
          type: isTable ? 'table' : 'group',
          depth,
          path: childPath,
          node: child
        });
        
        // Для группировок ищем вложенные элементы в groupItems
        if (isGroup) {
          const groupItems = child.children.find(c => localTag(c.tag) === 'groupItems');
          if (groupItems) {
            // Ищем вложенные item внутри groupItems
            for (const item of groupItems.children || []) {
              if (localTag(item.tag) === 'item') {
                const nestedType = String(item.attrs?.['@_xsi:type'] || '').trim();
                if (nestedType.includes('StructureItemGroup') || nestedType.includes('StructureItemTable')) {
                  results.push({
                    type: nestedType.includes('StructureItemTable') ? 'table' : 'group',
                    depth: depth + 1,
                    path: `${childPath}.groupItems.${groupItems.children.indexOf(item)}`,
                    node: item,
                    isNested: true
                  });
                  
                  // Рекурсивно ищем дальше
                  results.push(...findNestedGroupings(item, depth + 2, `${childPath}.groupItems.${groupItems.children.indexOf(item)}`));
                }
              }
            }
          }
        }
        
        // Для таблиц ищем в column и row
        if (isTable) {
          const column = child.children.find(c => localTag(c.tag) === 'column');
          const row = child.children.find(c => localTag(c.tag) === 'row');
          
          if (column) {
            results.push(...findNestedGroupings(column, depth + 1, `${childPath}.column`));
          }
          if (row) {
            results.push(...findNestedGroupings(row, depth + 1, `${childPath}.row`));
          }
        }
      }
    }
    
    // Рекурсивно ищем в других узлах
    results.push(...findNestedGroupings(child, depth, childPath));
  }
  
  return results;
}

/**
 * Рекурсивно ищет узел structure в дереве
 */
function findStructureNode(node) {
  if (!node) return null;
  
  const localTag = (tag) => {
    const t = String(tag || '');
    const idx = t.lastIndexOf(':');
    return idx >= 0 ? t.slice(idx + 1) : t;
  };
  
  // Проверяем текущий узел
  if (localTag(node.tag) === 'structure' || localTag(node.tag) === 'dcsset:structure') {
    return node;
  }
  
  // Рекурсивно ищем в детях
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findStructureNode(child);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Находит узел structure в настройках схемы
 */
function findStructureInSchema(schemaChildren) {
  const localTag = (tag) => {
    const t = String(tag || '');
    const idx = t.lastIndexOf(':');
    return idx >= 0 ? t.slice(idx + 1) : t;
  };
  
  // Ищем settingsVariant
  for (const child of schemaChildren) {
    if (localTag(child.tag) === 'settingsVariant') {
      const structure = findStructureNode(child);
      if (structure) return structure;
    }
  }
  
  // Ищем defaultSettings
  const defaultSettings = schemaChildren.find(c => localTag(c.tag) === 'defaultSettings');
  if (defaultSettings) {
    const structure = findStructureNode(defaultSettings);
    if (structure) return structure;
  }
  
  // Ищем напрямую structure в корне (может быть без обертки)
  const directStructure = schemaChildren.find(c => 
    localTag(c.tag) === 'structure' || localTag(c.tag) === 'dcsset:structure'
  );
  if (directStructure) return directStructure;
  
  // Рекурсивно ищем во всех детях
  for (const child of schemaChildren) {
    const structure = findStructureNode(child);
    if (structure) return structure;
  }
  
  return null;
}

/**
 * Тестирует отчет на наличие и корректность вложенных группировок
 */
async function testReportNestedGroupings(reportInfo, reports = []) {
  console.log(`\n=== ${reportInfo.name} ===`);
  
  try {
    // Парсим Template.xml напрямую (для теста вложенных группировок достаточно Template.xml)
    const templateXml = fs.readFileSync(reportInfo.templatePath, 'utf8');
    const { DOMParser } = require('@xmldom/xmldom');
    
    // Удаляем BOM если есть
    let cleanXml = templateXml;
    if (templateXml.charCodeAt(0) === 0xFEFF) {
      cleanXml = templateXml.slice(1);
    }
    
    const parser = new DOMParser({
      errorHandler: {
        warning: () => {},
        error: () => {},
        fatalError: (e) => { throw new Error(`XML parsing error: ${e}`); }
      }
    });
    
    const doc = parser.parseFromString(cleanXml, 'text/xml');
    const rootElement = doc.documentElement;
    
    if (!rootElement || !rootElement.tagName.includes('DataCompositionSchema')) {
      console.log('  ⚠️  Не является DCS схемой');
      return { status: 'skipped', reason: 'not_dcs', reportName: reportInfo.name };
    }
    
    // Строим структуру узлов из DOM
    function buildNodeFromElement(element, nodePath) {
      const tag = element.tagName;
      const attrs = {};
      if (element.attributes) {
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          attrs[`@_${attr.name}`] = attr.value;
        }
      }
      
      const children = [];
      let childIndex = 0;
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        if (child.nodeType === 1) { // ELEMENT_NODE
          const childPath = nodePath ? `${nodePath}.${childIndex}` : `${childIndex}`;
          children.push(buildNodeFromElement(child, childPath));
          childIndex++;
        }
      }
      
      return {
        path: nodePath,
        tag,
        attrs,
        children
      };
    }
    
    // Создаем структуру для теста
    const parsed = {
      reportName: reportInfo.name,
      templateName: 'ОсновнаяСхемаКомпоновкиДанных',
      schema: {
        children: [],
        _domDocument: doc
      }
    };
    
    // Извлекаем children из корня
    let childIndex = 0;
    for (let i = 0; i < rootElement.childNodes.length; i++) {
      const child = rootElement.childNodes[i];
      if (child.nodeType === 1) { // ELEMENT_NODE
        const childPath = `${childIndex}`;
        parsed.schema.children.push(buildNodeFromElement(child, childPath));
        childIndex++;
      }
    }
    
    console.log(`  ✓ Отчет: ${parsed.reportName}`);
    console.log(`  ✓ Шаблон: ${parsed.templateName}`);
    console.log(`  ✓ Элементов в схеме: ${parsed.schema.children.length}`);
    
    // Отладочный вывод для первого отчета
    if (reportInfo.name === reports[0]?.name) {
      const localTag = (tag) => {
        const t = String(tag || '');
        const idx = t.lastIndexOf(':');
        return idx >= 0 ? t.slice(idx + 1) : t;
      };
      const topLevelTags = parsed.schema.children.map(c => localTag(c.tag));
      console.log(`  [DEBUG] Теги верхнего уровня: ${topLevelTags.slice(0, 10).join(', ')}`);
    }
    
    // Ищем узел structure
    const structureNode = findStructureInSchema(parsed.schema.children);
    
    if (!structureNode) {
      console.log('  ⚠️  Нет узла structure в настройках');
      return { 
        status: 'skipped', 
        reason: 'no_structure',
        reportName: reportInfo.name
      };
    }
    
    console.log(`  ✓ Найден узел structure`);
    
    // Ищем вложенные группировки
    const nestedGroupings = findNestedGroupings(structureNode);
    
    const topLevel = nestedGroupings.filter(g => g.depth === 0);
    const nested = nestedGroupings.filter(g => g.depth > 0);
    
    console.log(`  ✓ Группировок верхнего уровня: ${topLevel.length}`);
    console.log(`  ✓ Вложенных группировок: ${nested.length}`);
    
    if (nested.length > 0) {
      console.log(`  📊 Детали вложенных группировок:`);
      nested.forEach((g, idx) => {
        console.log(`    ${idx + 1}. Глубина ${g.depth}: ${g.type} (путь: ${g.path})`);
      });
    }
    
    // Проверяем структуру вложенных группировок
    let hasValidNested = false;
    for (const grouping of nested) {
      const node = grouping.node;
      const localTag = (tag) => {
        const t = String(tag || '');
        const idx = t.lastIndexOf(':');
        return idx >= 0 ? t.slice(idx + 1) : t;
      };
      
      // Проверяем наличие groupItems для группировок
      if (grouping.type === 'group') {
        const groupItems = node.children.find(c => localTag(c.tag) === 'groupItems');
        if (groupItems && groupItems.children && groupItems.children.length > 0) {
          hasValidNested = true;
          console.log(`  ✓ Вложенная группировка имеет groupItems с ${groupItems.children.length} элементами`);
        }
      }
    }
    
    return {
      status: 'success',
      reportName: reportInfo.name,
      topLevelCount: topLevel.length,
      nestedCount: nested.length,
      hasValidNested,
      nestedDetails: nested.map(g => ({
        type: g.type,
        depth: g.depth,
        path: g.path
      }))
    };
    
  } catch (error) {
    console.error(`  ❌ Ошибка: ${error.message}`);
    return {
      status: 'error',
      reportName: reportInfo.name,
      error: error.message
    };
  }
}

/**
 * Основная функция теста
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  ТЕСТ ВЛОЖЕННЫХ ГРУППИРОВОК В СКД НА РЕАЛЬНЫХ ОТЧЕТАХ        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\nИсточник: ${reportsDir}`);
  console.log(`Количество отчетов: 10\n`);
  
  // Проверяем существование папки
  if (!fs.existsSync(reportsDir)) {
    console.error(`❌ Папка не найдена: ${reportsDir}`);
    process.exit(1);
  }
  
  // Находим отчеты
  console.log('Поиск отчетов...');
  const reports = findReportsWithDCS(reportsDir, 10);
  console.log(`Найдено отчетов: ${reports.length}`);
  
  if (reports.length === 0) {
    console.error('❌ Не найдено отчетов с DCS схемами');
    // Отладочный вывод
    try {
      const dirs = fs.readdirSync(reportsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .slice(0, 3)
        .map(d => d.name);
      console.log(`Примеры папок: ${dirs.join(', ')}`);
    } catch (e) {
      console.error('Ошибка при чтении папки:', e.message);
    }
    process.exit(1);
  }
  
  console.log(`Найдено отчетов: ${reports.length}\n`);
  
  // Тестируем каждый отчет
  const results = [];
  for (let i = 0; i < reports.length; i++) {
    const report = reports[i];
    // Сохраняем ссылку на массив для отладки
    report._index = i;
    const result = await testReportNestedGroupings(report, reports);
    results.push(result);
  }
  
  // Статистика
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  ИТОГИ                                                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const successful = results.filter(r => r.status === 'success');
  const skipped = results.filter(r => r.status === 'skipped');
  const errors = results.filter(r => r.status === 'error');
  
  console.log(`Всего отчетов: ${results.length}`);
  console.log(`Успешно обработано: ${successful.length}`);
  console.log(`Пропущено: ${skipped.length}`);
  console.log(`Ошибок: ${errors.length}\n`);
  
  if (successful.length > 0) {
    const totalTopLevel = successful.reduce((sum, r) => sum + (r.topLevelCount || 0), 0);
    const totalNested = successful.reduce((sum, r) => sum + (r.nestedCount || 0), 0);
    const withNested = successful.filter(r => r.nestedCount > 0);
    
    console.log(`Всего группировок верхнего уровня: ${totalTopLevel}`);
    console.log(`Всего вложенных группировок: ${totalNested}`);
    console.log(`Отчетов с вложенными группировками: ${withNested.length}\n`);
    
    if (withNested.length > 0) {
      console.log('Отчеты с вложенными группировками:');
      withNested.forEach(r => {
        console.log(`  - ${r.reportName}: ${r.nestedCount} вложенных (${r.topLevelCount} верхнего уровня)`);
      });
    }
  }
  
  if (errors.length > 0) {
    console.log('\nОшибки:');
    errors.forEach(r => {
      console.log(`  - ${r.reportName}: ${r.error}`);
    });
  }
  
  // Сохраняем результаты
  const outputPath = path.join(__dirname, 'output', 'test-nested-groupings-results.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n✓ Результаты сохранены в: ${outputPath}`);
  
  // Exit code
  if (errors.length > 0) {
    process.exitCode = 1;
  } else {
    console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!');
  }
}

main().catch((error) => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
});

