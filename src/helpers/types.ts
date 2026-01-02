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
