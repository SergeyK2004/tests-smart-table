import type { TableRow } from "./types";
import { data as rawData } from './dataset_1';

interface Seller {
  id: number | string;
  first_name: string;
  last_name: string;
}

interface Customer {
  id: number | string;
  first_name: string;
  last_name: string;
}

interface PurchaseRecord {
  receipt_id: number | string;
  date: string;
  seller_id: number | string;
  customer_id: number | string;
  total_amount: number;
}

interface SourceData {
  sellers: Seller[];
  customers: Customer[];
  purchase_records: PurchaseRecord[];
}

export const makeIndex = <T extends Record<string, any>, V>(
  arr: T[],
  field: keyof T,
  val: (item: T) => V
): Record<string | number, V> => {
  return arr.reduce((acc, cur) => ({
    ...acc,
    [cur[field]]: val(cur)
  }), {} as Record<string | number, V>);
};

function initData(sourceData: SourceData) {
  const sellers = makeIndex<Seller, string>(
    sourceData.sellers,
    'id',
    v => `${v.first_name} ${v.last_name}`
  );

  const customers = makeIndex<Customer, string>(
    sourceData.customers,
    'id',
    v => `${v.first_name} ${v.last_name}`
  );

  const data: TableRow[] = sourceData.purchase_records.map(item => ({
    id: item.receipt_id,
    date: item.date,
    seller: sellers[item.seller_id],
    customer: customers[item.customer_id],
    total: item.total_amount
  }));

  return { sellers, customers, data };
}

export const { data, ...indexes } = initData(rawData);