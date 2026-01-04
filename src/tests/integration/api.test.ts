import request from "supertest";
import { app, initializeDatabaseConnection } from "../../app.js";
import { db } from "../../db/index.js";

beforeAll(async () => {
  await initializeDatabaseConnection();
});

beforeEach(async () => {
  db.data = {
    products: [],
    orders: [],
    customers: [
      { id: "c1", name: "John Doe", location: "US" },
      { id: "c2", name: "Jane Smith", location: "Europe" },
      { id: "c3", name: "Akira Tanaka", location: "Asia" },
    ],
  };
  await db.write();
});

describe("Product API", () => {
  it("should create a new product", async () => {
    const res = await request(app).post("/products").send({
      name: "Test Product",
      description: "Desc",
      category: "Electronics",
      price: 100,
      stock: 10,
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("Test Product");
  });

  it("should get all products", async () => {
    db.data!.products.push({
      id: "p1",
      name: "P1",
      description: "D1",
      category: "C1",
      price: 10,
      stock: 5,
    });
    await db.write();

    const res = await request(app).get("/products");
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(1);
  });

  it("should restock product", async () => {
    db.data!.products.push({
      id: "p1",
      name: "P1",
      description: "D1",
      category: "C1",
      price: 10,
      stock: 5,
    });
    await db.write();

    const res = await request(app)
      .post("/products/p1/restock")
      .send({ quantity: 5 });
    expect(res.statusCode).toEqual(200);
    expect(res.body.stock).toBe(10);
  });
});

describe("Order API", () => {
  beforeEach(async () => {
    db.data!.products = [
      {
        id: "p1",
        name: "Laptop",
        description: "Tech",
        category: "Electronics",
        price: 1000,
        stock: 100,
      },
      {
        id: "p2",
        name: "T-Shirt",
        description: "Apparel",
        category: "Clothing",
        price: 20,
        stock: 100,
      },
    ];
    await db.write();
  });

  it("should create regular order for US customer (Standard Price)", async () => {
    const res = await request(app)
      .post("/orders")
      .send({
        customerId: "c1",
        products: [{ productId: "p1", quantity: 1 }],
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.totalAmount).toBe(1000);
  });

  it("should apply Europe location pricing (+15%)", async () => {
    const res = await request(app)
      .post("/orders")
      .send({
        customerId: "c2",
        products: [{ productId: "p1", quantity: 1 }],
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.totalAmount).toBe(1150);
  });

  it("should apply Volume Discount (10% for >= 5 units)", async () => {
    const res = await request(app)
      .post("/orders")
      .send({
        customerId: "c1",
        products: [{ productId: "p2", quantity: 5 }],
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.totalAmount).toBe(90);
  });

  it("should reject order if insufficient stock", async () => {
    const res = await request(app)
      .post("/orders")
      .send({
        customerId: "c1",
        products: [{ productId: "p1", quantity: 101 }],
      });
    expect(res.statusCode).toEqual(409);
  });
});
