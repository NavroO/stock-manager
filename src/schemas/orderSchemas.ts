import Joi from 'joi';

export const createOrderSchema = Joi.object({
    customerId: Joi.string().required(),
    products: Joi.array().items(
        Joi.object({
            productId: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required()
        })
    ).min(1).required()
});
