const fs = require('fs');
const path = require('path');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');

const file1 = path.join(__dirname, 'compare', 'Form1.xml');
const file2 = path.join(__dirname, 'compare', 'Form2.xml');

console.log('=== Детальное сравнение структуры ===\n');

const xml1 = fs.readFileSync(file1, 'utf8');
const xml2 = fs.readFileSync(file2, 'utf8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: false,
  preserveOrder: false, // Используем обычный режим для удобства
});

const parsed1 = parser.parse(xml1);
const parsed2 = parser.parse(xml2);

// Проверяем, это форма или DCS
const isForm = parsed1.Form || parsed2.Form;
const isDCS = parsed1.DataCompositionSchema || parsed2.DataCompositionSchema;

if (isForm) {
  // Анализ для форм
  const form1 = parsed1.Form || {};
  const form2 = parsed2.Form || {};
  
  console.log('=== Анализ структуры формы ===\n');
  
  // Проверяем порядок корневых элементов
  console.log('=== Порядок корневых элементов ===');
  const root1 = Object.keys(form1).filter(k => !k.startsWith('@_') && !k.startsWith('#'));
  const root2 = Object.keys(form2).filter(k => !k.startsWith('@_') && !k.startsWith('#'));
  
  console.log('Form1 корневые элементы:', root1.join(', '));
  console.log('Form2 корневые элементы:', root2.join(', '));
  
  // Проверяем ChildItems
  console.log('\n=== ChildItems ===');
  const ci1 = form1.ChildItems;
  const ci2 = form2.ChildItems;
  
  if (ci1) {
    const items1 = Array.isArray(ci1) ? ci1 : [ci1];
    console.log(`Form1: ${items1.length} элементов в ChildItems`);
  } else {
    console.log('Form1: ChildItems отсутствует');
  }
  
  if (ci2) {
    const items2 = Array.isArray(ci2) ? ci2 : [ci2];
    console.log(`Form2: ${items2.length} элементов в ChildItems`);
  } else {
    console.log('Form2: ChildItems отсутствует');
  }
  
  // Проверяем Attributes
  console.log('\n=== Attributes ===');
  const attrs1 = form1.Attributes;
  const attrs2 = form2.Attributes;
  
  if (attrs1) {
    const attrs1Array = Array.isArray(attrs1.Attribute) ? attrs1.Attribute : (attrs1.Attribute ? [attrs1.Attribute] : []);
    console.log(`Form1: ${attrs1Array.length} атрибутов`);
  } else {
    console.log('Form1: Attributes отсутствует');
  }
  
  if (attrs2) {
    const attrs2Array = Array.isArray(attrs2.Attribute) ? attrs2.Attribute : (attrs2.Attribute ? [attrs2.Attribute] : []);
    console.log(`Form2: ${attrs2Array.length} атрибутов`);
  } else {
    console.log('Form2: Attributes отсутствует');
  }
  
  // Проверяем Commands
  console.log('\n=== Commands ===');
  const cmds1 = form1.Commands;
  const cmds2 = form2.Commands;
  
  if (cmds1) {
    const cmds1Array = Array.isArray(cmds1.Command) ? cmds1.Command : (cmds1.Command ? [cmds1.Command] : []);
    console.log(`Form1: ${cmds1Array.length} команд`);
  } else {
    console.log('Form1: Commands отсутствует');
  }
  
  if (cmds2) {
    const cmds2Array = Array.isArray(cmds2.Command) ? cmds2.Command : (cmds2.Command ? [cmds2.Command] : []);
    console.log(`Form2: ${cmds2Array.length} команд`);
  } else {
    console.log('Form2: Commands отсутствует');
  }
  
  // Проверяем CommandInterface
  console.log('\n=== CommandInterface ===');
  const ci1Present = !!form1.CommandInterface;
  const ci2Present = !!form2.CommandInterface;
  console.log(`Form1: CommandInterface ${ci1Present ? 'присутствует' : 'отсутствует'}`);
  console.log(`Form2: CommandInterface ${ci2Present ? 'присутствует' : 'отсутствует'}`);
  
  // Проверяем CommandSet
  console.log('\n=== CommandSet ===');
  const cs1Present = !!form1.CommandSet;
  const cs2Present = !!form2.CommandSet;
  console.log(`Form1: CommandSet ${cs1Present ? 'присутствует' : 'отсутствует'}`);
  console.log(`Form2: CommandSet ${cs2Present ? 'присутствует' : 'отсутствует'}`);
  
  // Итоговый диагноз
  console.log('\n=== ИТОГОВЫЙ ДИАГНОЗ ===\n');
  
  let issues = [];
  
  if (!ci2Present && ci1Present) {
    issues.push('CommandInterface отсутствует в Form2');
  }
  
  if (!cs2Present && cs1Present) {
    issues.push('CommandSet отсутствует в Form2');
  }
  
  if (issues.length === 0) {
    console.log('✓ Проблем не обнаружено');
  } else {
    console.log('✗ Найдены проблемы:');
    issues.forEach(issue => console.log(`  ${issue}`));
  }
  
} else if (isDCS) {
  // Анализ для DCS (оригинальный код)
  const schema1 = parsed1.DataCompositionSchema || {};
  const schema2 = parsed2.DataCompositionSchema || {};

  // Анализируем totalField
  console.log('=== totalField (ресурс) ===');
  if (schema2.totalField) {
    const tf = Array.isArray(schema2.totalField) ? schema2.totalField[0] : schema2.totalField;
    console.log('Структура totalField:');
    console.log(JSON.stringify(tf, null, 2).substring(0, 500));
  }

  // Анализируем calculatedField
  console.log('\n=== calculatedField (вычисляемое поле) ===');
  if (schema2.calculatedField) {
    const cf = Array.isArray(schema2.calculatedField) ? schema2.calculatedField[0] : schema2.calculatedField;
    console.log('Структура calculatedField:');
    console.log(JSON.stringify(cf, null, 2).substring(0, 500));
  }

  // Анализируем settingsVariant (группировка может быть здесь)
  console.log('\n=== settingsVariant (настройки/группировки) ===');
  if (schema2.settingsVariant) {
    const sv = Array.isArray(schema2.settingsVariant) ? schema2.settingsVariant[0] : schema2.settingsVariant;
    
    // Проверяем структуру настроек
    if (sv.settings && sv.settings.structure) {
      console.log('✓ Есть структура (structure) в settingsVariant');
      
      // Проверяем детали группировок
      const structure = sv.settings.structure;
      console.log('Структура settings.structure:');
      console.log(JSON.stringify(structure, null, 2).substring(0, 1000));
    } else {
      console.log('✗ Нет структуры в settingsVariant');
    }
  }

  // Проверяем dataSet - запрос и поля
  console.log('\n=== dataSet (запрос и поля) ===');
  const ds1 = Array.isArray(schema1.dataSet) ? schema1.dataSet[0] : schema1.dataSet;
  const ds2 = Array.isArray(schema2.dataSet) ? schema2.dataSet[0] : schema2.dataSet;

  if (ds1 && ds1.query) {
    console.log('\nИсходный запрос (первые 500 символов):');
    console.log(ds1.query.substring(0, 500));
  }

  if (ds2 && ds2.query) {
    console.log('\nНовый запрос (первые 500 символов):');
    console.log(ds2.query.substring(0, 500));
  }

  // Анализируем поля в dataSet
  if (ds1 && ds2) {
    const fields1 = Array.isArray(ds1.field) ? ds1.field : (ds1.field ? [ds1.field] : []);
    const fields2 = Array.isArray(ds2.field) ? ds2.field : (ds2.field ? [ds2.field] : []);

    console.log(`\n=== Поля в dataSet ===`);
    console.log(`Template1: ${fields1.length} полей`);
    console.log(`Template2: ${fields2.length} полей`);

    // Проверяем порядок полей
    console.log('\nПоля в Template2:');
    fields2.forEach((f, i) => {
      const dp = f.dataPath;
      const xsiType = f['@_xsi:type'];
      console.log(`  ${i + 1}. ${dp} (${xsiType || 'no type'})`);
    });

    // Проверяем, есть ли поля для вычисляемого поля и ресурса
    console.log('\n=== Проверка консистентности ===');

    // Ищем поле для calculatedField
    if (schema2.calculatedField) {
      const cf = Array.isArray(schema2.calculatedField) ? schema2.calculatedField[0] : schema2.calculatedField;
      const cfDataPath = cf.dataPath;
      
      const hasField = fields2.some(f => f.dataPath === cfDataPath);
      console.log(`calculatedField "${cfDataPath}": ${hasField ? '✓ поле есть в dataSet' : '✗ поле отсутствует в dataSet'}`);
    }

    // Ищем поле для totalField
    if (schema2.totalField) {
      const tf = Array.isArray(schema2.totalField) ? schema2.totalField[0] : schema2.totalField;
      const tfDataPath = tf.dataPath;
      
      const hasField = fields2.some(f => f.dataPath === tfDataPath);
      console.log(`totalField "${tfDataPath}": ${hasField ? '✓ поле есть в dataSet' : '✗ поле отсутствует в dataSet'}`);
    }

    // Проверяем наличие dataSource в dataSet
    console.log('\n=== Проверка dataSource ===');
    console.log(`Template1 dataSet.dataSource: ${ds1.dataSource || 'НЕТ'}`);
    console.log(`Template2 dataSet.dataSource: ${ds2.dataSource || 'НЕТ'}`);

    // Форматированный вывод
    console.log('\n=== Предложения по улучшению ===');

    let issues = [];

    if (!ds2.dataSource) {
      issues.push('1. Отсутствует <dataSource> в <dataSet> - это может вызвать проблемы');
    }

    if (schema2.calculatedField) {
      const cf = Array.isArray(schema2.calculatedField) ? schema2.calculatedField[0] : schema2.calculatedField;
      if (!fields2.some(f => f.dataPath === cf.dataPath)) {
        issues.push(`2. calculatedField "${cf.dataPath}" должно иметь соответствующее поле в dataSet`);
      }
    }

    if (schema2.totalField) {
      const tf = Array.isArray(schema2.totalField) ? schema2.totalField[0] : schema2.totalField;
      if (!fields2.some(f => f.dataPath === tf.dataPath)) {
        issues.push(`3. totalField "${tf.dataPath}" должно иметь соответствующее поле в dataSet`);
      }
    }

    if (issues.length === 0) {
      console.log('✓ Проблем не обнаружено');
    } else {
      console.log('✗ Найдены проблемы:');
      issues.forEach(issue => console.log(`  ${issue}`));
    }
  }
} else {
  console.log('✗ Неизвестный тип XML (ни Form, ни DataCompositionSchema)');
}

