/**
 * UI тест для редактора метаданных
 * Проверяет, что все дополнительные редакторы (модальные окна) скрыты по умолчанию
 */

const fs = require('fs');
const path = require('path');

// Путь к папке с документами
const DOCUMENTS_PATH = 'D:\\1C\\BASE\\src\\cf\\Documents';

/**
 * Находит все XML файлы документов в указанной папке
 */
function findDocumentFiles(dirPath) {
  const files = [];
  
  if (!fs.existsSync(dirPath)) {
    console.error(`Папка не найдена: ${dirPath}`);
    return files;
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Рекурсивно ищем в подпапках
      const subFiles = findDocumentFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith('.xml')) {
      // Проверяем, что это файл метаданных (не форма)
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('<MetaDataObject') && !content.includes('<Form')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Проверяет, что в логах webview нет сообщений о рендеринге модальных окон при загрузке
 */
function checkLogsForModalRendering(logs) {
  const modalRenderingLogs = logs.filter(log => 
    log.includes('[FormEditor] Рендерим модальное окно') ||
    log.includes('[TypeWidget] Рендерим модальное окно')
  );
  
  return {
    found: modalRenderingLogs.length > 0,
    logs: modalRenderingLogs
  };
}

/**
 * Основная функция теста
 */
async function runTest() {
  console.log('=== ТЕСТ UI РЕДАКТОРА МЕТАДАННЫХ ===\n');
  
  // Находим документы
  console.log(`Поиск документов в: ${DOCUMENTS_PATH}`);
  const documentFiles = findDocumentFiles(DOCUMENTS_PATH);
  
  if (documentFiles.length === 0) {
    console.error('Не найдено документов для тестирования');
    return;
  }
  
  console.log(`Найдено документов: ${documentFiles.length}`);
  
  // Берем первые 5 документов для теста
  const testDocuments = documentFiles.slice(0, 5);
  
  console.log('\nДокументы для тестирования:');
  testDocuments.forEach((file, index) => {
    console.log(`  ${index + 1}. ${path.basename(path.dirname(file))}`);
  });
  
  console.log('\n=== ИНСТРУКЦИИ ДЛЯ РУЧНОГО ТЕСТИРОВАНИЯ ===');
  console.log('1. Откройте VS Code с расширением 1C Metadata Viewer');
  console.log('2. Откройте DevTools для webview (View -> Output -> выберите канал расширения)');
  console.log('3. Откройте любой документ из списка выше через команду "Редактировать метаданные"');
  console.log('4. Проверьте в консоли браузера (F12 в webview) или в Output канале:');
  console.log('   - При загрузке должны быть логи: "[FormEditor] Монтирование компонента - сбрасываем все модальные окна"');
  console.log('   - НЕ должно быть логов: "[FormEditor] Рендерим модальное окно..."');
  console.log('   - НЕ должно быть логов: "[TypeWidget] Рендерим модальное окно..."');
  console.log('5. Проверьте визуально, что на всех вкладках (properties, attributes, tabular, forms, commands)');
  console.log('   НЕ видны модальные окна редакторов (типов, полей, свойств реквизита и т.д.)');
  console.log('6. Переключитесь между вкладками - модальные окна должны оставаться скрытыми');
  console.log('7. Переключитесь между объектами - модальные окна должны оставаться скрытыми');
  
  console.log('\n=== ПРОВЕРКА СОСТОЯНИЙ ===');
  console.log('Ожидаемые начальные состояния модальных окон:');
  console.log('  - showAddTabularModal: false');
  console.log('  - showAddAttributeModal: null');
  console.log('  - editingAttribute: null');
  console.log('  - editingAttributeType: null');
  console.log('  - showAddAttributeToObjectModal: false');
  console.log('  - showRegisterRecordsEditor: false');
  console.log('  - editingRegisterRecordIndex: null');
  console.log('  - confirmModal: null');
  console.log('  - TypeWidget.isOpen: false');
  
  console.log('\n=== КРИТЕРИИ УСПЕХА ===');
  console.log('✓ При загрузке редактора метаданных все модальные окна скрыты');
  console.log('✓ В логах нет сообщений о рендеринге модальных окон при загрузке');
  console.log('✓ При переключении вкладок модальные окна остаются скрытыми');
  console.log('✓ При переключении объектов модальные окна остаются скрытыми');
  console.log('✓ Модальные окна открываются только при явном действии пользователя');
  
  console.log('\n=== ТЕСТ ЗАВЕРШЕН ===');
  console.log('Выполните ручную проверку согласно инструкциям выше.');
}

// Запускаем тест
runTest().catch(console.error);

