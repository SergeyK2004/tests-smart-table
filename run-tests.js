const { execSync } = require('child_process');

try {
  // Сначала запускаем только отрисовку
  console.log('Запуск тестов отрисовки...');
  execSync('npx playwright test table.render.spec.ts', { stdio: 'inherit' });

  // Если отрисовка прошла - запускаем остальные
  console.log('Отрисовка успешна. Запуск остальных тестов...');
  execSync('npx playwright test', { stdio: 'inherit' });

} catch (error) {
  console.log('Тесты отрисовки упали. Остальные тесты не запускаются.');
  process.exit(1);
}