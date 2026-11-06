import { test, expect } from '@playwright/test';
import { data } from './fixtures/dataset';
import { selectors } from './helpers/selectors';
import { open, readRows, formatRows } from './helpers/table';

test.describe('Отрисовка: вёрстка и строки таблицы', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('На странице есть поле поиска, кнопка сброса и кнопки сортировки', async ({ page }) => {
    await expect(page.locator(selectors.searchInput), 'Нет поля поиска input[name="search"]').toBeVisible();
    await expect(page.locator(selectors.resetButton), 'Нет кнопки сброса с data-name="reset"').toBeVisible();
    await expect(page.locator(selectors.sortByDate), 'Нет кнопки сортировки по дате').toBeVisible();
    await expect(page.locator(selectors.sortByTotal), 'Нет кнопки сортировки по сумме').toBeVisible();
  });

  test('В шапке таблицы четыре колонки: Дата, Покупатель, Продавец, Сумма', async ({ page }) => {
    const columns = page.locator(selectors.headerColumns);
    await expect(columns.nth(0)).toContainText('Дата');
    await expect(columns.nth(1)).toContainText('Покупатель');
    await expect(columns.nth(2)).toContainText('Продавец');
    await expect(columns.nth(3)).toContainText('Сумма');
  });

  test('На странице есть фильтры по продавцу и сумме «от — до»', async ({ page }) => {
    await expect(page.locator(selectors.filterSeller), 'Нет списка продавцов select[name="seller"]').toBeVisible();
    await expect(page.locator(selectors.filterTotalFrom), 'Нет поля input[name="totalFrom"]').toBeVisible();
    await expect(page.locator(selectors.filterTotalTo), 'Нет поля input[name="totalTo"]').toBeVisible();
  });

  test('На странице есть кнопки пагинации и выбор числа строк', async ({ page }) => {
    await expect(page.locator(selectors.firstPage), 'Нет кнопки «первая страница»').toBeVisible();
    await expect(page.locator(selectors.prevPage), 'Нет кнопки «назад»').toBeVisible();
    await expect(page.locator(selectors.nextPage), 'Нет кнопки «вперёд»').toBeVisible();
    await expect(page.locator(selectors.lastPage), 'Нет кнопки «последняя страница»').toBeVisible();
    await expect(page.locator(selectors.rowsPerPage), 'Нет списка select[name="rowsPerPage"]').toBeVisible();
  });

  test('Таблица выводит строки датасета: дата, покупатель, продавец, сумма', async ({ page }) => {
    await expect
      .poll(() => page.locator(selectors.rows).count(), {
        message:
          'В таблице нет строк. Проверьте createRow и renderRows в table.js и их вызов в render(). ' +
          'Если строки пропали после фильтров — пустые поля «от» и «до» не должны отсекать строки',
      })
      .toBeGreaterThan(0);

    const first = page.locator(selectors.rows).first();
    for (const name of ['date', 'customer', 'seller', 'total']) {
      await expect(
        first.locator(`[data-name="${name}"]`),
        `В строке нет ячейки data-name="${name}". Строку нужно создавать из шаблона #row`,
      ).toBeVisible();
    }

    const shown = (await readRows(page)).slice(0, 10);
    expect(shown, 'Первые строки таблицы не совпадают с первыми чеками датасета dataset_1.js').toEqual(
      formatRows(data.slice(0, shown.length)),
    );
  });
});
