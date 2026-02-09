/**
 * Улучшенный скрипт проверки модальных окон для DevTools
 * Скопируйте и вставьте весь этот код в консоль DevTools
 */

console.clear();
console.log('=== ПРОВЕРКА МОДАЛЬНЫХ ОКОН В РЕДАКТОРЕ МЕТАДАННЫХ ===\n');

// 1. Базовая проверка DOM
const root = document.getElementById('root');
console.log('1. Root элемент:', root ? 'НАЙДЕН ✓' : 'НЕ НАЙДЕН ✗');

const formEditor = document.querySelector('.form-editor');
console.log('2. FormEditor:', formEditor ? 'НАЙДЕН ✓' : 'НЕ НАЙДЕН ✗');

// 2. Проверка модальных окон
const modalOverlays = document.querySelectorAll('.modal-overlay');
console.log('\n3. Модальные окна (.modal-overlay):');
console.log('   Найдено элементов:', modalOverlays.length);

if (modalOverlays.length === 0) {
  console.log('   ✓ ОТЛИЧНО: Модальные окна не рендерятся в DOM!');
  console.log('   Это правильное поведение - они должны появляться только при открытии.');
} else {
  console.log('   ⚠ НАЙДЕНЫ элементы в DOM. Проверяю видимость...');
  
  let visibleCount = 0;
  modalOverlays.forEach((modal, index) => {
    const style = window.getComputedStyle(modal);
    const rect = modal.getBoundingClientRect();
    const isVisible = style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     style.opacity !== '0' &&
                     rect.width > 0 && 
                     rect.height > 0;
    
    if (isVisible) {
      visibleCount++;
      console.log(`\n   ❌ Модальное окно #${index + 1} ВИДИМО:`);
      console.log(`      display: ${style.display}`);
      console.log(`      visibility: ${style.visibility}`);
      console.log(`      position: ${style.position}`);
      console.log(`      z-index: ${style.zIndex}`);
      console.log(`      размеры: ${rect.width}x${rect.height}`);
    } else {
      console.log(`\n   ✓ Модальное окно #${index + 1} скрыто:`);
      console.log(`      display: ${style.display}`);
      console.log(`      visibility: ${style.visibility}`);
    }
  });
  
  if (visibleCount === 0) {
    console.log('\n   ✓ ВСЕ модальные окна скрыты (хотя они в DOM)');
  } else {
    console.log(`\n   ❌ ПРОБЛЕМА: ${visibleCount} модальных окон видимы!`);
  }
}

// 3. Поиск всех элементов с "modal" в классе
console.log('\n4. Поиск всех элементов с "modal" в классе:');
const allModalElements = Array.from(document.querySelectorAll('*')).filter(el => {
  const className = (el.className?.toString() || '').toLowerCase();
  return className.includes('modal') || className.includes('overlay');
});

console.log('   Найдено элементов:', allModalElements.length);
if (allModalElements.length > 0) {
  const uniqueClasses = [...new Set(allModalElements.map(el => el.className))];
  console.log('   Уникальные классы:', uniqueClasses.slice(0, 10).join(', '));
}

// 4. Проверка вкладок
console.log('\n5. Вкладки:');
const tabs = document.querySelectorAll('.editor-tab');
console.log('   Найдено вкладок:', tabs.length);
if (tabs.length > 0) {
  tabs.forEach((tab, i) => {
    const text = tab.textContent?.trim() || 'без текста';
    const isActive = tab.classList.contains('active') || tab.classList.contains('is-active');
    console.log(`   ${i + 1}. "${text}" ${isActive ? '(активна)' : ''}`);
  });
}

// 5. Финальный вердикт
console.log('\n=== ИТОГОВЫЙ РЕЗУЛЬТАТ ===');
if (modalOverlays.length === 0) {
  console.log('✓ УСПЕХ: Модальные окна НЕ рендерятся в DOM при загрузке');
  console.log('  Это правильное поведение!');
} else {
  const visibleModals = Array.from(modalOverlays).filter(modal => {
    const style = window.getComputedStyle(modal);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
  
  if (visibleModals.length === 0) {
    console.log('⚠ ВНИМАНИЕ: Модальные окна найдены в DOM, но скрыты через CSS');
    console.log('  Это приемлемо, но идеально - не рендерить их вообще');
  } else {
    console.log(`❌ ОШИБКА: Найдено ${visibleModals.length} видимых модальных окон!`);
    console.log('  Они НЕ должны быть видны при загрузке!');
  }
}

console.log('\n=== ПРОВЕРКА ЗАВЕРШЕНА ===');

