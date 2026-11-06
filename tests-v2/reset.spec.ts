import { test, expect } from '@playwright/test';
import { data, sellers } from './fixtures/dataset';
import { selectors } from './helpers/selectors';
import { open, selectSeller, search, clickPage, expectRows, expectStatus, expectPages, expectSortIcons } from './helpers/table';

test.describe('Кнопка сброса', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('Очищает поиск и фильтры и показывает все строки', async ({ page }) => {
    await search(page, 'иван');
    await selectSeller(page, sellers[0]);
    await page.fill(selectors.filterTotalFrom, '100');
    await page.fill(selectors.filterTotalTo, '5000');

    await page.click(selectors.resetButton);

    await expect(page.locator(selectors.searchInput), 'После сброса поле поиска должно быть пустым').toHaveValue('');
    await expect(page.locator(selectors.filterSeller), 'После сброса должен быть выбран пункт «—»').toHaveValue('');
    await expect(page.locator(selectors.filterTotalFrom), 'После сброса поле «от» должно быть пустым').toHaveValue('');
    await expect(page.locator(selectors.filterTotalTo), 'После сброса поле «до» должно быть пустым').toHaveValue('');
    await expectRows(
      page,
      data.slice(0, 10),
      'После сброса ждали первые строки датасета. Если поля очистились, а строки прежние — после form.reset() ' +
        'таблицу нужно перерисовать: reset не вызывает событие input',
    );
    await expectStatus(page, 1, 10, data.length, `После сброса ждали все ${data.length} строк`);
  });

  test('Сбрасывает сортировку, страницу и число строк на странице', async ({ page }) => {
    await page.click(selectors.sortByTotal);
    await page.selectOption(selectors.rowsPerPage, '25');
    await clickPage(page, 5);

    await page.click(selectors.resetButton);

    await expectSortIcons(page, 'none', 'none', 'После сброса у кнопок сортировки должно быть data-value="none"');
    await expect(page.locator(selectors.rowsPerPage), 'После сброса ждали 10 строк на странице').toHaveValue('10');
    await expectRows(page, data.slice(0, 10), 'После сброса ждали первую страницу в исходном порядке');
    await expectPages(page, [1, 2, 3, 4, 5], 1, 'После сброса должна быть выделена первая страница');
  });
});
