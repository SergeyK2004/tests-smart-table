import { test, expect } from '@playwright/test';
import { data } from './fixtures/dataset';
import { tableActions } from './helpers/table.actions';
import { tableSelectors } from './helpers/table.selectors';
import { expectRowsMatch } from './helpers/table.expectations';

test.describe('Фильтрация данных в таблице', () => {
  test.beforeEach(async ({ page }) => {
    await tableActions.goto(page);
  });

  test('Фильтрация по дате возвращает только строки, содержащие подстроку в поле date', async ({ page }) => {
    const query = data[0].date.substring(5, 7);
    await page.fill(tableSelectors.filterDate, query);
    await page.click('body');

    const rows = await page.locator(tableSelectors.rows).all();
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const text = await row.innerText();
      expect(text).toContain(query);
    }
  });

  test('Фильтрация по несуществующей дате даёт 0 строк', async ({ page }) => {
    await page.fill(tableSelectors.filterDate, '9999-99-99');
    await page.click('body');
    await expect(page.locator(tableSelectors.rows)).toHaveCount(0);
  });

  test('Фильтрация по покупателю возвращает только подходящие строки', async ({ page }) => {
    const value = data[0].customer;
    await page.fill(tableSelectors.filterCustomer, value);
    await page.click('body');

    const rows = await page.locator(tableSelectors.rows).all();
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const text = await row.innerText();
      expect(text).toContain(value);
    }
  });

  test('Фильтрация по несуществующему покупателю даёт 0 строк', async ({ page }) => {
    await page.fill(tableSelectors.filterCustomer, '__NO_CUSTOMER__');
    await page.click('body');
    await expect(page.locator(tableSelectors.rows)).toHaveCount(0);
  });

  test('Фильтрация по продавцу возвращает только подходящие строки', async ({ page }) => {
    const sellerOption = await page.locator(`${tableSelectors.filterSeller} option`).nth(1);
    const sellerValue = await sellerOption.getAttribute('value');
    const sellerText = await sellerOption.textContent();

    await page.selectOption(tableSelectors.filterSeller, sellerValue);

    const rows = await page.locator(tableSelectors.rows).all();
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const text = await row.innerText();
      expect(text).toContain(sellerText!);
    }
  });

  test('Фильтрация по диапазону суммы: totalFrom ограничивает снизу', async ({ page }) => {
    const minTotal = 5000;
    await page.fill(tableSelectors.filterTotalFrom, String(minTotal));
    await page.click('body');

    const rows = await page.locator(tableSelectors.rows).all();
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const text = await row.innerText();
      const totalMatch = text.match(/[\d\s,]+(?:\.\d+)?/g);
      if (totalMatch) {
        const totalStr = totalMatch[totalMatch.length - 1].replace(/\s/g, '');
        const total = parseFloat(totalStr);
        expect(total).toBeGreaterThanOrEqual(minTotal);
      }
    }
  });

  test('фильтрация по диапазону суммы: totalTo ограничивает сверху', async ({ page }) => {
    const maxTotal = 1000;
    await page.fill(tableSelectors.filterTotalTo, String(maxTotal));
    await page.click('body');

    const rows = await page.locator(tableSelectors.rows).all();
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const text = await row.innerText();
      const totalMatch = text.match(/[\d\s,]+(?:\.\d+)?/g);
      if (totalMatch) {
        const totalStr = totalMatch[totalMatch.length - 1].replace(/\s/g, '');
        const total = parseFloat(totalStr);
        expect(total).toBeLessThanOrEqual(maxTotal);
      }
    }
  });

  test('фильтрация по диапазону суммы: totalFrom и totalTo работают вместе', async ({ page }) => {
    const minTotal = 2000;
    const maxTotal = 3000;
    await page.fill(tableSelectors.filterTotalFrom, String(minTotal));
    await page.fill(tableSelectors.filterTotalTo, String(maxTotal));
    await page.click('body');

    const rows = await page.locator(tableSelectors.rows).all();
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const text = await row.innerText();
      const totalMatch = text.match(/[\d\s,]+(?:\.\d+)?/g);
      if (totalMatch) {
        const totalStr = totalMatch[totalMatch.length - 1].replace(/\s/g, '');
        const total = parseFloat(totalStr);
        expect(total).toBeGreaterThanOrEqual(minTotal);
        expect(total).toBeLessThanOrEqual(maxTotal);
      }
    }
  });

  test('Очистка фильтра по дате восстанавливает исходные данные', async ({ page }) => {
    await page.fill(tableSelectors.filterDate, '2024');
    await page.click('body');
    await page.fill(tableSelectors.filterDate, '');
    const clearButton = page.locator('button[name="clear"][data-field="date"]');
    await clearButton.click();

    await expectRowsMatch(page, data.slice(0, 10));
  });

  test('Очистка фильтра по покупателю восстанавливает исходные данные', async ({ page }) => {
    await page.fill(tableSelectors.filterCustomer, data[0].customer);
    await page.fill(tableSelectors.filterCustomer, '');
    const clearButton = page.locator('button[name="clear"][data-field="customer"]');
    await clearButton.click();

    await expectRowsMatch(page, data.slice(0, 10));
  });

  test('Очистка фильтра по продавцу восстанавливает исходные данные', async ({ page }) => {
    await page.selectOption(tableSelectors.filterSeller, { index: 1 });
    await page.selectOption(tableSelectors.filterSeller, '');
    await expectRowsMatch(page, data.slice(0, 10));
  });

  test('Очистка фильтра totalFrom восстанавливает исходные данные', async ({ page }) => {
    await page.fill(tableSelectors.filterTotalFrom, '5000');
    await page.fill(tableSelectors.filterTotalFrom, '');
    await page.click('body');
    await expectRowsMatch(page, data.slice(0, 10));
  });

  test('Очистка фильтра totalTo восстанавливает исходные данные', async ({ page }) => {
    await page.fill(tableSelectors.filterTotalTo, '5000');
    await page.fill(tableSelectors.filterTotalTo, '');
    await page.click('body');
    await expectRowsMatch(page, data.slice(0, 10));
  });

  test('Комбинированная фильтрация по нескольким полям отображает только подходящие строки', async ({ page }) => {
    const customerFilter = 'Andrey Alekseev';
    const sellerOption = await page.locator('select[name="seller"] option').nth(1);
    const sellerValue = await sellerOption.getAttribute('value');
    const sellerText = await sellerOption.textContent();
    const minTotal = 5000;
    const maxTotal = 8000;

    // Применяем фильтры
    await page.fill(tableSelectors.filterCustomer, customerFilter);
    await page.selectOption(tableSelectors.filterSeller, sellerValue!);
    await page.fill(tableSelectors.filterTotalFrom, String(minTotal));
    await page.fill(tableSelectors.filterTotalTo, String(maxTotal));
    await page.click('body');

    // Определяем ожидаемые данные вручную по условиям
    const expectedRows = data.filter(row =>
      row.customer === customerFilter &&
      row.seller === sellerText &&
      row.total >= minTotal &&
      row.total <= maxTotal
    );

    await expectRowsMatch(page, expectedRows);
  });

  test('Очистка комбинированных фильтров восстанавливает исходные данные', async ({ page }) => {
    await page.fill(tableSelectors.filterDate, '2024');
    await page.fill(tableSelectors.filterCustomer, 'Andrey Alekseev');
    await page.selectOption(tableSelectors.filterSeller, { index: 1 });
    await page.fill(tableSelectors.filterTotalFrom, '1000');
    await page.fill(tableSelectors.filterTotalTo, '10000');
    await page.click('body');

    await page.fill(tableSelectors.filterDate, '');
    await page.fill(tableSelectors.filterCustomer, '');
    await page.selectOption(tableSelectors.filterSeller, '');
    await page.fill(tableSelectors.filterTotalFrom, '');
    await page.fill(tableSelectors.filterTotalTo, '');
    await page.click('body');

    await expectRowsMatch(page, data.slice(0, 10));
  });
});