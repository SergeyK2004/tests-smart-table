import { data as source } from './dataset_1';

export interface TableRow {
  id: string;
  date: string;
  customer: string;
  seller: string;
  total: number;
}

interface Person {
  id: string;
  first_name: string;
  last_name: string;
}

const fullName = (person: Person) => `${person.first_name} ${person.last_name}`;
const nameById = (people: Person[], id: string) => fullName(people.find((person) => person.id === id)!);

// Строки таблицы в том же порядке, что и в датасете стартера
export const data: TableRow[] = source.purchase_records.map((record: any) => ({
  id: record.receipt_id,
  date: record.date,
  customer: nameById(source.customers, record.customer_id),
  seller: nameById(source.sellers, record.seller_id),
  total: record.total_amount,
}));

export const sellers: string[] = source.sellers.map(fullName);

// Сравнение для сортировки: даты — строки вида '2023-12-04', суммы — числа.
// Array.prototype.sort устойчива: строки с равными значениями остаются в исходном порядке.
const compare = (a: string | number, b: string | number) => (a < b ? -1 : a > b ? 1 : 0);

export function sortedBy(rows: TableRow[], field: 'date' | 'total', order: 'up' | 'down') {
  return [...rows].sort((a, b) => (order === 'up' ? compare(a[field], b[field]) : compare(b[field], a[field])));
}
