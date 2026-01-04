import { OrderProduct, Product } from "../../../helpers/types.js";
import {
  calculateBestDiscount,
  calculateBlackFridayDiscount,
  calculateHolidayDiscount,
  calculateVolumeDiscount,
  getLocationMultiplier,
  getVolumeDiscountRate,
  isBlackFriday,
  isHoliday,
} from "../../../helpers/utils.js";

describe("Date Validation Utils", () => {
  describe("isBlackFriday", () => {
    it("should return true for Black Friday (last Friday of November)", () => {
      const blackFriday = new Date("2024-11-29");
      expect(isBlackFriday(blackFriday)).toBe(true);
    });

    it("should return false for Friday not in valid range", () => {
      const earlyFriday = new Date("2024-11-22");
      expect(isBlackFriday(earlyFriday)).toBe(false);
    });

    it("should return false for non-Friday in November", () => {
      const thursday = new Date("2024-11-28");
      expect(isBlackFriday(thursday)).toBe(false);
    });

    it("should return false for Friday in different month", () => {
      const decemberFriday = new Date("2024-12-27");
      expect(isBlackFriday(decemberFriday)).toBe(false);
    });
  });

  describe("isHoliday", () => {
    it("should return true for Polish New Year (01-01)", () => {
      const newYear = new Date("2024-01-01");
      expect(isHoliday(newYear)).toBe(true);
    });

    it("should return true for Polish Independence Day (11-11)", () => {
      const independenceDay = new Date("2024-11-11");
      expect(isHoliday(independenceDay)).toBe(true);
    });

    it("should return true for Christmas (12-25)", () => {
      const christmas = new Date("2024-12-25");
      expect(isHoliday(christmas)).toBe(true);
    });

    it("should return false for regular day", () => {
      const regularDay = new Date("2024-07-15");
      expect(isHoliday(regularDay)).toBe(false);
    });
  });
});

describe("Location Pricing Utils", () => {
  describe("getLocationMultiplier", () => {
    it("should return 1.15 for Europe", () => {
      expect(getLocationMultiplier("Europe")).toBe(1.15);
    });

    it("should return 0.95 for Asia", () => {
      expect(getLocationMultiplier("Asia")).toBe(0.95);
    });

    it("should return 1.0 for US (default)", () => {
      expect(getLocationMultiplier("US")).toBe(1.0);
    });

    it("should return 1.0 for unknown location", () => {
      expect(getLocationMultiplier("Unknown")).toBe(1.0);
    });
  });
});

describe("Volume Discount Utils", () => {
  describe("getVolumeDiscountRate", () => {
    it("should return 0.3 for 50+ units", () => {
      expect(getVolumeDiscountRate(50)).toBe(0.3);
      expect(getVolumeDiscountRate(100)).toBe(0.3);
    });

    it("should return 0.2 for 10-49 units", () => {
      expect(getVolumeDiscountRate(10)).toBe(0.2);
      expect(getVolumeDiscountRate(49)).toBe(0.2);
    });

    it("should return 0.1 for 5-9 units", () => {
      expect(getVolumeDiscountRate(5)).toBe(0.1);
      expect(getVolumeDiscountRate(9)).toBe(0.1);
    });

    it("should return 0 for less than 5 units", () => {
      expect(getVolumeDiscountRate(4)).toBe(0);
      expect(getVolumeDiscountRate(1)).toBe(0);
    });
  });

  describe("calculateVolumeDiscount", () => {
    it("should calculate 30% discount for 50+ units", () => {
      const subTotal = 1000;
      const discount = calculateVolumeDiscount(subTotal, 50);
      expect(discount).toBe(300);
    });

    it("should calculate 20% discount for 10 units", () => {
      const subTotal = 500;
      const discount = calculateVolumeDiscount(subTotal, 10);
      expect(discount).toBe(100);
    });

    it("should calculate 10% discount for 5 units", () => {
      const subTotal = 200;
      const discount = calculateVolumeDiscount(subTotal, 5);
      expect(discount).toBe(20);
    });

    it("should return 0 discount for less than 5 units", () => {
      const subTotal = 100;
      const discount = calculateVolumeDiscount(subTotal, 3);
      expect(discount).toBe(0);
    });
  });
});

describe("Black Friday Discount Utils", () => {
  describe("calculateBlackFridayDiscount", () => {
    it("should calculate 25% discount on Black Friday", () => {
      const blackFriday = new Date("2024-11-29");
      const subTotal = 1000;
      const discount = calculateBlackFridayDiscount(subTotal, blackFriday);
      expect(discount).toBe(250);
    });

    it("should return 0 discount on non-Black Friday", () => {
      const regularDay = new Date("2024-11-20");
      const subTotal = 1000;
      const discount = calculateBlackFridayDiscount(subTotal, regularDay);
      expect(discount).toBe(0);
    });
  });
});

describe("Holiday Discount Utils", () => {
  describe("calculateHolidayDiscount", () => {
    const products: Product[] = [
      {
        id: "p1",
        name: "Laptop",
        description: "Tech",
        category: "Electronics",
        price: 1000,
        stock: 10,
      },
      {
        id: "p2",
        name: "Book",
        description: "Novel",
        category: "Books",
        price: 20,
        stock: 50,
      },
      {
        id: "p3",
        name: "T-Shirt",
        description: "Clothing",
        category: "Apparel",
        price: 30,
        stock: 100,
      },
    ];

    it("should calculate 15% discount for Electronics on holiday", () => {
      const holiday = new Date("2024-12-25");
      const orderProducts: OrderProduct[] = [
        { productId: "p1", quantity: 2, unitPrice: 1000 },
      ];

      const discount = calculateHolidayDiscount(
        orderProducts,
        products,
        holiday
      );
      expect(discount).toBe(300); // 2000 * 0.15
    });

    it("should calculate 15% discount for Books on holiday", () => {
      const holiday = new Date("2024-12-25");
      const orderProducts: OrderProduct[] = [
        { productId: "p2", quantity: 5, unitPrice: 20 },
      ];

      const discount = calculateHolidayDiscount(
        orderProducts,
        products,
        holiday
      );
      expect(discount).toBe(15); // 100 * 0.15
    });

    it("should not apply discount for non-eligible categories", () => {
      const holiday = new Date("2024-12-25");
      const orderProducts: OrderProduct[] = [
        { productId: "p3", quantity: 3, unitPrice: 30 },
      ];

      const discount = calculateHolidayDiscount(
        orderProducts,
        products,
        holiday
      );
      expect(discount).toBe(0);
    });

    it("should apply discount only to eligible products in mixed order", () => {
      const holiday = new Date("2024-12-25");
      const orderProducts: OrderProduct[] = [
        { productId: "p1", quantity: 1, unitPrice: 1000 },
        { productId: "p2", quantity: 2, unitPrice: 20 },
        { productId: "p3", quantity: 1, unitPrice: 30 },
      ];

      const discount = calculateHolidayDiscount(
        orderProducts,
        products,
        holiday
      );
      expect(discount).toBe(156);
    });

    it("should return 0 discount on non-holiday", () => {
      const regularDay = new Date("2024-07-15");
      const orderProducts: OrderProduct[] = [
        { productId: "p1", quantity: 1, unitPrice: 1000 },
      ];

      const discount = calculateHolidayDiscount(
        orderProducts,
        products,
        regularDay
      );
      expect(discount).toBe(0);
    });
  });
});

describe("Best Discount Selection", () => {
  describe("calculateBestDiscount", () => {
    const products: Product[] = [
      {
        id: "p1",
        name: "Laptop",
        description: "Tech",
        category: "Electronics",
        price: 1000,
        stock: 10,
      },
    ];

    it("should select volume discount when it's the highest", () => {
      const regularDay = new Date("2024-07-15");
      const orderProducts: OrderProduct[] = [
        { productId: "p1", quantity: 50, unitPrice: 1000 },
      ];
      const subTotal = 50000;

      const discount = calculateBestDiscount(
        subTotal,
        50,
        orderProducts,
        products,
        regularDay
      );
      expect(discount).toBe(15000); // 30% volume discount
    });

    it("should select Black Friday discount when it's the highest", () => {
      const blackFriday = new Date("2024-11-29");
      const orderProducts: OrderProduct[] = [
        { productId: "p1", quantity: 3, unitPrice: 1000 },
      ];
      const subTotal = 3000;

      const discount = calculateBestDiscount(
        subTotal,
        3,
        orderProducts,
        products,
        blackFriday
      );
      expect(discount).toBe(750); // 25% Black Friday discount
    });

    it("should select holiday discount when it's the highest", () => {
      const holiday = new Date("2024-12-25");
      const orderProducts: OrderProduct[] = [
        { productId: "p1", quantity: 2, unitPrice: 1000 },
      ];
      const subTotal = 2000;

      const discount = calculateBestDiscount(
        subTotal,
        2,
        orderProducts,
        products,
        holiday
      );
      expect(discount).toBe(300);
    });

    it("should compare all discounts and select maximum", () => {
      const blackFridayHoliday = new Date("2024-11-29");
      const orderProducts: OrderProduct[] = [
        { productId: "p1", quantity: 10, unitPrice: 1000 },
      ];
      const subTotal = 10000;

      const discount = calculateBestDiscount(
        subTotal,
        10,
        orderProducts,
        products,
        blackFridayHoliday
      );
      expect(discount).toBe(2500);
    });

    it("should return 0 when no discounts apply", () => {
      const regularDay = new Date("2024-07-15");
      const orderProducts: OrderProduct[] = [
        { productId: "p1", quantity: 1, unitPrice: 1000 },
      ];
      const subTotal = 1000;

      const discount = calculateBestDiscount(
        subTotal,
        1,
        orderProducts,
        products,
        regularDay
      );
      expect(discount).toBe(0);
    });
  });
});
