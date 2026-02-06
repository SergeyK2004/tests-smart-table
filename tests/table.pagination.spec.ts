import { test, expect } from '@playwright/test';
import { data } from './fixtures/dataset';
import { expectRowsMatch } from './helpers/table.expectations';
import { tableSelectors } from './helpers/table.selectors';
import { tableActions } from './helpers/table.actions';

test.describe('Пагинация таблицы', () => {
  test.beforeEach(async ({ page }) => {
    await tableActions.goto(page);
  });

  test('При загрузке отображается первая страница с 10 строками', async ({ page }) => {
    await expectRowsMatch(page, data.slice(0, 10));
    await expect(page.locator(tableSelectors.fromRow)).toHaveText('1');
    await expect(page.locator(tableSelectors.toRow)).toHaveText('10');
    await expect(page.locator(tableSelectors.totalRows)).toHaveText(String(data.length));
  });

  test('Переход на следующую страницу отображает правильные данные', async ({ page }) => {
    await page.click(tableSelectors.nextPage);
    await expectRowsMatch(page, data.slice(10, 20));
    await expect(page.locator(tableSelectors.fromRow)).toHaveText('11');
    await expect(page.locator(tableSelectors.toRow)).toHaveText('20');
  });

  test('Переход на предыдущую страницу возвращает к первой странице', async ({ page }) => {
    await page.click(tableSelectors.nextPage);
    await page.click(tableSelectors.prevPage);
    await expectRowsMatch(page, data.slice(0, 10));
    await expect(page.locator(tableSelectors.fromRow)).toHaveText('1');
    await expect(page.locator(tableSelectors.toRow)).toHaveText('10');
  });

  test('Переход на последнюю страницу отображает оставшиеся строки', async ({ page }) => {
    await page.click(tableSelectors.lastPage);
    const lastPageStart = Math.floor((data.length - 1) / 10) * 10;
    const expectedLastPage = data.slice(lastPageStart);
    await expectRowsMatch(page, expectedLastPage);
    await expect(page.locator(tableSelectors.fromRow)).toHaveText(String(lastPageStart + 1));
    await expect(page.locator(tableSelectors.toRow)).toHaveText(String(data.length));
  });

  test('Переход на первую страницу работает корректно', async ({ page }) => {
    await page.click(tableSelectors.lastPage);
    await page.click(tableSelectors.firstPage);
    await expectRowsMatch(page, data.slice(0, 10));
    await expect(page.locator(tableSelectors.fromRow)).toHaveText('1');
    await expect(page.locator(tableSelectors.toRow)).toHaveText('10');
  });

  test('Выбор страницы через радиокнопки отображает правильные данные', async ({ page }) => {
    // Переходим на вторую страницу через радиокнопку
    const secondPageRadio = page.locator('input[type="radio"][value="2"]');
    await secondPageRadio.check();
    await expectRowsMatch(page, data.slice(10, 20));
    await expect(page.locator(tableSelectors.fromRow)).toHaveText('11');
    await expect(page.locator(tableSelectors.toRow)).toHaveText('20');
  });

  test('Изменение количества строк на странице обновляет данные и пагинацию', async ({ page }) => {
    // Меняем количество строк на 25
    await page.selectOption(tableSelectors.rowsPerPage, '25');
    await expectRowsMatch(page, data.slice(0, 25));
    await expect(page.locator(tableSelectors.fromRow)).toHaveText('1');
    await expect(page.locator(tableSelectors.toRow)).toHaveText('25');
  });

  test('После сортировки пагинация сохраняется при переходе между страницами', async ({ page }) => {
    // Сортируем по сумме
    await page.click(tableSelectors.sortByTotal);

    // Получаем отсортированные данные
    const sortedData = [...data].sort((a, b) => a.total - b.total);

    // Переходим на вторую страницу
    await page.click(tableSelectors.nextPage);

    // Проверяем, что отображаются отсортированные данные второй страницы
    await expectRowsMatch(page, sortedData.slice(10, 20));
  });
});