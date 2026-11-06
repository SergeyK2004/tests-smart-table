import { test, expect } from '@playwright/test';
import { data, sellers } from './fixtures/dataset';
import { selectors } from './helpers/selectors';
import { open, selectSeller, search, expectRows, expectStatus } from './helpers/table';

const seller = sellers[0];

test.describe('Фильтры по продавцу и сумме', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('В списке продавцов — «все продавцы» и по пункту на каждого', async ({ page }) => {
    await expect
      .poll(() => page.locator(`${selectors.filterSeller} option`).evaluateAll((options) =>
        options.map((option) => `${(option as HTMLOptionElement).value} → ${option.textContent?.trim()}`),
      ), { message: 'Пункты списка продавцов не совпадают с продавцами датасета. Проверьте fillSellers в filtering.js' })
      .toEqual([' → —', ...sellers.map((name) => `${name} → ${name}`)]);
  });

  test('Выбор продавца оставляет только его чеки', async ({ page }) => {
    const expected = data.filter((row) => row.seller === seller);
    await selectSeller(page, seller);

    await expectRows(page, expected.slice(0, 10), `После выбора продавца ${seller} в таблице не те строки`);
    await expectStatus(page, 1, 10, expected.length, `У продавца ${seller} ждали ${expected.length} чеков`);
  });

  test('Заполнено только «от»: пустое «до» не ограничивает сумму', async ({ page }) => {
    const expected = data.filter((row) => row.total >= 5000);
    await page.fill(selectors.filterTotalFrom, '5000');

    await expectStatus(
      page, 1, 10, expected.length,
      `При «от» = 5000 ждали ${expected.length} строк. Если таблица пустая — проверьте, что пустое «до» не участвует ` +
        'в сравнении: пустая строка значит «без ограничения»',
    );
    await expectRows(page, expected.slice(0, 10), 'При «от» = 5000 в таблице не те строки');
  });

  test('Заполнено только «до»: пустое «от» не ограничивает сумму', async ({ page }) => {
    const expected = data.filter((row) => row.total <= 1000);
    await page.fill(selectors.filterTotalTo, '1000');

    await expectStatus(page, 1, 10, expected.length, `При «до» = 1000 ждали ${expected.length} строк`);
    await expectRows(page, expected.slice(0, 10), 'При «до» = 1000 в таблице не те строки');
  });

  test('Сумма «от — до» включает обе границы', async ({ page }) => {
    const exact = data[0].total;
    await page.fill(selectors.filterTotalFrom, String(exact));
    await page.fill(selectors.filterTotalTo, String(exact));

    await expectRows(
      page,
      data.filter((row) => row.total === exact),
      `При «от» и «до» = ${exact} ждали чек ровно на эту сумму: границы входят в диапазон`,
    );
  });

  test('Поиск, продавец и сумма работают вместе', async ({ page }) => {
    const expected = data.filter(
      (row) =>
        row.customer.toLowerCase().includes('андрей') && row.seller === seller && row.total >= 2000 && row.total <= 8000,
    );
    await search(page, 'андрей');
    await selectSeller(page, seller);
    await page.fill(selectors.filterTotalFrom, '2000');
    await page.fill(selectors.filterTotalTo, '8000');

    await expectRows(
      page,
      expected.slice(0, 10),
      `Поиск "андрей", продавец ${seller} и сумма 2000–8000 — ждали ${expected.length} строк`,
    );
  });

  test('Очистка фильтров возвращает все строки', async ({ page }) => {
    await selectSeller(page, seller);
    await page.fill(selectors.filterTotalFrom, '1000');
    await page.fill(selectors.filterTotalTo, '5000');

    await selectSeller(page, '');
    await page.fill(selectors.filterTotalFrom, '');
    await page.fill(selectors.filterTotalTo, '');

    await expectRows(page, data.slice(0, 10), 'После очистки фильтров должны вернуться первые строки датасета');
    await expectStatus(page, 1, 10, data.length, `После очистки фильтров ждали все ${data.length} строк`);
  });
});
