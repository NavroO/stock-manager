import Joi from 'joi';

export const createProductSchema = Joi.object({
    name: Joi.string().max(50).required(),
    description: Joi.string().max(50).required(),
    category: Joi.string().max(50).required(),
    price: Joi.number().positive().required(),
    stock: Joi.number().integer().min(0).required(),
});

export const restockProductSchema = Joi.object({
    quantity: Joi.number().integer().positive().required(),
});

export const sellProductSchema = Joi.object({
    quantity: Joi.number().integer().positive().required(),
});
