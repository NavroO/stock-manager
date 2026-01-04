import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProduct,
  restockProduct,
  sellProduct,
} from "../../../commands/products.js";
import { CreateProductInput } from "../../../helpers/types.js";

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

describe("Product Management Logic", () => {
  beforeEach(() => {
    db.data = {
      products: [
        {
          id: "p1",
          name: "Laptop",
          description: "Gaming Laptop",
          category: "Electronics",
          price: 1000,
          stock: 50,
        },
        {
          id: "p2",
          name: "Book",
          description: "Programming Book",
          category: "Books",
          price: 30,
          stock: 100,
        },
      ],
      orders: [],
      customers: [],
    };

    (db.read as jest.Mock).mockResolvedValue(undefined);
    (db.write as jest.Mock).mockResolvedValue(undefined);
  });

  describe("createProduct", () => {
    it("should create a new product with all fields", async () => {
      const input: CreateProductInput = {
        name: "Mouse",
        description: "Wireless Mouse",
        category: "Electronics",
        price: 25,
        stock: 200,
      };

      const product = await createProduct(input);

      expect(product).toMatchObject({
        name: "Mouse",
        description: "Wireless Mouse",
        category: "Electronics",
        price: 25,
        stock: 200,
      });
      expect(product.id).toBeDefined();
    });

    it("should add product to database", async () => {
      const input: CreateProductInput = {
        name: "Keyboard",
        description: "Mechanical Keyboard",
        category: "Electronics",
        price: 100,
        stock: 50,
      };

      const initialCount = db.data.products.length;
      await createProduct(input);

      expect(db.data.products.length).toBe(initialCount + 1);
    });

    it("should call db.write() to persist new product", async () => {
      const input: CreateProductInput = {
        name: "Monitor",
        description: "4K Monitor",
        category: "Electronics",
        price: 500,
        stock: 20,
      };

      await createProduct(input);

      expect(db.write).toHaveBeenCalled();
    });

    it("should generate unique ID for each product", async () => {
      const input: CreateProductInput = {
        name: "Test Product",
        description: "Test",
        category: "Test",
        price: 10,
        stock: 10,
      };

      const product1 = await createProduct(input);
      const product2 = await createProduct(input);

      expect(product1.id).not.toBe(product2.id);
    });
  });

  describe("restockProduct", () => {
    it("should increase stock by specified quantity", async () => {
      const initialStock = db.data.products[0].stock;
      const product = await restockProduct("p1", 20);

      expect(product.stock).toBe(initialStock + 20);
    });

    it("should handle large restock quantities", async () => {
      const initialStock = db.data.products[0].stock;
      const product = await restockProduct("p1", 1000);

      expect(product.stock).toBe(initialStock + 1000);
    });

    it("should call db.write() to persist stock change", async () => {
      await restockProduct("p1", 10);

      expect(db.write).toHaveBeenCalled();
    });

    it("should throw error when product not found", async () => {
      await expect(restockProduct("invalid-id", 10)).rejects.toThrow(
        "Product not found"
      );
    });

    it("should return updated product with all fields", async () => {
      const product = await restockProduct("p1", 25);

      expect(product).toMatchObject({
        id: "p1",
        name: "Laptop",
        description: "Gaming Laptop",
        category: "Electronics",
        price: 1000,
        stock: 75,
      });
    });

    it("should handle multiple consecutive restocks", async () => {
      await restockProduct("p1", 10);
      await restockProduct("p1", 20);
      const product = await restockProduct("p1", 15);

      expect(product.stock).toBe(95);
    });
  });

  describe("sellProduct", () => {
    it("should decrease stock by specified quantity", async () => {
      const initialStock = db.data.products[0].stock;
      const product = await sellProduct("p1", 10);

      expect(product.stock).toBe(initialStock - 10);
    });

    it("should allow selling entire stock", async () => {
      const product = await sellProduct("p1", 50);

      expect(product.stock).toBe(0);
    });

    it("should throw error when insufficient stock", async () => {
      await expect(sellProduct("p1", 51)).rejects.toThrow("Insufficient stock");
    });

    it("should throw error when selling more than available", async () => {
      await expect(sellProduct("p1", 1000)).rejects.toThrow(
        "Insufficient stock"
      );
    });

    it("should throw error when product not found", async () => {
      await expect(sellProduct("invalid-id", 5)).rejects.toThrow(
        "Product not found"
      );
    });

    it("should call db.write() to persist stock change", async () => {
      await sellProduct("p1", 5);

      expect(db.write).toHaveBeenCalled();
    });

    it("should return updated product with all fields", async () => {
      const product = await sellProduct("p1", 20);

      expect(product).toMatchObject({
        id: "p1",
        name: "Laptop",
        description: "Gaming Laptop",
        category: "Electronics",
        price: 1000,
        stock: 30,
      });
    });

    it("should handle edge case of selling exactly available stock", async () => {
      const product = await sellProduct("p2", 100);

      expect(product.stock).toBe(0);
    });
  });

  describe("Stock Management Edge Cases", () => {
    it("should not allow negative stock after sell", async () => {
      await expect(sellProduct("p1", 100)).rejects.toThrow(
        "Insufficient stock"
      );
    });

    it("should handle selling 1 unit correctly", async () => {
      const product = await sellProduct("p1", 1);

      expect(product.stock).toBe(49);
    });

    it("should handle restocking 1 unit correctly", async () => {
      const product = await restockProduct("p1", 1);

      expect(product.stock).toBe(51);
    });

    it("should maintain stock accuracy through multiple operations", async () => {
      await restockProduct("p1", 50); // 50 + 50 = 100
      await sellProduct("p1", 30); // 100 - 30 = 70
      await restockProduct("p1", 10); // 70 + 10 = 80
      const product = await sellProduct("p1", 20); // 80 - 20 = 60

      expect(product.stock).toBe(60);
    });
  });

  describe("Database Interaction", () => {
    it("should call db.read() before operations", async () => {
      await createProduct({
        name: "Test",
        description: "Test",
        category: "Test",
        price: 10,
        stock: 10,
      });

      expect(db.read).toHaveBeenCalled();
    });

    it("should maintain data integrity across operations", async () => {
      const input: CreateProductInput = {
        name: "Test Product",
        description: "Test",
        category: "Test",
        price: 50,
        stock: 100,
      };

      const newProduct = await createProduct(input);
      await restockProduct(newProduct.id, 50);
      const finalProduct = await sellProduct(newProduct.id, 30);

      expect(finalProduct.stock).toBe(120);
    });
  });
});
