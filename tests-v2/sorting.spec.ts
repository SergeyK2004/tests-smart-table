import { test } from '@playwright/test';
import { data, sortedBy, sellers } from './fixtures/dataset';
import { selectors } from './helpers/selectors';
import { open, selectSeller, clickTimes, expectRows, expectSortIcons } from './helpers/table';

test.describe('Сортировка', () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test('Клик по Date сортирует по дате по возрастанию', async ({ page }) => {
    await page.click(selectors.sortByDate);

    await expectSortIcons(page, 'up', 'none', 'После клика по Date у её кнопки должно быть data-value="up"');
    await expectRows(
      page,
      sortedBy(data, 'date', 'up').slice(0, 10),
      'После клика по Date строки должны идти от ранней даты к поздней. Даты — строки, сравнивайте их через < и >',
    );
  });

  test('Второй клик по Date сортирует по убыванию, равные даты — в исходном порядке', async ({ page }) => {
    await clickTimes(page, selectors.sortByDate, 2);

    await expectSortIcons(page, 'down', 'none', 'После второго клика по Date у её кнопки должно быть data-value="down"');
    await expectRows(
      page,
      sortedBy(data, 'date', 'down').slice(0, 10),
      'После второго клика по Date строки должны идти от поздней даты к ранней, а чеки за один день — в исходном ' +
        'порядке. Не переворачивайте массив через reverse — поменяйте местами a и b в сравнении',
    );
  });

  test('Третий клик по Date возвращает исходный порядок', async ({ page }) => {
    await clickTimes(page, selectors.sortByDate, 3);

    await expectSortIcons(page, 'none', 'none', 'После третьего клика по Date у её кнопки должно быть data-value="none"');
    await expectRows(
      page,
      data.slice(0, 10),
      'После третьего клика строки должны вернуться в исходный порядок. Если нет — проверьте, что сортировка ' +
        'не меняет исходный массив: toSorted, а не sort',
    );
  });

  test('Клики по Total сортируют по сумме: по возрастанию, по убыванию, без сортировки', async ({ page }) => {
    await page.click(selectors.sortByTotal);
    await expectSortIcons(page, 'none', 'up', 'После клика по Total у её кнопки должно быть data-value="up"');
    await expectRows(page, sortedBy(data, 'total', 'up').slice(0, 10), 'После клика по Total ждали суммы по возрастанию');

    await page.click(selectors.sortByTotal);
    await expectSortIcons(page, 'none', 'down', 'После второго клика по Total у её кнопки должно быть data-value="down"');
    await expectRows(page, sortedBy(data, 'total', 'down').slice(0, 10), 'После второго клика по Total ждали суммы по убыванию');

    await page.click(selectors.sortByTotal);
    await expectSortIcons(page, 'none', 'none', 'После третьего клика по Total у её кнопки должно быть data-value="none"');
    await expectRows(page, data.slice(0, 10), 'После третьего клика по Total ждали исходный порядок строк');
  });

  test('Клик по другой колонке начинает её сортировку с возрастания и сбрасывает первую', async ({ page }) => {
    await clickTimes(page, selectors.sortByTotal, 1);
    await page.click(selectors.sortByDate);

    await expectSortIcons(
      page, 'up', 'none',
      'После Total и затем Date ждали Date — "up", Total — "none". Для другой колонки прошлое состояние — none',
    );
    await expectRows(page, sortedBy(data, 'date', 'up').slice(0, 10), 'После клика по Date ждали сортировку по дате');
  });

  test('Сортировка работает вместе с фильтром', async ({ page }) => {
    await selectSeller(page, sellers[0]);
    await clickTimes(page, selectors.sortByTotal, 2);

    await expectRows(
      page,
      sortedBy(data.filter((row) => row.seller === sellers[0]), 'total', 'down').slice(0, 10),
      `Ждали чеки продавца ${sellers[0]}, отсортированные по убыванию суммы`,
    );
  });
});
