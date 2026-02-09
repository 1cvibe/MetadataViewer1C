// ПРОСТОЙ СКРИПТ ДЛЯ ПРОВЕРКИ - скопируйте ВЕСЬ этот код в консоль DevTools

(function() {
  'use strict';
  
  const modals = document.querySelectorAll('.modal-overlay');
  const count = modals.length;
  
  console.log('=== РЕЗУЛЬТАТ ПРОВЕРКИ ===');
  console.log('Количество элементов .modal-overlay:', count);
  
  if (count === 0) {
    console.log('✓ УСПЕХ: Модальные окна НЕ рендерятся в DOM');
    console.log('Это правильное поведение!');
    return 'SUCCESS: Модальные окна скрыты';
  } else {
    console.log('⚠ НАЙДЕНЫ элементы в DOM. Проверяю видимость...');
    
    let visible = 0;
    modals.forEach((m, i) => {
      const s = window.getComputedStyle(m);
      const isVisible = s.display !== 'none' && s.visibility !== 'hidden';
      if (isVisible) visible++;
      console.log(`  Modal ${i+1}: display=${s.display}, visible=${isVisible}`);
    });
    
    if (visible === 0) {
      console.log('✓ ОК: Модальные окна в DOM, но скрыты');
      return 'OK: Модальные окна скрыты через CSS';
    } else {
      console.log(`❌ ПРОБЛЕМА: ${visible} модальных окон ВИДИМЫ!`);
      return 'ERROR: Видимые модальные окна найдены';
    }
  }
})();

