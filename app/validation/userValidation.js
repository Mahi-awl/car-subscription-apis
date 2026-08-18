import Joi from 'joi';

export const registerValidationSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    contactNumber: Joi.string().length(10).pattern(/^[0-9]+$/).required().messages({
        'string.pattern.base': 'Contact number must contain only digits.',
        'string.length': 'Contact number must be exactly 10 digits.'
    }),
    address: Joi.string().required(),
    password: Joi.string().min(6).required()
});


export const loginValidationSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});



export const updateProfileValidationSchema = Joi.object({
    name: Joi.string().min(3).max(50).optional(),
    contactNumber: Joi.string().length(10).pattern(/^[0-9]+$/).optional().messages({
        'string.pattern.base': 'Contact number must contain only digits.',
        'string.length': 'Contact number must be exactly 10 digits.'
    }),
    address: Joi.string().optional()
});