import { db } from '../db/index.js';
import { Product } from '../helpers/types.js';

export const getAllProducts = async (): Promise<Product[]> => {
    await db.read();
    return db.data?.products || [];
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
    await db.read();
    return db.data?.products.find(p => p.id === id);
};
