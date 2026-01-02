import express from "express";
import { createOrder } from "../commands/orders.js";
import { createOrderSchema } from "../schemas/orderSchemas.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const order = await createOrder(value);
    res.status(201).json(order);
  } catch (error: any) {
    if (error.message.includes("not found")) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error.message.includes("Insufficient stock")) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
