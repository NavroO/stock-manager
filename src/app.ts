import cors from "cors";
import express, { Express } from "express";
import { initializeDatabaseConnection } from "./db/index.js";

const app: Express = express();

app.use(cors());
app.use(express.json());

export { app, initializeDatabaseConnection };
