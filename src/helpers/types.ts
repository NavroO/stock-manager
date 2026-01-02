export const POLISH_HOLIDAYS_MMDD = [
  "01-01",
  "01-06",
  "04-20",
  "04-21",
  "05-01",
  "05-03",
  "06-08",
  "06-19",
  "08-15",
  "11-01",
  "11-11",
  "12-25",
  "12-26",
] as const;

export type PolishHolidayMMDD = (typeof POLISH_HOLIDAYS_MMDD)[number];

export interface CreateOrderInput {
  customerId: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
}

export interface OrderProduct {
  productId: string;
  quantity: number;
  unitPrice: number;
}

type OrderStatus = "pending" | "completed" | "cancelled";

export interface Order {
  id: string;
  customerId: string;
  products: OrderProduct[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  location: string;
}

export interface Data {
  products: Product[];
  orders: Order[];
  customers: Customer[];
}
