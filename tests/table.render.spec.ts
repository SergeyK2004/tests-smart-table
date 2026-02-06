import { test, expect } from '@playwright/test';
import { data } from './fixtures/dataset';
import { expectRowsMatch } from './helpers/table.expectations';
import { tableActions } from './helpers/table.actions';
import { tableSelectors } from './helpers/table.selectors';

test.describe('Корректное отображение верстки', () => {
  test.beforeEach(async ({ page }) => {
    await tableActions.goto(page);
  });

  test('Наличие поля поиска', async ({ page }) => {
    await expect(page.locator(tableSelectors.searchInput)).toBeVisible();
  });

  test('Наличие кнопки сброса фильтров', async ({ page }) => {
    await expect(page.locator(tableSelectors.resetButton)).toBeVisible();
  });

  test('Наличие кнопок сортировки', async ({ page }) => {
    await expect(page.locator(tableSelectors.sortByDate)).toBeVisible();
    await expect(page.locator(tableSelectors.sortByTotal)).toBeVisible();
  });

  test('Наличие всех ожидаемых столбцов', async ({ page }) => {
    const headerColumns = page.locator(tableSelectors.headerColumns);

    await expect(headerColumns.nth(0)).toContainText('Date');
    await expect(headerColumns.nth(1)).toContainText('Customer');
    await expect(headerColumns.nth(2)).toContainText('Seller');
    await expect(headerColumns.nth(3)).toContainText('Total');
  });

  test('Наличие полей фильтрации', async ({ page }) => {
    await expect(page.locator(tableSelectors.filterCustomer)).toBeVisible();
    await expect(page.locator(tableSelectors.filterSeller)).toBeVisible();
    await expect(page.locator(tableSelectors.filterDate)).toBeVisible();
    await expect(page.locator(tableSelectors.filterTotalFrom)).toBeVisible();
    await expect(page.locator(tableSelectors.filterTotalTo)).toBeVisible();
  });

  test('Наличие кнопок в пагинации', async ({ page }) => {
    await expect(page.locator(tableSelectors.firstPage)).toBeVisible();
    await expect(page.locator(tableSelectors.prevPage)).toBeVisible();
    await expect(page.locator(tableSelectors.nextPage)).toBeVisible();
    await expect(page.locator(tableSelectors.lastPage)).toBeVisible();

    const buttonsPage = page.locator(tableSelectors.page);
    const count = await buttonsPage.count();
    expect(count).toBeGreaterThan(1);
  });

  test('Наличие селектора количества строк на странице', async ({ page }) => {
    await expect(page.locator(tableSelectors.rowsPerPage)).toBeVisible();
  });

  test('Отображение строк в таблице', async ({ page }) => {
    const rows = page.locator(tableSelectors.rows);

    const count = await rows.count();
    expect(count).toBeGreaterThan(1);

    const firstRow = rows.nth(0);
    await expect(firstRow.locator('[data-name="date"]')).toBeVisible();
    await expect(firstRow.locator('[data-name="customer"]')).toBeVisible();
    await expect(firstRow.locator('[data-name="seller"]')).toBeVisible();
    await expect(firstRow.locator('[data-name="total"]')).toBeVisible();
  });

  test('Корректное отображение первых 10 строк датасета в таблице', async ({ page }) => {
    await expectRowsMatch(page, data.slice(0, 10));
  });
});
