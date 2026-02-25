/**
 * Расширенный скрипт для проверки видимости модальных окон
 * Выполнить в консоли DevTools webview
 */

(function() {
  console.log('=== РАСШИРЕННАЯ ПРОВЕРКА МОДАЛЬНЫХ ОКОН ===\n');
  
  // 1. Проверка базовой структуры DOM
  console.log('1. Проверка DOM структуры:');
  const root = document.getElementById('root');
  console.log('  - Root элемент найден:', !!root);
  
  const formEditor = document.querySelector('.form-editor');
  console.log('  - FormEditor найден:', !!formEditor);
  
  const metadataEditor = document.querySelector('.metadata-editor');
  console.log('  - MetadataEditor найден:', !!metadataEditor);
  
  // 2. Проверка модальных окон
  console.log('\n2. Проверка модальных окон:');
  const modalOverlays = document.querySelectorAll('.modal-overlay');
  console.log('  - Найдено элементов с классом .modal-overlay:', modalOverlays.length);
  
  if (modalOverlays.length > 0) {
    modalOverlays.forEach((modal, index) => {
      const style = window.getComputedStyle(modal);
      const rect = modal.getBoundingClientRect();
      const isVisible = style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0' &&
                       rect.width > 0 && 
                       rect.height > 0;
      
      console.log(`\n  Модальное окно #${index + 1}:`);
      console.log('    - display:', style.display);
      console.log('    - visibility:', style.visibility);
      console.log('    - opacity:', style.opacity);
      console.log('    - width:', rect.width);
      console.log('    - height:', rect.height);
      console.log('    - position:', style.position);
      console.log('    - z-index:', style.zIndex);
      console.log('    - ВИДИМОЕ:', isVisible);
      console.log('    - Родитель:', modal.parentElement?.className || 'нет');
    });
  } else {
    console.log('  ✓ Модальные окна не найдены в DOM (это правильно!)');
  }
  
  // 3. Проверка всех модальных компонентов по именам классов
  console.log('\n3. Поиск всех возможных модальных элементов:');
  const allModals = document.querySelectorAll('[class*="modal"], [class*="Modal"], [class*="overlay"]');
  console.log('  - Найдено элементов с "modal" в классе:', allModals.length);
  if (allModals.length > 0) {
    allModals.forEach((el, i) => {
      console.log(`    ${i + 1}. ${el.className} - ${el.tagName}`);
    });
  }
  
  // 4. Проверка вкладок
  console.log('\n4. Проверка вкладок:');
  const tabs = document.querySelectorAll('.editor-tab');
  console.log('  - Количество вкладок:', tabs.length);
  tabs.forEach((tab, i) => {
    const isActive = tab.classList.contains('active') || tab.classList.contains('is-active');
    console.log(`    Вкладка ${i + 1}: "${tab.textContent?.trim()}" - активна: ${isActive}`);
  });
  
  // 5. Проверка состояния React (если доступно)
  console.log('\n5. Проверка React DevTools:');
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('  ✓ React DevTools доступен');
    try {
      const reactFiber = root?._reactInternalFiber || root?._reactInternalInstance;
      if (reactFiber) {
        console.log('  ✓ React Fiber найден');
      }
    } catch (e) {
      console.log('  - Не удалось получить доступ к React Fiber');
    }
  } else {
    console.log('  - React DevTools не доступен');
  }
  
  // 6. Проверка всех компонентов FormEditor
  console.log('\n6. Поиск всех компонентов FormEditor:');
  const formEditorElements = document.querySelectorAll('[class*="form"], [class*="Form"], [class*="editor"]');
  console.log('  - Найдено элементов с "form"/"Form"/"editor" в классе:', formEditorElements.length);
  
  // 7. Проверка атрибутов data-*
  console.log('\n7. Проверка data-атрибутов (если есть):');
  const dataElements = document.querySelectorAll('[data-modal], [data-is-open], [aria-hidden]');
  console.log('  - Найдено элементов с data-атрибутами:', dataElements.length);
  if (dataElements.length > 0) {
    dataElements.forEach((el, i) => {
      console.log(`    ${i + 1}. ${el.tagName}.${el.className}`);
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('data-') || attr.name.startsWith('aria-')) {
          console.log(`      - ${attr.name}: ${attr.value}`);
        }
      });
    });
  }
  
  // 8. Проверка стилей через computed styles всех элементов
  console.log('\n8. Детальная проверка всех элементов с классом содержащим "modal":');
  const modalElements = Array.from(document.querySelectorAll('*')).filter(el => {
    const className = el.className?.toString() || '';
    return className.toLowerCase().includes('modal') || className.toLowerCase().includes('overlay');
  });
  console.log('  - Всего найдено элементов:', modalElements.length);
  modalElements.forEach((el, i) => {
    const style = window.getComputedStyle(el);
    console.log(`\n    Элемент ${i + 1}: ${el.tagName}.${el.className}`);
    console.log(`      - display: ${style.display}`);
    console.log(`      - visibility: ${style.visibility}`);
    console.log(`      - position: ${style.position}`);
    console.log(`      - z-index: ${style.zIndex}`);
    console.log(`      - Родитель: ${el.parentElement?.className || 'нет'}`);
  });
  
  console.log('\n=== ПРОВЕРКА ЗАВЕРШЕНА ===');
  console.log('\nИнтерпретация результатов:');
  if (modalOverlays.length === 0) {
    console.log('✓ УСПЕХ: Модальные окна не рендерятся в DOM при загрузке - это правильное поведение!');
  } else {
    const visibleModals = Array.from(modalOverlays).filter(modal => {
      const style = window.getComputedStyle(modal);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    if (visibleModals.length === 0) {
      console.log('⚠ ВНИМАНИЕ: Модальные окна найдены в DOM, но скрыты через CSS');
    } else {
      console.log('❌ ОШИБКА: Найдены видимые модальные окна! Они не должны быть видны при загрузке.');
    }
  }
})();

