import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import {
  CreateOrderInput,
  Order,
  OrderProduct,
  Product,
} from "../helpers/types.js";
import {
  calculateBestDiscount,
  ensureDbInitialized,
  getLocationMultiplier,
  saveDb,
} from "../helpers/utils.js";

const buildOrderProducts = (
  input: CreateOrderInput,
  products: Product[],
  locationMultiplier: number
): { orderProducts: OrderProduct[]; subTotal: number; totalUnits: number } => {
  const orderProducts: OrderProduct[] = [];
  let subTotal = 0;
  let totalUnits = 0;

  for (const item of input.products) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for product ${product.name}`);
    }

    const adjustedUnitPrice = product.price * locationMultiplier;

    orderProducts.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice: adjustedUnitPrice,
    });

    subTotal += adjustedUnitPrice * item.quantity;
    totalUnits += item.quantity;
  }

  return { orderProducts, subTotal, totalUnits };
};

const updateProductStock = (
  input: CreateOrderInput,
  products: Product[]
): void => {
  for (const item of input.products) {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      product.stock -= item.quantity;
    }
  }
};

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  const today = new Date();
  await ensureDbInitialized();

  const customer = db.data.customers.find((c) => c.id === input.customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }

  const locationMultiplier = getLocationMultiplier(customer.location);

  const { orderProducts, subTotal, totalUnits } = buildOrderProducts(
    input,
    db.data.products,
    locationMultiplier
  );

  const bestDiscount = calculateBestDiscount(
    subTotal,
    totalUnits,
    orderProducts,
    db.data.products,
    today
  );

  const finalAmount = Math.max(subTotal - bestDiscount, 0);

  updateProductStock(input, db.data.products);

  const newOrder: Order = {
    id: uuidv4(),
    customerId: input.customerId,
    products: orderProducts,
    totalAmount: finalAmount,
    status: "completed",
    createdAt: new Date().toISOString(),
  };

  db.data.orders.push(newOrder);
  await saveDb();

  return newOrder;
};
