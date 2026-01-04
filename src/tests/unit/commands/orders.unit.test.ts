import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOrder } from "../../../commands/orders.js";
import { CreateOrderInput } from "../../../helpers/types.js";

vi.mock("../../../db/index.js", () => ({
  db: {
    data: {
      products: [],
      orders: [],
      customers: [],
    },
    read: vi.fn().mockResolvedValue(undefined),
    write: vi.fn().mockResolvedValue(undefined),
  },
}));

const { db } = await import("../../../db/index.js");

describe("Order Creation Logic", () => {
  beforeEach(() => {
    db.data = {
      products: [
        {
          id: "p1",
          name: "Laptop",
          description: "Gaming Laptop",
          category: "Electronics",
          price: 1000,
          stock: 100,
        },
        {
          id: "p2",
          name: "Book",
          description: "Programming Book",
          category: "Books",
          price: 50,
          stock: 200,
        },
        {
          id: "p3",
          name: "T-Shirt",
          description: "Cotton Shirt",
          category: "Clothing",
          price: 20,
          stock: 500,
        },
      ],
      orders: [],
      customers: [
        { id: "c1", name: "John Doe", location: "US" },
        { id: "c2", name: "Jane Smith", location: "Europe" },
        { id: "c3", name: "Akira Tanaka", location: "Asia" },
      ],
    };

    (db.read as jest.Mock).mockResolvedValue(undefined);
    (db.write as jest.Mock).mockResolvedValue(undefined);
  });

  describe("Basic Order Creation", () => {
    it("should create order with correct total for US customer", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [{ productId: "p1", quantity: 1 }],
      };

      const order = await createOrder(input);

      expect(order).toMatchObject({
        customerId: "c1",
        totalAmount: 1000,
        status: "completed",
      });
      expect(order.id).toBeDefined();
      expect(order.products).toHaveLength(1);
      expect(order.products[0]).toMatchObject({
        productId: "p1",
        quantity: 1,
        unitPrice: 1000,
      });
    });

    it("should create order with multiple products", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [
          { productId: "p1", quantity: 1 },
          { productId: "p2", quantity: 2 },
        ],
      };

      const order = await createOrder(input);

      expect(order.totalAmount).toBe(1100);
      expect(order.products).toHaveLength(2);
    });
  });

  describe("Location-based Pricing", () => {
    it("should apply 15% increase for Europe customer", async () => {
      const input: CreateOrderInput = {
        customerId: "c2",
        products: [{ productId: "p1", quantity: 1 }],
      };

      const order = await createOrder(input);

      expect(order.totalAmount).toBe(1150); // 1000 * 1.15
    });

    it("should apply 5% decrease for Asia customer", async () => {
      const input: CreateOrderInput = {
        customerId: "c3",
        products: [{ productId: "p1", quantity: 1 }],
      };

      const order = await createOrder(input);

      expect(order.totalAmount).toBe(950); // 1000 * 0.95
    });
  });

  describe("Volume Discounts", () => {
    it("should apply 10% discount for 5 units", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [{ productId: "p2", quantity: 5 }],
      };

      const order = await createOrder(input);

      expect(order.totalAmount).toBe(225); // 250 - 25 (10%)
    });

    it("should apply 20% discount for 10 units", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [{ productId: "p2", quantity: 10 }],
      };

      const order = await createOrder(input);

      expect(order.totalAmount).toBe(400);
    });

    it("should apply 30% discount for 50 units", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [{ productId: "p3", quantity: 50 }],
      };

      const order = await createOrder(input);

      expect(order.totalAmount).toBe(700);
    });
  });

  describe("Stock Management", () => {
    it("should decrease product stock after order", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [{ productId: "p1", quantity: 5 }],
      };

      const initialStock = db.data.products[0].stock;
      await createOrder(input);

      expect(db.data.products[0].stock).toBe(initialStock - 5);
    });

    it("should decrease stock for multiple products", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [
          { productId: "p1", quantity: 3 },
          { productId: "p2", quantity: 5 },
        ],
      };

      const initialStock1 = db.data.products[0].stock;
      const initialStock2 = db.data.products[1].stock;

      await createOrder(input);

      expect(db.data.products[0].stock).toBe(initialStock1 - 3);
      expect(db.data.products[1].stock).toBe(initialStock2 - 5);
    });

    it("should throw error when product not found", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [{ productId: "invalid", quantity: 1 }],
      };

      await expect(createOrder(input)).rejects.toThrow(
        "Product invalid not found"
      );
    });

    it("should throw error when insufficient stock", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [{ productId: "p1", quantity: 101 }],
      };

      await expect(createOrder(input)).rejects.toThrow(
        "Insufficient stock for product Laptop"
      );
    });
  });

  describe("Customer Validation", () => {
    it("should throw error when customer not found", async () => {
      const input: CreateOrderInput = {
        customerId: "invalid",
        products: [{ productId: "p1", quantity: 1 }],
      };

      await expect(createOrder(input)).rejects.toThrow("Customer not found");
    });
  });

  describe("Order Persistence", () => {
    it("should add order to database", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [{ productId: "p1", quantity: 1 }],
      };

      const initialOrderCount = db.data.orders.length;
      await createOrder(input);

      expect(db.data.orders.length).toBe(initialOrderCount + 1);
    });

    it("should call db.write() to persist changes", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [{ productId: "p1", quantity: 1 }],
      };

      await createOrder(input);

      expect(db.write).toHaveBeenCalled();
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle edge case of 0 total after discount", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [{ productId: "p3", quantity: 50 }],
      };

      const order = await createOrder(input);

      expect(order.totalAmount).toBeGreaterThanOrEqual(0);
    });

    it("should calculate correct totals with mixed products and quantities", async () => {
      const input: CreateOrderInput = {
        customerId: "c1",
        products: [
          { productId: "p1", quantity: 2 },
          { productId: "p2", quantity: 3 },
          { productId: "p3", quantity: 5 },
        ],
      };

      const order = await createOrder(input);
      expect(order.totalAmount).toBe(1800);
    });
  });
});
