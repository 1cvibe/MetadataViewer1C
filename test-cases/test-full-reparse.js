/**
 * Полный тест: парсинг Template2 → сериализация → сравнение
 */
const fs = require('fs');
const path = require('path');

console.log('=== Полный тест пересохранения ===\n');

// Нам нужен Report.xml, чтобы использовать parseReportXmlForDcs
// Создадим временный Report.xml для Template2

const template2Path = path.join(__dirname, 'compare', 'Template2.xml');
const tempReportPath = path.join(__dirname, 'temp-report.xml');
const outputPath = path.join(__dirname, 'test-full-output.xml');

// Создаем минимальный Report.xml
const reportXml = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:cmi="http://v8.1c.ru/8.2/managed-application/cmi" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xpr="http://v8.1c.ru/8.3/xcf/predef" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.14">
  <Report uuid="test-report-id">
    <Properties>
      <Name>TestReport</Name>
      <MainDataCompositionSchema>Report.TestReport.Template.ОсновнаяСхемаКомпоновкиДанных</MainDataCompositionSchema>
    </Properties>
  </Report>
</MetaDataObject>`;

try {
  console.log('1. Создаем временный Report.xml...');
  fs.writeFileSync(tempReportPath, reportXml, 'utf8');
  
  // Копируем Template2.xml в нужное место
  const templatesDir = path.join(__dirname, 'Reports', 'TestReport', 'Templates', 'ОсновнаяСхемаКомпоновкиДанных', 'Ext');
  fs.mkdirSync(templatesDir, { recursive: true });
  const templatePath = path.join(templatesDir, 'Template.xml');
  fs.copyFileSync(template2Path, templatePath);
  
  console.log('2. Парсим через parseReportXmlForDcs...');
  
  const { parseReportXmlForDcs } = require('../out/xmlParsers/dcsParserXmldom.js');
  const { serializeToXml } = require('../out/xmlParsers/dcsSerializerXmldom.js');
  
  const sourceRoot = __dirname; // test-cases как корень
  
  parseReportXmlForDcs(sourceRoot, tempReportPath).then(parsed => {
    console.log(`   Отчет: ${parsed.reportName}`);
    console.log(`   Шаблон: ${parsed.templateName}`);
    console.log(`   Дочерних элементов: ${parsed.schema.children.length}`);
    
    console.log('\n3. Сериализуем обратно...');
    const newXml = serializeToXml(
      parsed.schema._domDocument,
      parsed.schema.rootTag,
      parsed.schema.children,
      parsed.schema._rootAttrs
    );
    
    console.log(`   Размер: ${newXml.length} символов`);
    console.log(`   Строк: ${newXml.split('\n').length}`);
    
    console.log('\n4. Сохраняем с BOM...');
    const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
    const contentBuffer = Buffer.from(newXml, 'utf8');
    fs.writeFileSync(outputPath, Buffer.concat([bomBuffer, contentBuffer]));
    
    console.log(`   Файл: ${outputPath}`);
    
    console.log('\n5. Анализ результата:\n');
    
    const lines = newXml.split('\n');
    
    // Проверка пустых строк
    const emptyLines = lines.filter((l, i) => i > 2 && i < 40 && l.trim() === '').length;
    console.log(`   Пустых строк в начале (3-40): ${emptyLines} ${emptyLines === 0 ? '✅' : '❌'}`);
    
    // Проверка первого элемента
    const firstDataSource = lines.find(l => l.includes('<dataSource>'));
    let indent = '';
    if (firstDataSource) {
      indent = firstDataSource.match(/^(\s*)</)?.[1] || '';
      console.log(`   Отступ dataSource: "${indent}" (${indent.length} символов) ${indent.length === 1 ? '✅' : '❌'}`);
    } else {
      console.log(`   Отступ dataSource: не найден ❌`);
    }
    
    // Проверка содержимого dataSource
    const hasName = newXml.includes('<name>ИсточникДанных1</name>');
    console.log(`   Содержимое есть: ${hasName ? '✅' : '❌'}`);
    
    // Показываем первые 15 строк
    console.log('\n6. Первые 15 строк результата:\n');
    lines.slice(0, 15).forEach((line, i) => {
      const lineNum = String(i + 1).padStart(3, ' ');
      console.log(`   ${lineNum}| ${line}`);
    });
    
    console.log('\n=== ИТОГ ===\n');
    
    if (emptyLines === 0 && indent.length === 1 && hasName) {
      console.log('✅ ОТЛИЧНО! Форматирование и содержимое корректны.');
    } else {
      console.log('⚠️  Есть проблемы.');
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
    // Cleanup
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
  // Cleanup
  try {
    fs.unlinkSync(tempReportPath);
    fs.rmSync(path.join(__dirname, 'Reports'), { recursive: true, force: true });
  } catch {}
  process.exit(1);
}

