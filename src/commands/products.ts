import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { CreateProductInput, Product } from "../helpers/types.js";
import { ensureDbInitialized, saveDb } from "../helpers/utils.js";

const findProductById = (id: string): Product => {
  const product = db.data!.products.find((p) => p.id === id);
  if (!product) throw new Error("Product not found");
  return product;
};

export const createProduct = async (
  input: CreateProductInput
): Promise<Product> => {
  await ensureDbInitialized();

  const newProduct: Product = { id: uuidv4(), ...input };
  db.data!.products.push(newProduct);

  await saveDb();
  return newProduct;
};

export const restockProduct = async (
  id: string,
  quantity: number
): Promise<Product> => {
  await ensureDbInitialized();
  const product = findProductById(id);

  product.stock += quantity;
  await saveDb();

  return product;
};

export const sellProduct = async (
  id: string,
  quantity: number
): Promise<Product> => {
  await ensureDbInitialized();
  const product = findProductById(id);

  if (product.stock < quantity) throw new Error("Insufficient stock");
  product.stock -= quantity;

  await saveDb();
  return product;
};
