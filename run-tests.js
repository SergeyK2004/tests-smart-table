const { execSync } = require('child_process');

// Версию стартера задаёт его workflow (STARTER_VERSION). Нет переменной — старый стартер, версия 1
const STARTER_VERSION = Number(process.env.STARTER_VERSION) || 1;
const config = process.env.PLAYWRIGHT_CONFIG ? ` --config ${process.env.PLAYWRIGHT_CONFIG}` : '';
console.log(`Версия стартера: ${STARTER_VERSION}`);

function run(files) {
  execSync(`npx playwright test ${files}${config}`, { stdio: 'inherit' });
}

if (STARTER_VERSION >= 2) {
  // Этапы по порядку: сначала самая понятная ошибка. Следующий этап запускается, только если прошёл предыдущий
  const stages = [
    { name: 'отрисовки', files: 'render.spec.ts' },
    { name: 'функций', files: 'functions.spec.ts' },
    { name: 'работы таблицы', files: 'search.spec.ts filtering.spec.ts sorting.spec.ts pagination.spec.ts reset.spec.ts' },
  ];

  for (const stage of stages) {
    console.log(`Запуск тестов ${stage.name}...`);
    try {
      run(stage.files);
    } catch (error) {
      console.log(`Тесты ${stage.name} упали. Исправьте ошибки выше — следующие тесты запустятся после этого.`);
      process.exit(1);
    }
  }
  console.log('Все тесты прошли.');
} else {
  try {
    // Сначала запускаем только отрисовку
    console.log('Запуск тестов отрисовки...');
    run('table.render.spec.ts');

    // Если отрисовка прошла - запускаем остальные
    console.log('Отрисовка успешна. Запуск остальных тестов...');
    run('');

  } catch (error) {
    console.log('Тесты отрисовки упали. Остальные тесты не запускаются.');
    process.exit(1);
  }
}
