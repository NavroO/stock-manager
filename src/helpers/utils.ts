import { getDate, getMonth } from "date-fns";
import { POLISH_HOLIDAYS_MMDD, PolishHolidayMMDD } from "./types.js";

export const isPolishHolidayMMDD = (
  value: string
): value is PolishHolidayMMDD => {
  return (POLISH_HOLIDAYS_MMDD as readonly string[]).includes(value);
};

export const isValidDate = (date: Date) => {
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
  const mmdd = isValidDate(date);
  return isPolishHolidayMMDD(mmdd);
};
