import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";
import { Data } from "../helpers/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "../../db.json");

const defaultData: Data = {
  products: [],
  orders: [],
  customers: [
    { id: "c1", name: "John Doe", location: "US" },
    { id: "c2", name: "Jane Smith", location: "Europe" },
    { id: "c3", name: "Akira Tanaka", location: "Asia" },
  ],
};

const adapter = new JSONFile<Data>(file);
export const db = new Low<Data>(adapter, defaultData);

export const initializeDatabaseConnection = async (): Promise<void> => {
  await db.read();

  if (!db.data) {
    db.data = defaultData;
    await db.write();
  }
};
