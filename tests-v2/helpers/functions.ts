import { expect, Page } from '@playwright/test';

// Вызывает функцию из модуля стартера в браузере: модуль загружает сервер Vite, как и в приложении.
// Возвращает результат функции и признак, что функция изменила свои аргументы.
export async function call(page: Page, file: string, name: string, ...args: unknown[]) {
  const result = await page.evaluate(
    async ({ file, name, args }) => {
      let module: Record<string, unknown>;
      try {
        module = await import(file);
      } catch (error) {
        return { error: `Не удалось загрузить файл ${file}: ${(error as Error).message}` };
      }

      const fn = module[name];
      if (typeof fn !== 'function') {
        return { error: `В файле ${file} нет функции ${name} с export. Не переименовывайте функции стартера.` };
      }

      const before = JSON.stringify(args);
      try {
        const value = fn(...args);
        return { value, argsChanged: JSON.stringify(args) !== before };
      } catch (error) {
        return { error: `Функция ${name} выбросила ошибку: ${(error as Error).message}` };
      }
    },
    { file, name, args },
  );

  expect(result.error, result.error).toBeUndefined();
  return result as { value: any; argsChanged: boolean };
}

// Функция вернула массив, а не undefined или что-то другое
export function expectArray(value: unknown, name: string) {
  expect(
    Array.isArray(value),
    `Функция ${name} должна вернуть массив, а вернула ${value === undefined ? 'undefined — проверьте return' : JSON.stringify(value)}`,
  ).toBe(true);
}

// Идентификаторы строк — короткий способ сравнить результат: ['r1', 'r3']
export const ids = (rows: { id: string }[]) => rows.map((row) => row.id);
