/**
 * Полный flow как в редакторе: парсинг → переупорядочивание → сериализация
 */
const fs = require('fs');
const path = require('path');

console.log('=== Тест с переупорядочиванием (как в редакторе) ===\n');

const template2Path = path.join(__dirname, 'compare', 'Template2.xml');
const tempReportPath = path.join(__dirname, 'temp-report.xml');
const outputPath = path.join(__dirname, 'test-reordered-output.xml');

// Создаем минимальный Report.xml
const reportXml = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.14">
  <Report uuid="test-report-id">
    <Properties>
      <Name>TestReport</Name>
      <MainDataCompositionSchema>Report.TestReport.Template.ОсновнаяСхемаКомпоновкиДанных</MainDataCompositionSchema>
    </Properties>
  </Report>
</MetaDataObject>`;

// Функция переупорядочивания (копия из dcsEditor.ts)
function reorderRootSectionsForSave(nodes) {
  const list = Array.isArray(nodes) ? nodes.slice() : [];

  const localTag = (tag) => {
    const t = String(tag || '');
    const idx = t.lastIndexOf(':');
    return idx >= 0 ? t.slice(idx + 1) : t;
  };

  const dataSources = [];
  const dataSets = [];
  const links = [];
  const totals = [];
  const calcs = [];
  const params = [];
  const templates = [];
  const settings = [];
  const others = [];

  for (const n of list) {
    const lt = localTag(n?.tag);
    if (lt === 'dataSource') dataSources.push(n);
    else if (lt === 'dataSet') dataSets.push(n);
    else if (lt === 'dataSetLink') links.push(n);
    else if (lt === 'totalField') totals.push(n);
    else if (lt === 'calculatedField') calcs.push(n);
    else if (lt === 'parameter') params.push(n);
    else if (lt === 'template' || lt === 'groupTemplate' || lt === 'totalFieldsTemplate') templates.push(n);
    else if (lt === 'settingsVariant') settings.push(n);
    else others.push(n);
  }

  // Переупорядочиваем детей dataSet
  const reorderedDataSets = dataSets.map(ds => reorderDataSetChildren(ds));

  return [
    ...dataSources,
    ...reorderedDataSets,
    ...links,
    ...totals,
    ...calcs,
    ...params,
    ...templates,
    ...settings,
    ...others
  ];
}

function reorderDataSetChildren(dataSetNode) {
  if (!dataSetNode.children || dataSetNode.children.length === 0) {
    return dataSetNode;
  }

  const localTag = (tag) => {
    const t = String(tag || '');
    const idx = t.lastIndexOf(':');
    return idx >= 0 ? t.slice(idx + 1) : t;
  };

  const children = dataSetNode.children.slice();
  
  const names = [];
  const queries = [];
  const fields = [];
  const dataSources = [];
  const others = [];

  for (const child of children) {
    const lt = localTag(child.tag);
    if (lt === 'name') names.push(child);
    else if (lt === 'query' || lt === 'items') queries.push(child);
    else if (lt === 'field') fields.push(child);
    else if (lt === 'dataSource') dataSources.push(child);
    else others.push(child);
  }

  const reorderedChildren = [
    ...names,
    ...queries,
    ...fields,
    ...dataSources,
    ...others
  ];

  return {
    ...dataSetNode,
    children: reorderedChildren
  };
}

try {
  console.log('1. Создаем временный Report.xml...');
  fs.writeFileSync(tempReportPath, reportXml, 'utf8');
  
  const templatesDir = path.join(__dirname, 'Reports', 'TestReport', 'Templates', 'ОсновнаяСхемаКомпоновкиДанных', 'Ext');
  fs.mkdirSync(templatesDir, { recursive: true });
  const templatePath = path.join(templatesDir, 'Template.xml');
  fs.copyFileSync(template2Path, templatePath);
  
  console.log('2. Парсим через parseReportXmlForDcs...');
  
  const { parseReportXmlForDcs } = require('../out/xmlParsers/dcsParserXmldom.js');
  const { serializeToXml } = require('../out/xmlParsers/dcsSerializerXmldom.js');
  
  const sourceRoot = __dirname;
  
  parseReportXmlForDcs(sourceRoot, tempReportPath).then(parsed => {
    console.log(`   Отчет: ${parsed.reportName}`);
    console.log(`   Дочерних элементов ДО переупорядочивания: ${parsed.schema.children.length}`);
    
    console.log('\n3. Переупорядочиваем (как в handleSaveDcs)...');
    const reordered = reorderRootSectionsForSave(parsed.schema.children);
    console.log(`   Дочерних элементов ПОСЛЕ переупорядочивания: ${reordered.length}`);
    
    console.log('\n4. Сериализуем...');
    const newXml = serializeToXml(
      parsed.schema._domDocument,
      parsed.schema.rootTag,
      reordered,  // ← Используем переупорядоченные!
      parsed.schema._rootAttrs
    );
    
    console.log(`   Размер: ${newXml.length} символов`);
    
    console.log('\n5. Сохраняем с BOM...');
    const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
    const contentBuffer = Buffer.from(newXml, 'utf8');
    fs.writeFileSync(outputPath, Buffer.concat([bomBuffer, contentBuffer]));
    
    console.log(`   Файл: ${outputPath}`);
    
    console.log('\n6. Проверка порядка в dataSet:\n');
    
    const { DOMParser } = require('@xmldom/xmldom');
    const parser = new DOMParser();
    const doc = parser.parseFromString(newXml, 'text/xml');
    const dataSets = doc.getElementsByTagName('dataSet');
    
    let errors = 0;
    for (let i = 0; i < dataSets.length; i++) {
      const ds = dataSets[i];
      const name = ds.getElementsByTagName('name')[0]?.textContent || 'unnamed';
      
      const children = [];
      for (let j = 0; j < ds.childNodes.length; j++) {
        const child = ds.childNodes[j];
        if (child.nodeType === 1) {
          children.push(child.tagName);
        }
      }
      
      const queryIdx = children.indexOf('query');
      const firstFieldIdx = children.indexOf('field');
      
      console.log(`   dataSet[${i}]: ${name}`);
      console.log(`     query на позиции: ${queryIdx}`);
      console.log(`     первый field на позиции: ${firstFieldIdx}`);
      
      if (queryIdx >= 0 && firstFieldIdx >= 0 && firstFieldIdx < queryIdx) {
        console.log(`     ❌ ОШИБКА: field перед query`);
        errors++;
      } else if (queryIdx >= 0 && firstFieldIdx >= 0) {
        console.log(`     ✓ Порядок правильный`);
      }
    }
    
    console.log('\n=== ИТОГ ===\n');
    
    if (errors === 0) {
      console.log('✅ ВСЕ dataSet имеют правильный порядок элементов!');
      console.log('   Функция reorderDataSetChildren работает корректно.');
    } else {
      console.log(`❌ Найдено ${errors} dataSet с неправильным порядком`);
    }
    
    // Cleanup
    console.log('\n7. Очистка временных файлов...');
    fs.unlinkSync(tempReportPath);
    fs.rmSync(path.join(__dirname, 'Reports'), { recursive: true, force: true });
    console.log('   ✓ Готово');
    
  }).catch(error => {
    console.error('\n❌ ОШИБКА:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    try {
      fs.unlinkSync(tempReportPath);
      fs.rmSync(path.join(__dirname, 'Reports'), { recursive: true, force: true });
    } catch {}
    process.exit(1);
  });
  
} catch (error) {
  console.error('\n❌ ОШИБКА:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  try {
    fs.unlinkSync(tempReportPath);
    fs.rmSync(path.join(__dirname, 'Reports'), { recursive: true, force: true });
  } catch {}
  process.exit(1);
}

