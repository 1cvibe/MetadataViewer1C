/**
 * Тест одного объекта для быстрой проверки
 */

const path = require('path');
const { testObjectSave } = require('./metadata-save-test');

(async () => {
    const testFile = path.join(__dirname, 'metadata-save-tests', 'Constant', 'ibs_ГлубинаСообщенийЦНСИ.xml');
    const result = await testObjectSave('Constant', testFile);
    console.log('\n=== Результат теста ===');
    console.log(JSON.stringify(result, null, 2));
})().catch(error => {
    console.error('Ошибка:', error);
    process.exit(1);
});

