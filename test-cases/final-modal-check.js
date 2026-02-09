// ФИНАЛЬНЫЙ СКРИПТ ПРОВЕРКИ - скопируйте и выполните в консоли DevTools

console.log('=== НАЧАЛО ПРОВЕРКИ ===');

const modals = document.querySelectorAll('.modal-overlay');
const count = modals.length;

console.log('Количество .modal-overlay:', count);

if (count === 0) {
  console.log('✓ Модальные окна НЕ найдены в DOM - это ПРАВИЛЬНО!');
} else {
  console.log('⚠ Найдено модальных окон:', count);
  modals.forEach((m, i) => {
    const style = window.getComputedStyle(m);
    const rect = m.getBoundingClientRect();
    console.log(`Модальное окно ${i+1}:`);
    console.log('  - display:', style.display);
    console.log('  - visibility:', style.visibility);
    console.log('  - width:', rect.width);
    console.log('  - height:', rect.height);
  });
}

console.log('=== КОНЕЦ ПРОВЕРКИ ===');

// Возвращаем результат для явного отображения
count;

