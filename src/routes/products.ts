import express from "express";
import {
  createProduct,
  restockProduct,
  sellProduct,
} from "../commands/products.js";
import { getAllProducts } from "../queries/products.js";
import {
  createProductSchema,
  restockProductSchema,
  sellProductSchema,
} from "../schemas/productSchemas.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { error, value } = createProductSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const product = await createProduct(value);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/restock", async (req, res, next) => {
  try {
    const { error, value } = restockProductSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const product = await restockProduct(req.params.id, value.quantity);
    res.json(product);
  } catch (error: any) {
    if (error.message === "Product not found") {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

router.post("/:id/sell", async (req, res, next) => {
  try {
    const { error, value } = sellProductSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const product = await sellProduct(req.params.id, value.quantity);
    res.json(product);
  } catch (error: any) {
    if (error.message === "Product not found") {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message === "Insufficient stock") {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
