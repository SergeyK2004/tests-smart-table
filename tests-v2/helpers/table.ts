import { expect, Page } from '@playwright/test';
import type { TableRow } from '../fixtures/dataset';
import { selectors } from './selectors';

// Сколько ждём, пока таблица перерисуется после действия
const TIMEOUT = 2000;

export async function open(page: Page) {
  await page.goto('/');
}

export async function search(page: Page, value: string) {
  await page.fill(selectors.searchInput, value);
  await page.keyboard.press('Enter');
}

export async function clickTimes(page: Page, selector: string, times: number) {
  for (let i = 0; i < times; i++) {
    await page.click(selector);
  }
}

// Перед выбором проверяем, что пункт есть: иначе тест упадёт по таймауту без объяснений
export async function selectSeller(page: Page, name: string) {
  if (name !== '') {
    await expect(
      page.locator(`${selectors.filterSeller} option[value="${name}"]`),
      `В списке продавцов нет пункта «${name}». Проверьте fillSellers в filtering.js и её вызов в main.js`,
    ).toHaveCount(1, { timeout: TIMEOUT });
  }
  await page.selectOption(selectors.filterSeller, name);
}

export async function clickPage(page: Page, number: number) {
  const button = page.locator(`${selectors.pageButtons}[data-page="${number}"]`);
  await expect(
    button,
    `В пагинации нет кнопки страницы ${number}. Проверьте вызов renderPages в render()`,
  ).toHaveCount(1, { timeout: TIMEOUT });
  await button.click();
}

// Строки так, как их видит пользователь: «дата | покупатель | продавец | сумма»
export function formatRows(rows: TableRow[]) {
  return rows.map((row) => `${row.date} | ${row.customer} | ${row.seller} | ${row.total}`);
}

export async function readRows(page: Page) {
  return page.locator(selectors.rows).evaluateAll((rows) =>
    rows.map((row) => {
      const cell = (name: string) => row.querySelector(`[data-name="${name}"]`)?.textContent?.trim() ?? '';
      return [cell('date'), cell('customer'), cell('seller'), cell('total')].join(' | ');
    }),
  );
}

// Таблица показывает ровно эти строки в этом порядке
export async function expectRows(page: Page, expected: TableRow[], message: string) {
  await expect.poll(() => readRows(page), { message, timeout: TIMEOUT }).toEqual(formatRows(expected));
}

// Строка «Showing from to to of total entries»
export async function expectStatus(page: Page, from: number, to: number, total: number, message: string) {
  await expect
    .poll(
      async () => {
        const [f, t, n] = await Promise.all([
          page.locator(selectors.fromRow).innerText(),
          page.locator(selectors.toRow).innerText(),
          page.locator(selectors.totalRows).innerText(),
        ]);
        return `Showing ${f.trim()} to ${t.trim()} of ${n.trim()} entries`;
      },
      { message, timeout: TIMEOUT },
    )
    .toBe(`Showing ${from} to ${to} of ${total} entries`);
}

// Номера страниц в пагинации и номер выделенной
export async function expectPages(page: Page, numbers: number[], active: number, message: string) {
  await expect
    .poll(async () => {
      const all = await page.locator(selectors.pageButtons).allInnerTexts();
      const current = await page.locator(selectors.activePage).allInnerTexts();
      return `номера: ${all.map((n) => n.trim()).join(', ')}; выделена: ${current.map((n) => n.trim()).join(', ')}`;
    }, { message, timeout: TIMEOUT })
    .toBe(`номера: ${numbers.join(', ')}; выделена: ${active}`);
}

export async function expectSortIcons(page: Page, date: string, total: string, message: string) {
  await expect
    .poll(async () => {
      const d = await page.locator(selectors.sortByDate).getAttribute('data-value');
      const t = await page.locator(selectors.sortByTotal).getAttribute('data-value');
      return `Date: ${d}, Total: ${t}`;
    }, { message, timeout: TIMEOUT })
    .toBe(`Date: ${date}, Total: ${total}`);
}
