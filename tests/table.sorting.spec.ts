import { test, expect } from '@playwright/test';
import { data } from './fixtures/dataset';
import { expectRowsMatch } from './helpers/table.expectations';
import { tableActions } from './helpers/table.actions';
import { tableSelectors } from './helpers/table.selectors';

function sortByTotalAsc() {
  return [...data].sort((a, b) => a.total - b.total).slice(0, 10);
}

function sortByTotalDesc() {
  return [...data].sort((a, b) => b.total - a.total).slice(0, 10);
}

test.describe('Сортировка данных в таблице', () => {
  test.beforeEach(async ({ page }) => {
    await tableActions.goto(page);
  });

  test('Сортировка по дате по возрастанию отображает строки в правильном порядке', async ({ page }) => {
    await page.click(tableSelectors.sortByDate);
    const sortedData = [...data].sort((a, b) => +(new Date(a.date)) - +(new Date(b.date))).slice(0, 10);
    await expectRowsMatch(page, sortedData);
    await expect(page.locator(tableSelectors.sortByDate)).toHaveAttribute('data-value', 'up');
  });

  test('Сортировка по дате по убыванию отображает строки в правильном порядке', async ({ page }) => {
    await page.click(tableSelectors.sortByDate);
    await page.click(tableSelectors.sortByDate);
    const sortedData = [...data].sort((a, b) => +(new Date(b.date)) - +(new Date(a.date))).slice(0, 10);
    await expectRowsMatch(page, sortedData);
    await expect(page.locator(tableSelectors.sortByDate)).toHaveAttribute('data-value', 'down');
  });

  test('Третий клик по сортировке по дате сбрасывает сортировку', async ({ page }) => {
    await page.click(tableSelectors.sortByDate);
    await page.click(tableSelectors.sortByDate);
    await page.click(tableSelectors.sortByDate);
    await expectRowsMatch(page, data.slice(0, 10));
    await expect(page.locator(tableSelectors.sortByDate)).toHaveAttribute('data-value', 'none');
  });

  test('Сортировка по сумме по возрастанию отображает строки в правильном порядке', async ({ page }) => {
    await page.click(tableSelectors.sortByTotal);
    const sortedData = sortByTotalAsc();
    await expectRowsMatch(page, sortedData);
    await expect(page.locator(tableSelectors.sortByTotal)).toHaveAttribute('data-value', 'up');
  });

  test('Сортировка по сумме по убыванию отображает строки в правильном порядке', async ({ page }) => {
    await page.click(tableSelectors.sortByTotal);
    await page.click(tableSelectors.sortByTotal);
    const sortedData = sortByTotalDesc();
    await expectRowsMatch(page, sortedData);
    await expect(page.locator(tableSelectors.sortByTotal)).toHaveAttribute('data-value', 'down');
  });

  test('Третий клик по сортировке по сумме сбрасывает сортировку', async ({ page }) => {
    await page.click(tableSelectors.sortByTotal);
    await page.click(tableSelectors.sortByTotal);
    await page.click(tableSelectors.sortByTotal);
    await expectRowsMatch(page, data.slice(0, 10));
    await expect(page.locator(tableSelectors.sortByTotal)).toHaveAttribute('data-value', 'none');
  });

  test('Сортировка по одному полю сбрасывает сортировку по другому полю', async ({ page }) => {
    // Сначала сортируем по сумме
    await page.click(tableSelectors.sortByTotal);
    await expect(page.locator(tableSelectors.sortByTotal)).toHaveAttribute('data-value', 'up');
    await expect(page.locator(tableSelectors.sortByDate)).toHaveAttribute('data-value', 'none');

    // Затем сортируем по дате
    await page.click(tableSelectors.sortByDate);
    await expect(page.locator(tableSelectors.sortByDate)).toHaveAttribute('data-value', 'up');
    await expect(page.locator(tableSelectors.sortByTotal)).toHaveAttribute('data-value', 'none');
  });
});