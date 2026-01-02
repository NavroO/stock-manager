import request from "supertest";
import { app, initializeDatabaseConnection } from "../app.js";
import { db } from "../db/index.js";

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
