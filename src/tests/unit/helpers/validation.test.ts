import { createOrderSchema } from "../../../schemas/orderSchemas.js";
import {
  createProductSchema,
  restockProductSchema,
  sellProductSchema,
} from "../../../schemas/productSchemas.js";

describe("Product Schema Validation", () => {
  describe("createProductSchema", () => {
    it("should validate correct product data", () => {
      const validProduct = {
        name: "Laptop",
        description: "Gaming Laptop",
        category: "Electronics",
        price: 1000,
        stock: 50,
      };

      const { error, value } = createProductSchema.validate(validProduct);

      expect(error).toBeUndefined();
      expect(value).toEqual(validProduct);
    });

    it("should reject missing name", () => {
      const invalidProduct = {
        description: "Gaming Laptop",
        category: "Electronics",
        price: 1000,
        stock: 50,
      };

      const { error } = createProductSchema.validate(invalidProduct);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("name");
    });

    it("should reject name longer than 50 characters", () => {
      const invalidProduct = {
        name: "A".repeat(51),
        description: "Test",
        category: "Test",
        price: 100,
        stock: 10,
      };

      const { error } = createProductSchema.validate(invalidProduct);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("length");
    });

    it("should reject description longer than 50 characters", () => {
      const invalidProduct = {
        name: "Laptop",
        description: "A".repeat(51),
        category: "Electronics",
        price: 1000,
        stock: 50,
      };

      const { error } = createProductSchema.validate(invalidProduct);

      expect(error).toBeDefined();
    });

    it("should reject negative price", () => {
      const invalidProduct = {
        name: "Laptop",
        description: "Gaming Laptop",
        category: "Electronics",
        price: -100,
        stock: 50,
      };

      const { error } = createProductSchema.validate(invalidProduct);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("positive");
    });

    it("should reject zero price", () => {
      const invalidProduct = {
        name: "Laptop",
        description: "Gaming Laptop",
        category: "Electronics",
        price: 0,
        stock: 50,
      };

      const { error } = createProductSchema.validate(invalidProduct);

      expect(error).toBeDefined();
    });

    it("should reject negative stock", () => {
      const invalidProduct = {
        name: "Laptop",
        description: "Gaming Laptop",
        category: "Electronics",
        price: 1000,
        stock: -5,
      };

      const { error } = createProductSchema.validate(invalidProduct);

      expect(error).toBeDefined();
    });

    it("should accept zero stock", () => {
      const validProduct = {
        name: "Laptop",
        description: "Gaming Laptop",
        category: "Electronics",
        price: 1000,
        stock: 0,
      };

      const { error } = createProductSchema.validate(validProduct);

      expect(error).toBeUndefined();
    });

    it("should reject non-integer stock", () => {
      const invalidProduct = {
        name: "Laptop",
        description: "Gaming Laptop",
        category: "Electronics",
        price: 1000,
        stock: 10.5,
      };

      const { error } = createProductSchema.validate(invalidProduct);

      expect(error).toBeDefined();
    });

    it("should accept decimal price", () => {
      const validProduct = {
        name: "Book",
        description: "Programming Book",
        category: "Books",
        price: 29.99,
        stock: 100,
      };

      const { error } = createProductSchema.validate(validProduct);

      expect(error).toBeUndefined();
    });
  });

  describe("restockProductSchema", () => {
    it("should validate correct restock quantity", () => {
      const validData = { quantity: 50 };

      const { error, value } = restockProductSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it("should reject zero quantity", () => {
      const invalidData = { quantity: 0 };

      const { error } = restockProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("positive");
    });

    it("should reject negative quantity", () => {
      const invalidData = { quantity: -10 };

      const { error } = restockProductSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it("should reject non-integer quantity", () => {
      const invalidData = { quantity: 10.5 };

      const { error } = restockProductSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it("should reject missing quantity", () => {
      const invalidData = {};

      const { error } = restockProductSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("quantity");
    });
  });

  describe("sellProductSchema", () => {
    it("should validate correct sell quantity", () => {
      const validData = { quantity: 25 };

      const { error, value } = sellProductSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it("should reject zero quantity", () => {
      const invalidData = { quantity: 0 };

      const { error } = sellProductSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it("should reject negative quantity", () => {
      const invalidData = { quantity: -5 };

      const { error } = sellProductSchema.validate(invalidData);

      expect(error).toBeDefined();
    });

    it("should reject non-integer quantity", () => {
      const invalidData = { quantity: 7.3 };

      const { error } = sellProductSchema.validate(invalidData);

      expect(error).toBeDefined();
    });
  });
});

describe("Order Schema Validation", () => {
  describe("createOrderSchema", () => {
    it("should validate correct order data", () => {
      const validOrder = {
        customerId: "c1",
        products: [
          { productId: "p1", quantity: 2 },
          { productId: "p2", quantity: 5 },
        ],
      };

      const { error, value } = createOrderSchema.validate(validOrder);

      expect(error).toBeUndefined();
      expect(value).toEqual(validOrder);
    });

    it("should reject missing customerId", () => {
      const invalidOrder = {
        products: [{ productId: "p1", quantity: 2 }],
      };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("customerId");
    });

    it("should reject empty products array", () => {
      const invalidOrder = {
        customerId: "c1",
        products: [],
      };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("at least 1");
    });

    it("should reject missing products array", () => {
      const invalidOrder = {
        customerId: "c1",
      };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("products");
    });

    it("should reject product without productId", () => {
      const invalidOrder = {
        customerId: "c1",
        products: [{ quantity: 2 }],
      };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("productId");
    });

    it("should reject product without quantity", () => {
      const invalidOrder = {
        customerId: "c1",
        products: [{ productId: "p1" }],
      };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain("quantity");
    });

    it("should reject zero quantity", () => {
      const invalidOrder = {
        customerId: "c1",
        products: [{ productId: "p1", quantity: 0 }],
      };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
    });

    it("should reject negative quantity", () => {
      const invalidOrder = {
        customerId: "c1",
        products: [{ productId: "p1", quantity: -5 }],
      };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
    });

    it("should reject non-integer quantity", () => {
      const invalidOrder = {
        customerId: "c1",
        products: [{ productId: "p1", quantity: 2.5 }],
      };

      const { error } = createOrderSchema.validate(invalidOrder);

      expect(error).toBeDefined();
    });

    it("should validate order with single product", () => {
      const validOrder = {
        customerId: "c1",
        products: [{ productId: "p1", quantity: 1 }],
      };

      const { error } = createOrderSchema.validate(validOrder);

      expect(error).toBeUndefined();
    });

    it("should validate order with multiple products", () => {
      const validOrder = {
        customerId: "c1",
        products: [
          { productId: "p1", quantity: 1 },
          { productId: "p2", quantity: 2 },
          { productId: "p3", quantity: 3 },
        ],
      };

      const { error } = createOrderSchema.validate(validOrder);

      expect(error).toBeUndefined();
    });
  });
});
