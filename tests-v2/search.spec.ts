import { test, expect } from '@playwright/test';
import { data, sortedBy } from './fixtures/dataset';
import { selectors } from './helpers/selectors';
import { open, search, expectRows, expectStatus, expectSortIcons } from './helpers/table';

const found = (query: string) =>
  data.filter((row) => [row.date, row.customer, row.seller].some((value) => value.toLowerCase().includes(query.toLowerCase())));

test.describe('Поиск', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('Находит строки по части имени покупателя или продавца', async ({ page }) => {
    const expected = found('petr');
    await search(page, 'petr');

    await expectRows(page, expected.slice(0, 10), 'По запросу "petr" в таблице не те строки');
    await expectStatus(page, 1, 10, expected.length, `По запросу "petr" ждали ${expected.length} строк из ${data.length}`);
  });

  test('Ищет без учёта регистра', async ({ page }) => {
    const expected = found('petr');
    await search(page, 'PETR');

    await expectStatus(
      page, 1, 10, expected.length,
      `По запросу "PETR" ждали столько же строк, сколько по "petr", — ${expected.length}. ` +
        'К нижнему регистру нужно привести и значения строки, и сам запрос',
    );
  });

  test('Находит строки по части даты', async ({ page }) => {
    const expected = found('2024-01');
    await search(page, '2024-01');

    await expectRows(page, expected.slice(0, 10), 'По запросу "2024-01" ждали строки с датами января 2024 года');
    await expectStatus(page, 1, 10, expected.length, `По запросу "2024-01" ждали ${expected.length} строк`);
  });

  test('Без совпадений таблица пустая', async ({ page }) => {
    await search(page, '__NO_MATCH__');

    await expect(page.locator(selectors.rows), 'По запросу без совпадений в таблице не должно быть строк').toHaveCount(0);
    await expectStatus(page, 0, 0, 0, 'Без совпадений статус — «Строки 0–0 из 0»');
  });

  test('Очистка поля поиска возвращает все строки', async ({ page }) => {
    await search(page, 'petr');
    await search(page, '');

    await expectRows(page, data.slice(0, 10), 'После очистки поля поиска должны вернуться первые строки датасета');
    await expectStatus(page, 1, 10, data.length, `После очистки поля поиска ждали все ${data.length} строк`);
  });

  test('Enter в поле поиска не перезагружает страницу и не сбрасывает сортировку', async ({ page }) => {
    await page.click(selectors.sortByTotal);
    await page.evaluate(() => ((window as any).__notReloaded = true));

    await search(page, 'petr');

    expect(
      await page.evaluate(() => (window as any).__notReloaded),
      'После Enter в поле поиска страница перезагрузилась. Форма не должна отправляться',
    ).toBe(true);
    await expectSortIcons(page, 'none', 'up', 'После поиска сортировка по сумме должна остаться');
    await expectRows(
      page,
      sortedBy(found('petr'), 'total', 'up').slice(0, 10),
      'После поиска строки должны остаться отсортированными по сумме',
    );
  });
});
