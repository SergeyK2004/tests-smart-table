import { test, expect } from '@playwright/test';
import { tableActions } from './helpers/table.actions';
import { tableSelectors } from './helpers/table.selectors';

test.describe('Кнопка сброса фильтров', () => {
  test.beforeEach(async ({ page }) => {
    tableActions.goto(page);
  });

  test('После нажатия кнопки сброса все поля фильтрации очищаются', async ({ page }) => {
    await page.fill(tableSelectors.filterDate, '2024');
    await page.fill(tableSelectors.filterCustomer, 'Иван');
    await page.selectOption(tableSelectors.filterSeller, { index: 1 });
    await page.fill(tableSelectors.filterTotalFrom, '100');
    await page.fill(tableSelectors.filterTotalTo, '1000');
    await tableActions.search(page, 'test');

    await page.click(tableSelectors.resetButton);

    await expect(page.locator(tableSelectors.searchInput)).toHaveValue('');
    await expect(page.locator(tableSelectors.filterDate)).toHaveValue('');
    await expect(page.locator(tableSelectors.filterCustomer)).toHaveValue('');
    await expect(page.locator(tableSelectors.filterSeller)).toHaveValue('');
    await expect(page.locator(tableSelectors.filterTotalFrom)).toHaveValue('');
    await expect(page.locator(tableSelectors.filterTotalTo)).toHaveValue('');
  });
});