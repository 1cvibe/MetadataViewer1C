// Проверка строк DataPath в XML формы на скрытые символы/несовпадения (для диагностики ошибок 1С)
// Запуск: node scripts/check-form-datapath.js "D:/path/to/Form.xml"

const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/check-form-datapath.js "D:/.../Form.xml"');
  process.exit(2);
}

const s = fs.readFileSync(file, 'utf8');

const toCodePoints = (str) =>
  Array.from(str)
    .map((ch) => `${ch} U+${ch.codePointAt(0).toString(16).toUpperCase()}`)
    .join(' ');

const dynamicListAttrMatch = s.match(
  /<Attribute\s+name=\"([^\"]+)\"[^>]*>[\s\S]*?<v8:Type>cfg:DynamicList<\/v8:Type>/
);
const dynamicListAttrName = dynamicListAttrMatch?.[1] ?? null;

const dataPaths = [...s.matchAll(/<DataPath>([^<]+)<\/DataPath>/g)].map((m) => m[1]);

const invisibleRe = /[\u00A0\u200B\u200C\u200D\uFEFF]/;
const bad = dataPaths.filter((v) => invisibleRe.test(v));

console.log('file:', file);
console.log('dynamicListAttrName:', dynamicListAttrName);
if (dynamicListAttrName) {
  console.log('dynamicListAttrName cps:', toCodePoints(dynamicListAttrName));
}

console.log('DataPath count:', dataPaths.length);
if (dataPaths.length) {
  console.log('DataPath[0]:', dataPaths[0]);
  console.log('DataPath[0] cps:', toCodePoints(dataPaths[0]));
}

if (dynamicListAttrName && dataPaths.length) {
  const firstTableDataPath = dataPaths[0];
  console.log('attrName === firstTableDataPath ?', dynamicListAttrName === firstTableDataPath);
}

console.log('DataPath with invisible chars:', bad.length);
if (bad.length) {
  console.log('First 10 bad DataPath values:');
  bad.slice(0, 10).forEach((v, i) => {
    console.log(`  [${i}]`, JSON.stringify(v));
    console.log('      cps:', toCodePoints(v));
  });
}
