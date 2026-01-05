import { getDate, getMonth } from "date-fns";
import { db } from "../db/index.js";
import {
  BLACK_FRIDAY_DISCOUNT,
  HOLIDAY_DISCOUNT_RATE,
  HOLIDAY_TARGET_CATEGORIES,
  LOCATION_MULTIPLIERS,
  OrderProduct,
  POLISH_HOLIDAYS_MMDD,
  PolishHolidayMMDD,
  Product,
  VOLUME_DISCOUNTS,
} from "./types.js";

export const isPolishHolidayMMDD = (
  value: string
): value is PolishHolidayMMDD => {
  return (POLISH_HOLIDAYS_MMDD as readonly string[]).includes(value);
};

export const getDateMMDD = (date: Date) => {
  const month = (getMonth(date) + 1).toString().padStart(2, "0");
  const day = getDate(date).toString().padStart(2, "0");
  return `${month}-${day}`;
};

export const isBlackFriday = (date: Date): boolean => {
  const month = getMonth(date);
  const dayOfWeek = date.getDay();
  const dayOfMonth = getDate(date);
  if (month !== 10) return false;
  return dayOfWeek === 5 && dayOfMonth >= 23 && dayOfMonth <= 29;
};

export const isHoliday = (date: Date): boolean => {
  const mmdd = getDateMMDD(date);
  return isPolishHolidayMMDD(mmdd);
};

export const getLocationMultiplier = (location: string): number => {
  return LOCATION_MULTIPLIERS[location] ?? 1.0;
};

export const getVolumeDiscountRate = (totalUnits: number): number => {
  const discount = VOLUME_DISCOUNTS.find((d) => totalUnits >= d.minUnits);
  return discount?.rate ?? 0;
};

export const calculateVolumeDiscount = (
  subTotal: number,
  totalUnits: number
): number => {
  const rate = getVolumeDiscountRate(totalUnits);
  return subTotal * rate;
};

export const calculateBlackFridayDiscount = (
  subTotal: number,
  date: Date
): number => {
  return isBlackFriday(date) ? subTotal * BLACK_FRIDAY_DISCOUNT : 0;
};

export const calculateHolidayDiscount = (
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

export const calculateBestDiscount = (
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

export const ensureDbInitialized = async () => {
  await db.read();
  if (!db.data) throw new Error("Database not initialized");
};

export const saveDb = async () => {
  await db.write();
};
