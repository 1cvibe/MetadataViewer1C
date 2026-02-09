const fs = require('fs');
const path = require('path');
const { parseReportXmlForDcs } = require('../out/xmlParsers/dcsParser');
const { serializeDcsToPreserveOrder, serializeToXml } = require('../out/xmlParsers/dcsSerializer');
const { XmlDiffMerge } = require('../out/utils/xmlDiffMerge');

async function testResave() {
  const sourceRoot = 'd:/1C/RZDZUP/src/cf';
  const reportName = 'ibs_ВыплатыНезарплатныхДоходов';
  const reportXmlPath = `${sourceRoot}/Reports/${reportName}/${reportName}.xml`;
  
  console.log(`=== Тест пересохранения ${reportName} ===\n`);
  
  try {
    // Парсим отчет
    const parsed = await parseReportXmlForDcs(sourceRoot, reportXmlPath);
    console.log(`✓ Отчёт загружен: ${parsed.reportName}`);
    console.log(`  Template: ${parsed.templatePath}`);
    console.log(`  Исходный XML: ${parsed.schema._originalXml.length} символов`);
    
    const originalLines = parsed.schema._originalXml.split(/\r?\n/).length;
    console.log(`  Исходных строк: ${originalLines}`);
    
    // Без изменений - просто пересохраняем
    const changedRaw = serializeDcsToPreserveOrder(parsed.schema.children);
    const mergedRaw = XmlDiffMerge.merge(parsed.schema._raw, changedRaw);
    const updatedXml = serializeToXml(mergedRaw, parsed.schema.rootTag, parsed.schema._rootAttrs);
    
    const updatedLines = updatedXml.split(/\r?\n/).length;
    console.log(`\n✓ XML сгенерирован: ${updatedXml.length} символов`);
    console.log(`  Результат строк: ${updatedLines}`);
    console.log(`  Разница: ${updatedLines - originalLines > 0 ? '+' : ''}${updatedLines - originalLines} строк`);
    
    // Сохраняем для проверки
    const outputPath = path.join(__dirname, 'output', `${reportName}-resaved.xml`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, updatedXml, 'utf8');
    console.log(`\n✓ Сохранено в: ${outputPath}`);
    
    // Проверяем на валидность
    const { XMLParser } = require('fast-xml-parser');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: false,
      preserveOrder: true,
    });
    
    parser.parse(updatedXml);
    console.log('✓ Результат валиден');
    
    // Проверяем namespace
    if (!updatedXml.includes('xmlns:xsi=')) {
      console.error('\n✗ ПРОБЛЕМА: xmlns:xsi отсутствует в результате!');
      process.exit(1);
    }
    
    console.log('\n✓ Все проверки пройдены');
    
    // Показываем первые 20 строк результата
    console.log('\n=== Первые 20 строк результата ===');
    const resultLines = updatedXml.split(/\r?\n/);
    resultLines.slice(0, 20).forEach((line, i) => {
      console.log(`${i + 1}: ${line.substring(0, 120)}`);
    });
    
  } catch (error) {
    console.error('\n✗ Ошибка:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testResave();

