/**
 * UI тест для проверки видимости модальных окон в редакторе метаданных
 * Проверяет документ "Сборка" или первый доступный документ
 */

const fs = require('fs');
const path = require('path');

// Пути для поиска документа "Сборка"
const SEARCH_PATHS = [
  'D:\\1C\\BASE\\src\\cf\\Documents',
  path.join(__dirname, '../test-cases/metadata-save-tests/Document'),
  path.join(__dirname, '../test-cases'),
];

/**
 * Находит файл документа "Сборка" или любой документ
 */
function findDocumentFile() {
  for (const searchPath of SEARCH_PATHS) {
    if (!fs.existsSync(searchPath)) {
      continue;
    }

    // Сначала ищем "Сборка"
    try {
      const entries = fs.readdirSync(searchPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(searchPath, entry.name);
        
        if (entry.isDirectory()) {
          // Ищем в подпапках
          const sborkaDir = path.join(fullPath, 'Сборка.xml');
          if (fs.existsSync(sborkaDir)) {
            return sborkaDir;
          }
          
          // Ищем файлы в подпапках
          try {
            const subEntries = fs.readdirSync(fullPath, { withFileTypes: true });
            for (const subEntry of subEntries) {
              if (subEntry.isFile() && subEntry.name.includes('Сборка') && subEntry.name.endsWith('.xml')) {
                return path.join(fullPath, subEntry.name);
              }
            }
          } catch (e) {
            // Пропускаем недоступные папки
          }
        } else if (entry.isFile() && entry.name.includes('Сборка') && entry.name.endsWith('.xml')) {
          return fullPath;
        }
      }
      
      // Если не нашли "Сборка", берем первый XML файл документа
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.xml')) {
          const fullPath = path.join(searchPath, entry.name);
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.includes('<MetaDataObject') && content.includes('Document')) {
            console.log(`Используется документ: ${entry.name} (вместо "Сборка")`);
            return fullPath;
          }
        }
      }
      
      // Ищем в подпапках
      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            const subPath = path.join(searchPath, entry.name);
            const subEntries = fs.readdirSync(subPath, { withFileTypes: true });
            for (const subEntry of subEntries) {
              if (subEntry.isFile() && subEntry.name.endsWith('.xml')) {
                const fullPath = path.join(subPath, subEntry.name);
                const content = fs.readFileSync(fullPath, 'utf-8');
                if (content.includes('<MetaDataObject') && content.includes('Document')) {
                  console.log(`Используется документ: ${entry.name}/${subEntry.name}`);
                  return fullPath;
                }
              }
            }
          } catch (e) {
            // Пропускаем
          }
        }
      }
    } catch (error) {
      console.warn(`Ошибка при поиске в ${searchPath}: ${error.message}`);
    }
  }
  
  return null;
}

/**
 * Парсит XML и извлекает информацию о структуре
 */
function analyzeDocumentStructure(xmlPath) {
  const content = fs.readFileSync(xmlPath, 'utf-8');
  const nameMatch = content.match(/<Name>([^<]+)<\/Name>/);
  const name = nameMatch ? nameMatch[1] : path.basename(xmlPath, '.xml');
  
  const hasAttributes = content.includes('<Attributes>');
  const hasTabularSections = content.includes('<TabularSections>');
  const hasForms = content.includes('<Forms>');
  const hasCommands = content.includes('<Commands>');
  
  // Подсчитываем количество реквизитов
  const attrMatches = content.match(/<Attribute>/g);
  const attrCount = attrMatches ? attrMatches.length : 0;
  
  // Подсчитываем количество табличных частей
  const tsMatches = content.match(/<TabularSection>/g);
  const tsCount = tsMatches ? tsMatches.length : 0;
  
  return {
    name,
    path: xmlPath,
    hasAttributes,
    hasTabularSections,
    hasForms,
    hasCommands,
    attributeCount: attrCount,
    tabularSectionCount: tsCount
  };
}

/**
 * Создает HTML файл для визуального тестирования
 */
function createHtmlTestFile(documentInfo) {
  const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест видимости модальных окон - ${documentInfo.name}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            background: #1e1e1e;
            color: #cccccc;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #4ec9b0;
        }
        .info-box {
            background: #252526;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .info-box h2 {
            margin-top: 0;
            color: #4ec9b0;
        }
        .info-item {
            margin: 10px 0;
        }
        .info-label {
            font-weight: bold;
            color: #cccccc;
        }
        .info-value {
            color: #4ec9b0;
        }
        .test-instructions {
            background: #1e3a5f;
            border-left: 4px solid #007acc;
            padding: 15px;
            margin: 20px 0;
        }
        .test-instructions h3 {
            margin-top: 0;
            color: #4ec9b0;
        }
        .test-instructions ol {
            margin-left: 20px;
        }
        .test-instructions li {
            margin: 10px 0;
            line-height: 1.6;
        }
        .warning {
            background: #5a1d1d;
            border-left: 4px solid #f48771;
            padding: 15px;
            margin: 20px 0;
        }
        .warning h3 {
            margin-top: 0;
            color: #f48771;
        }
        .success {
            background: #1d3a1d;
            border-left: 4px solid #89d185;
            padding: 15px;
            margin: 20px 0;
        }
        .success h3 {
            margin-top: 0;
            color: #89d185;
        }
        code {
            background: #252526;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #dcdcaa;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Тест видимости модальных окон в редакторе метаданных</h1>
        
        <div class="info-box">
            <h2>Информация о документе</h2>
            <div class="info-item">
                <span class="info-label">Название:</span>
                <span class="info-value">${documentInfo.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Путь:</span>
                <span class="info-value">${documentInfo.path}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Реквизиты:</span>
                <span class="info-value">${documentInfo.attributeCount} ${documentInfo.hasAttributes ? '✓' : '✗'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Табличные части:</span>
                <span class="info-value">${documentInfo.tabularSectionCount} ${documentInfo.hasTabularSections ? '✓' : '✗'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Формы:</span>
                <span class="info-value">${documentInfo.hasForms ? '✓' : '✗'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Команды:</span>
                <span class="info-value">${documentInfo.hasCommands ? '✓' : '✗'}</span>
            </div>
        </div>
        
        <div class="test-instructions">
            <h3>📋 Инструкции по тестированию</h3>
            <ol>
                <li>Откройте VS Code с установленным расширением "1C Metadata Viewer"</li>
                <li>Откройте файл документа: <code>${path.basename(documentInfo.path)}</code></li>
                <li>Нажмите правой кнопкой мыши на файл в проводнике и выберите команду <code>"Редактировать метаданные"</code></li>
                <li>Откройте DevTools для webview:
                    <ul>
                        <li>Нажмите <code>Ctrl+Shift+I</code> (или <code>Cmd+Option+I</code> на Mac)</li>
                        <li>Или через меню: <code>Help → Toggle Developer Tools</code></li>
                    </ul>
                </li>
                <li>В консоли браузера выполните следующие проверки:</li>
            </ol>
        </div>
        
        <div class="warning">
            <h3>⚠️ Что проверять</h3>
            <ol>
                <li><strong>При загрузке редактора:</strong>
                    <ul>
                        <li>Все модальные окна должны быть скрыты (не видны в DOM или имеют <code>display: none</code>)</li>
                        <li>В консоли не должно быть ошибок</li>
                        <li>Все вкладки (Properties, Attributes, Tabular, Forms, Commands) должны отображаться корректно</li>
                    </ul>
                </li>
                <li><strong>При переключении вкладок:</strong>
                    <ul>
                        <li>Модальные окна остаются скрытыми</li>
                        <li>Содержимое вкладок загружается корректно</li>
                    </ul>
                </li>
                <li><strong>При открытии модального окна (например, редактирование типа реквизита):</strong>
                    <ul>
                        <li>Модальное окно появляется только после явного действия (клик на кнопку редактирования)</li>
                        <li>Оверлей (затемнение фона) отображается корректно</li>
                        <li>Модальное окно находится по центру экрана</li>
                    </ul>
                </li>
            </ol>
        </div>
        
        <div class="success">
            <h3>✅ Критерии успеха</h3>
            <ul>
                <li>✓ При открытии редактора метаданных все модальные окна скрыты</li>
                <li>✓ Модальные окна не видны на всех вкладках при первоначальной загрузке</li>
                <li>✓ Модальные окна появляются только при явном действии пользователя</li>
                <li>✓ Нет ошибок в консоли браузера</li>
                <li>✓ Переключение между вкладками не вызывает появление модальных окон</li>
            </ul>
        </div>
        
        <div class="test-instructions">
            <h3>🔍 Команды для проверки в консоли браузера</h3>
            <p>Выполните следующие команды в консоли DevTools:</p>
            <pre style="background: #252526; padding: 15px; border-radius: 4px; overflow-x: auto;">
// Проверка наличия модальных окон в DOM
const modalOverlays = document.querySelectorAll('.modal-overlay');
console.log('Количество модальных окон в DOM:', modalOverlays.length);

// Проверка видимости модальных окон
modalOverlays.forEach((modal, index) => {
    const style = window.getComputedStyle(modal);
    const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
    console.log(\`Модальное окно #\${index + 1}: видимое=\${isVisible}, display=\${style.display}, visibility=\${style.visibility}\`);
});

// Проверка компонентов FormEditor
const formEditor = document.querySelector('.form-editor');
console.log('FormEditor найден:', !!formEditor);

// Проверка вкладок
const tabs = document.querySelectorAll('.editor-tab');
console.log('Количество вкладок:', tabs.length);

// Проверка состояния React компонентов (если доступно)
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('React DevTools доступен для детальной проверки');
}
            </pre>
        </div>
    </div>
</body>
</html>`;

  const htmlPath = path.join(__dirname, 'test-modal-visibility-sborka.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  return htmlPath;
}

/**
 * Основная функция теста
 */
async function runTest() {
  console.log('=== ТЕСТ ВИДИМОСТИ МОДАЛЬНЫХ ОКОН ===\n');
  
  // Находим документ
  console.log('Поиск документа "Сборка"...');
  const documentPath = findDocumentFile();
  
  if (!documentPath) {
    console.error('❌ Документ не найден ни в одной из указанных папок:');
    SEARCH_PATHS.forEach(p => console.error(`   - ${p}`));
    console.error('\nУбедитесь, что путь к документам указан правильно или используйте тестовые данные.');
    return;
  }
  
  console.log(`✅ Найден документ: ${documentPath}\n`);
  
  // Анализируем структуру
  const documentInfo = analyzeDocumentStructure(documentPath);
  console.log('Структура документа:');
  console.log(`  Название: ${documentInfo.name}`);
  console.log(`  Реквизиты: ${documentInfo.attributeCount}`);
  console.log(`  Табличные части: ${documentInfo.tabularSectionCount}`);
  console.log(`  Формы: ${documentInfo.hasForms ? 'да' : 'нет'}`);
  console.log(`  Команды: ${documentInfo.hasCommands ? 'да' : 'нет'}\n`);
  
  // Создаем HTML файл для инструкций
  const htmlPath = createHtmlTestFile(documentInfo);
  console.log(`✅ Создан HTML файл с инструкциями: ${htmlPath}\n`);
  
  console.log('=== ИНСТРУКЦИИ ПО ТЕСТИРОВАНИЮ ===\n');
  console.log('1. Откройте VS Code с расширением "1C Metadata Viewer"');
  console.log(`2. Откройте файл документа: ${documentPath}`);
  console.log('3. Нажмите правой кнопкой мыши на файл и выберите "Редактировать метаданные"');
  console.log('4. Откройте DevTools для webview (Ctrl+Shift+I или Cmd+Option+I)');
  console.log('5. Проверьте видимость модальных окон при загрузке');
  console.log('6. Переключайтесь между вкладками и проверьте, что модальные окна остаются скрытыми');
  console.log('7. Откройте модальное окно (например, редактирование типа реквизита) и проверьте, что оно появляется только после явного действия\n');
  
  console.log(`📄 HTML файл с детальными инструкциями: ${htmlPath}`);
  console.log('   Откройте этот файл в браузере для просмотра полных инструкций\n');
  
  console.log('=== ПРОВЕРКА В КОНСОЛИ БРАУЗЕРА ===\n');
  console.log('Выполните в консоли DevTools:');
  console.log('  const modalOverlays = document.querySelectorAll(".modal-overlay");');
  console.log('  modalOverlays.forEach((modal, i) => {');
  console.log('    const style = window.getComputedStyle(modal);');
  console.log('    console.log(`Modal #${i}: visible=${style.display !== "none"}`);');
  console.log('  });\n');
  
  console.log('=== ОЖИДАЕМЫЙ РЕЗУЛЬТАТ ===\n');
  console.log('✓ При загрузке редактора все модальные окна должны быть скрыты');
  console.log('✓ В консоли не должно быть ошибок');
  console.log('✓ Все вкладки должны отображаться корректно');
  console.log('✓ Модальные окна появляются только при явном действии пользователя\n');
  
  console.log('=== ТЕСТ ЗАВЕРШЕН ===');
}

// Запускаем тест
runTest().catch(console.error);

