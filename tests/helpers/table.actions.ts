import { Page } from '@playwright/test';
import { tableSelectors } from './table.selectors';

export const tableActions = {
  async goto(page: Page) {
    await page.goto('/');
  },

  async next(page: Page) {
    await page.click(tableSelectors.nextPage);
  },

  async prev(page: Page) {
    await page.click(tableSelectors.prevPage);
  },

  async last(page: Page) {
    await page.click(tableSelectors.lastPage);
  },

  async sortByTotal(page: Page, times = 1) {
    for (let i = 0; i < times; i++) {
      await page.click(tableSelectors.sortByTotal);
    }
  },

  async search(page: Page, value: string) {
    await page.fill(tableSelectors.searchInput, value);
    await page.keyboard.press('Enter');
  },

  async filterByCustomer(page: Page, value: string) {
    await page.fill(tableSelectors.filterCustomer, value);
    await page.keyboard.press('Enter');
  }
};