import { expect, Page } from '@playwright/test';
import type { TableRow } from '../fixtures/types';
import { tableSelectors } from './table.selectors';

export async function expectRowsMatch(page: Page, expected: TableRow[]) {
  const rows = await page.locator(tableSelectors.rows).all();
  expect(rows.length).toBe(expected.length);

  for (let i = 0; i < rows.length; i++) {
    const text = await rows[i].innerText();
    expect(text).toContain(expected[i].date);
    expect(text).toContain(expected[i].customer);
    expect(text).toContain(expected[i].seller);
    expect(text).toContain(String(expected[i].total));
  }
}