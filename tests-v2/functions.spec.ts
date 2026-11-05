import { test, expect } from '@playwright/test';
import { call, expectArray, ids } from './helpers/functions';
import { open } from './helpers/table';

// Маленький набор строк: по нему легко посчитать ответ вручную
const rows = [
  { id: 'r1', date: '2024-01-15', customer: 'Andrey Alekseev', seller: 'Ivan Petrov', total: 1500 },
  { id: 'r2', date: '2023-12-04', customer: 'Petr Smirnov', seller: 'Nikolai Ivanov', total: 4657.56 },
  { id: 'r3', date: '2024-01-15', customer: 'Olga Ivanova', seller: 'Alexey Petrov', total: 300 },
  { id: 'r4', date: '2023-11-20', customer: 'Sergey Kuznetsov', seller: 'Ivan Petrov', total: 3000 },
];

const noFilters = { seller: '', totalFrom: '', totalTo: '' };

test.beforeEach(async ({ page }) => {
  await open(page);
});

test.describe('Функция applySearch (searching.js)', () => {
  const search = async (page, text: string) => {
    const { value } = await call(page, '/src/searching.js', 'applySearch', rows, text);
    expectArray(value, 'applySearch');
    return ids(value);
  };

  test('Находит строки по части имени покупателя или продавца', async ({ page }) => {
    expect(await search(page, 'smirnov'), 'По запросу "smirnov" ждали строку с покупателем Petr Smirnov').toEqual(['r2']);
    expect(
      await search(page, 'ivanov'),
      'По запросу "ivanov" ждали две строки: продавец Nikolai Ivanov и покупатель Olga Ivanova',
    ).toEqual(['r2', 'r3']);
  });

  test('Находит строки по части даты', async ({ page }) => {
    expect(await search(page, '2024-01'), 'По запросу "2024-01" ждали две строки с датой 2024-01-15').toEqual(['r1', 'r3']);
  });

  test('Ищет без учёта регистра', async ({ page }) => {
    expect(
      await search(page, 'SMIRNOV'),
      'По запросу "SMIRNOV" ничего не нашлось. К нижнему регистру нужно привести и значения строки, и сам запрос',
    ).toEqual(['r2']);
  });

  test('С пустым запросом возвращает все строки', async ({ page }) => {
    expect(await search(page, ''), 'С пустым запросом должны остаться все строки').toEqual(['r1', 'r2', 'r3', 'r4']);
  });
});

test.describe('Функция applyFilters (filtering.js)', () => {
  const filter = async (page, filters: object) => {
    const { value } = await call(page, '/src/filtering.js', 'applyFilters', rows, { ...noFilters, ...filters });
    expectArray(value, 'applyFilters');
    return ids(value);
  };

  test('Без фильтров возвращает все строки', async ({ page }) => {
    expect(await filter(page, {}), 'Все поля пустые — фильтры не заданы, должны остаться все строки').toEqual([
      'r1', 'r2', 'r3', 'r4',
    ]);
  });

  test('Оставляет строки выбранного продавца', async ({ page }) => {
    expect(await filter(page, { seller: 'Ivan Petrov' }), 'Ждали только строки продавца Ivan Petrov').toEqual(['r1', 'r4']);
  });

  test('Заполнено только «от»: пустое «до» не ограничивает сумму', async ({ page }) => {
    expect(
      await filter(page, { totalFrom: '1500' }),
      'При «от» = 1500 и пустом «до» ждали суммы 1500, 4657.56 и 3000. Пустая строка в поле значит «без ограничения», а не 0',
    ).toEqual(['r1', 'r2', 'r4']);
  });

  test('Заполнено только «до»: пустое «от» не ограничивает сумму', async ({ page }) => {
    expect(
      await filter(page, { totalTo: '1500' }),
      'При «до» = 1500 и пустом «от» ждали суммы 1500 и 300. Граница входит в диапазон',
    ).toEqual(['r1', 'r3']);
  });

  test('Сумма «от — до» включает обе границы', async ({ page }) => {
    expect(await filter(page, { totalFrom: '1500', totalTo: '3000' }), 'Ждали суммы от 1500 до 3000 включительно').toEqual([
      'r1', 'r4',
    ]);
    expect(
      await filter(page, { totalFrom: '4657.56', totalTo: '4657.56' }),
      'При «от» и «до» = 4657.56 ждали одну строку с этой суммой. Значения полей — строки, их нужно превратить в числа',
    ).toEqual(['r2']);
  });

  test('Продавец и сумма работают вместе', async ({ page }) => {
    expect(
      await filter(page, { seller: 'Ivan Petrov', totalFrom: '2000' }),
      'Продавец Ivan Petrov и сумма от 2000 — ждали одну строку с суммой 3000',
    ).toEqual(['r4']);
  });
});

test.describe('Функция nextOrder (sorting.js)', () => {
  test('Переключает сортировку по кругу: none → up → down → none', async ({ page }) => {
    for (const [order, next] of [['none', 'up'], ['up', 'down'], ['down', 'none']]) {
      const { value } = await call(page, '/src/sorting.js', 'nextOrder', order);
      expect(value, `nextOrder('${order}') должна вернуть '${next}'`).toBe(next);
    }
  });
});

test.describe('Функция applySort (sorting.js)', () => {
  const sort = async (page, field: string | null, order: string) => {
    const result = await call(page, '/src/sorting.js', 'applySort', rows, { field, order });
    expectArray(result.value, 'applySort');
    return { order: ids(result.value), argsChanged: result.argsChanged };
  };

  test('Сортирует по сумме по возрастанию и по убыванию', async ({ page }) => {
    expect((await sort(page, 'total', 'up')).order, 'По возрастанию суммы ждали 300, 1500, 3000, 4657.56').toEqual([
      'r3', 'r1', 'r4', 'r2',
    ]);
    expect((await sort(page, 'total', 'down')).order, 'По убыванию суммы ждали 4657.56, 3000, 1500, 300').toEqual([
      'r2', 'r4', 'r1', 'r3',
    ]);
  });

  test('Сортирует по дате: даты — строки, их сравнивают через < и >', async ({ page }) => {
    expect(
      (await sort(page, 'date', 'up')).order,
      'По возрастанию даты ждали 2023-11-20, 2023-12-04, 2024-01-15, 2024-01-15. ' +
        'Даты — строки, разность a - b для них даёт NaN',
    ).toEqual(['r4', 'r2', 'r1', 'r3']);
  });

  test('По убыванию строки с равными значениями остаются в исходном порядке', async ({ page }) => {
    expect(
      (await sort(page, 'date', 'down')).order,
      'По убыванию даты ждали r1, r3 (обе 2024-01-15, в исходном порядке), затем r2, r4. ' +
        'Не переворачивайте массив через reverse — он переставит равные строки. Поменяйте местами a и b в сравнении',
    ).toEqual(['r1', 'r3', 'r2', 'r4']);
  });

  test('Без сортировки возвращает строки в исходном порядке', async ({ page }) => {
    expect((await sort(page, null, 'none')).order, "При order 'none' порядок строк не меняется").toEqual([
      'r1', 'r2', 'r3', 'r4',
    ]);
  });

  test('Не меняет исходный массив', async ({ page }) => {
    expect(
      (await sort(page, 'total', 'up')).argsChanged,
      'applySort изменила переданный массив. Используйте toSorted, а не sort: иначе после третьего клика не вернуть исходный порядок',
    ).toBe(false);
  });
});

test.describe('Функции getPageCount и applyPagination (pagination.js)', () => {
  test('getPageCount считает число страниц, не меньше одной', async ({ page }) => {
    const cases: [number, number, number][] = [[230, 10, 23], [231, 10, 24], [100, 25, 4], [5, 10, 1], [0, 10, 1]];
    for (const [total, perPage, expected] of cases) {
      const { value } = await call(page, '/src/pagination.js', 'getPageCount', total, perPage);
      const hint = total === 0 ? '. Даже без строк страница одна' : total % perPage ? '. Неполная страница тоже считается' : '';
      expect(value, `getPageCount(${total}, ${perPage}) должна вернуть ${expected}${hint}`).toBe(expected);
    }
  });

  test('applyPagination возвращает строки нужной страницы', async ({ page }) => {
    const many = Array.from({ length: 25 }, (_, i) => ({ id: `r${i + 1}` }));
    const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `r${from + i}`);

    for (const [pageNumber, from, to] of [[1, 1, 10], [2, 11, 20], [3, 21, 25]]) {
      const { value } = await call(page, '/src/pagination.js', 'applyPagination', many, pageNumber, 10);
      expectArray(value, 'applyPagination');
      expect(
        ids(value),
        `applyPagination(25 строк, ${pageNumber}, 10) должна вернуть строки с ${from}-й по ${to}-ю`,
      ).toEqual(range(from, to));
    }
  });
});
