const fs = require('fs');
const path = require('path');

const { parseReportXmlForDcs } = require('../out/xmlParsers/dcsParser');
const { serializeDcsToPreserveOrder, serializeToXml } = require('../out/xmlParsers/dcsSerializer');
const { XmlDiffMerge } = require('../out/utils/xmlDiffMerge');

async function testDcsSave() {
  console.log('=== Тест сохранения DCS ===');

  // Можно передать пути аргументами:
  // node test-cases/test-dcs-save.js <sourceRoot> <reportXmlPath>
  const sourceRoot = process.argv[2] || 'D:/1C/RZDZUP/src/cf';
  const reportXmlPath = process.argv[3] || 'D:/1C/RZDZUP/src/cf/Reports/ibs_АнализНачисленныхПремийСотрудникам/ibs_АнализНачисленныхПремийСотрудникам.xml';

  const parsed = await parseReportXmlForDcs(sourceRoot, reportXmlPath);
  console.log(`Загружен отчёт: ${parsed.reportName}`);

  // Вносим изменение: в первом dataSet меняем <name>
  const changed = JSON.parse(JSON.stringify(parsed.schema.children));
  const firstDataset = changed.find((n) => String(n.tag || '').includes('dataSet'));
  if (!firstDataset) throw new Error('Не найден dataSet в схеме');

  const nameNode = (firstDataset.children || []).find((c) => c.tag === 'name');
  if (!nameNode) throw new Error('Не найден <name> внутри первого dataSet');

  const newName = 'ТестовоеИмяDataSet';
  nameNode.text = newName;
  console.log('Изменено имя dataset');

  const changedRaw = serializeDcsToPreserveOrder(changed);
  const mergedRaw = XmlDiffMerge.merge(parsed.schema._raw, changedRaw);
  const updatedXml = serializeToXml(mergedRaw, parsed.schema.rootTag, parsed.schema._rootAttrs);

  const testOutputPath = path.join(__dirname, 'output', 'test-template.xml');
  fs.mkdirSync(path.dirname(testOutputPath), { recursive: true });
  fs.writeFileSync(testOutputPath, updatedXml, 'utf8');
  console.log(`Сохранено в: ${testOutputPath}`);

  const reloadedXml = fs.readFileSync(testOutputPath, 'utf8');
  if (!reloadedXml.includes(newName)) {
    throw new Error('Изменение не найдено в сохранённом XML');
  }

  console.log('✓ Изменение сохранено корректно');
  console.log('✓ Тест пройден');
}

testDcsSave().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
