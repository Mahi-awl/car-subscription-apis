import Joi from 'joi';

export const createSubscriptionValidationSchema = Joi.object({
  carId: Joi.string().required().messages({
    'any.required': 'Car ID is required',
  }),
  durationMonths: Joi.number().min(1).required().messages({
    'any.required': 'Duration in months is required',
    'number.min': 'Duration must be at least 1 month',
  }),
});

export const updateStatusValidationSchema = Joi.object({
  status: Joi.string().valid('Active', 'Rejected', 'Completed').required().messages({
    'any.required': 'Status is required',
    'any.only': 'Invalid status update',
  }),
});