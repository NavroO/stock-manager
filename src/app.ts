import cors from "cors";
import express, { Express } from "express";
import { initializeDatabaseConnection } from "./db/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import orderRoutes from "./routes/orders.js";

const app: Express = express();

app.use(cors());
app.use(express.json());

app.use("/orders", orderRoutes);

app.use(errorHandler);

export { app, initializeDatabaseConnection };
