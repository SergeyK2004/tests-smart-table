import { test } from '@playwright/test';
import { data, sellers, sortedBy } from './fixtures/dataset';
import { selectors } from './helpers/selectors';
import { open, selectSeller, search, clickPage, expectRows, expectStatus, expectPages } from './helpers/table';

const total = data.length;
const pageCount = Math.ceil(total / 10);
const lastStart = (pageCount - 1) * 10;
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

test.describe('Пагинация', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('При загрузке — первая страница из 10 строк', async ({ page }) => {
    await expectRows(page, data.slice(0, 10), 'При загрузке ждали первые 10 строк датасета');
    await expectStatus(page, 1, 10, total, 'При загрузке ждали статус первой страницы');
    await expectPages(page, range(1, 5), 1, 'При загрузке ждали номера 1–5 и выделенную первую страницу');
  });

  test('Кнопки «вперёд» и «назад» листают страницы', async ({ page }) => {
    await page.click(selectors.nextPage);
    await expectRows(
      page,
      data.slice(10, 20),
      'После «вперёд» ждали строки с 11-й по 20-ю. Если строк больше — число строк на странице приходит из формы ' +
        'строкой, превратите его в число',
    );
    await expectStatus(page, 11, 20, total, 'После «вперёд» ждали статус второй страницы');
    await expectPages(page, range(1, 5), 2, 'После «вперёд» должна быть выделена вторая страница');

    await page.click(selectors.prevPage);
    await expectRows(page, data.slice(0, 10), 'После «вперёд» и «назад» ждали первую страницу');
    await expectStatus(page, 1, 10, total, 'После «вперёд» и «назад» ждали статус первой страницы');
  });

  test('Кнопки «последняя» и «первая» открывают крайние страницы', async ({ page }) => {
    await page.click(selectors.lastPage);
    await expectRows(page, data.slice(lastStart), `На последней странице ждали строки с ${lastStart + 1}-й по ${total}-ю`);
    await expectStatus(page, lastStart + 1, total, total, 'После «последняя» ждали статус последней страницы');
    await expectPages(page, range(pageCount - 4, pageCount), pageCount, 'На последней странице ждали пять последних номеров');

    await page.click(selectors.firstPage);
    await expectRows(page, data.slice(0, 10), 'После «первая» ждали первую страницу');
    await expectStatus(page, 1, 10, total, 'После «первая» ждали статус первой страницы');
  });

  test('«Назад» на первой и «вперёд» на последней странице не уводят за край', async ({ page }) => {
    await page.click(selectors.prevPage);
    await expectStatus(page, 1, 10, total, '«Назад» на первой странице должна оставить первую страницу');

    await page.click(selectors.lastPage);
    await page.click(selectors.nextPage);
    await expectStatus(page, lastStart + 1, total, total, '«Вперёд» на последней странице должна оставить последнюю');
  });

  test('Клик по номеру открывает эту страницу, а «вперёд» — следующую за ней', async ({ page }) => {
    await clickPage(page, 3);
    await expectRows(page, data.slice(20, 30), 'После клика по номеру 3 ждали строки с 21-й по 30-ю');
    await expectPages(
      page, range(1, 5), 3,
      'После клика по номеру 3 она должна быть выделена. Номер из dataset приходит строкой — превратите его в число',
    );

    await page.click(selectors.nextPage);
    await expectStatus(
      page, 31, 40, total,
      'После страницы 3 и «вперёд» ждали страницу 4. Если открылась другая — номер из dataset приходит строкой, ' +
        'превратите его в число',
    );
  });

  test('Выбор числа строк на странице меняет размер страницы', async ({ page }) => {
    await page.selectOption(selectors.rowsPerPage, '25');
    await expectRows(page, data.slice(0, 25), 'При 25 строках на странице ждали первые 25 строк');
    await expectPages(page, range(1, 5), 1, 'При 25 строках на странице ждали номера 1–5');

    await page.click(selectors.nextPage);
    await expectRows(
      page,
      data.slice(25, 50),
      'При 25 строках на второй странице ждали строки с 26-й по 50-ю. Если строк больше — число строк на странице ' +
        'приходит из формы строкой, превратите его в число',
    );
    await expectStatus(
      page, 26, 50, total,
      'При 25 строках на второй странице ждали строки с 26-й по 50-ю. Значения полей формы — строки, ' +
        'число строк на странице нужно превратить в число',
    );

    await page.selectOption(selectors.rowsPerPage, '100');
    await expectPages(page, range(1, Math.ceil(total / 100)), 1, 'При 100 строках на странице ждали три номера');
  });

  test('После поиска или фильтра открывается первая страница', async ({ page }) => {
    const expected = data.filter((row) => row.seller === sellers[0]);

    await page.click(selectors.lastPage);
    await selectSeller(page, sellers[0]);
    await expectStatus(
      page, 1, 10, expected.length,
      'После выбора продавца на последней странице ждали первую страницу. При изменении полей формы ' +
        'номер страницы нужно сбросить на 1',
    );

    // Сбрасываем продавца и уходим на последнюю страницу снова — теперь проверяем поиск
    await selectSeller(page, '');
    await page.click(selectors.lastPage);
    await search(page, 'petr');
    const found = data.filter((row) => /petr/i.test(`${row.date} ${row.customer} ${row.seller}`));
    await expectStatus(page, 1, 10, found.length, 'После поиска на последней странице ждали первую страницу');
  });

  test('Без совпадений кнопки пагинации не ломают статус', async ({ page }) => {
    await search(page, '__NO_MATCH__');
    await page.click(selectors.nextPage);
    await page.click(selectors.lastPage);
    await page.click(selectors.prevPage);

    await expectStatus(page, 0, 0, 0, 'Без совпадений после «вперёд», «последняя», «назад» ждали «Строки 0–0 из 0»');
    await expectPages(page, [1], 1, 'Без совпадений ждали одну страницу с номером 1');
  });

  test('Сортировка сохраняется при переходе между страницами', async ({ page }) => {
    await page.click(selectors.sortByTotal);
    await page.click(selectors.nextPage);

    await expectRows(page, sortedBy(data, 'total', 'up').slice(10, 20), 'На второй странице ждали строки, отсортированные по сумме');
  });
});
