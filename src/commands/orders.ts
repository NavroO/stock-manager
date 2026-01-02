import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import {
  CreateOrderInput,
  Order,
  OrderProduct,
  Product,
} from "../helpers/types.js";
import { isBlackFriday, isHoliday } from "../helpers/utils.js";

const LOCATION_MULTIPLIERS: Record<string, number> = {
  Europe: 1.15,
  Asia: 0.95,
};

const VOLUME_DISCOUNTS = [
  { minUnits: 50, rate: 0.3 },
  { minUnits: 10, rate: 0.2 },
  { minUnits: 5, rate: 0.1 },
];

const BLACK_FRIDAY_DISCOUNT = 0.25;
const HOLIDAY_DISCOUNT_RATE = 0.15;
const HOLIDAY_TARGET_CATEGORIES = ["Electronics", "Books"];

const getLocationMultiplier = (location: string): number => {
  return LOCATION_MULTIPLIERS[location] ?? 1.0;
};

const getVolumeDiscountRate = (totalUnits: number): number => {
  const discount = VOLUME_DISCOUNTS.find((d) => totalUnits >= d.minUnits);
  return discount?.rate ?? 0;
};

const calculateVolumeDiscount = (
  subTotal: number,
  totalUnits: number
): number => {
  const rate = getVolumeDiscountRate(totalUnits);
  return subTotal * rate;
};

const calculateBlackFridayDiscount = (subTotal: number, date: Date): number => {
  return isBlackFriday(date) ? subTotal * BLACK_FRIDAY_DISCOUNT : 0;
};

const calculateHolidayDiscount = (
  orderProducts: OrderProduct[],
  products: Product[],
  date: Date
): number => {
  if (!isHoliday(date)) return 0;

  let holidaySaving = 0;
  for (const op of orderProducts) {
    const product = products.find((p) => p.id === op.productId);
    if (product && HOLIDAY_TARGET_CATEGORIES.includes(product.category)) {
      holidaySaving += op.unitPrice * op.quantity * HOLIDAY_DISCOUNT_RATE;
    }
  }
  return holidaySaving;
};

const calculateBestDiscount = (
  subTotal: number,
  totalUnits: number,
  orderProducts: OrderProduct[],
  products: Product[],
  date: Date
): number => {
  const volumeDiscount = calculateVolumeDiscount(subTotal, totalUnits);
  const blackFridayDiscount = calculateBlackFridayDiscount(subTotal, date);
  const holidayDiscount = calculateHolidayDiscount(
    orderProducts,
    products,
    date
  );

  return Math.max(volumeDiscount, blackFridayDiscount, holidayDiscount);
};

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
  await db.read();

  if (!db.data) {
    throw new Error("Database not initialized");
  }

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
  await db.write();

  return newOrder;
};
