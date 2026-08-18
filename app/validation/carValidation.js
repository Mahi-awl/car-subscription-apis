import Joi from 'joi';

//----------Create-------------
export const createCarValidationSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Car name is required",
  }),
  brand: Joi.string().required().messages({
    "string.empty": "Car brand is required",
  }),
  model: Joi.string().required().messages({
    "string.empty": "Car model is required",
  }),
  monthlySubscriptionPrice: Joi.number().positive().required().messages({
    "number.base": "Monthly subscription price must be a number",
    "number.positive": "Price cannot be negative or zero",
    "any.required": "Monthly subscription price is required",
  }),
  registrationNumber: Joi.string().required().messages({
    "string.empty": "Registration number is required",
  }),

});

//------------------Update--------------------
export const updateCarValidationSchema = Joi.object({
  name: Joi.string(),
  brand: Joi.string(),
  model: Joi.string(),
  monthlySubscriptionPrice: Joi.number().positive(),
  registrationNumber: Joi.string(),
  isAvailable: Joi.boolean() 
});