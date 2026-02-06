import { test, expect } from '@playwright/test';
import { tableActions } from './helpers/table.actions';
import { tableSelectors } from './helpers/table.selectors';
import { data } from './fixtures/dataset';

test.describe('Верхняя форма с поиском и сбросом фильтров', () => {
  test.beforeEach(async ({ page }) => {
    await tableActions.goto(page);
  });

  test('Поиск по части строки находит совпадения в полях date, customer или seller', async ({ page }) => {
    const query = data[0].customer.substring(0, 3);
    await tableActions.search(page, query);

    const rows = await page.locator(tableSelectors.rows).all();
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const text = await row.innerText();
      expect(text.toLowerCase()).toContain(query.toLowerCase());
    }
  });

  test('Поиск без совпадений показывает пустую таблицу', async ({ page }) => {
    await tableActions.search(page, '__NO_MATCH__');

    await expect(page.locator(tableSelectors.rows)).toHaveCount(0);
  });
});