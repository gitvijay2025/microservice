/**
 * Joi Validation Middleware Factory
 * 
 * Usage in routes:
 *   const { validate } = require('../utils');
 *   const Joi = require('joi');
 * 
 *   const schema = { body: Joi.object({ name: Joi.string().required() }) };
 *   router.post('/items', validate(schema), controller.create);
 */

const { ValidationError } = require('./errors');

/**
 * @param {Object} schema - { body?, query?, params? } each a Joi schema
 * @returns Express middleware
 */
const validate = (schema) => {
  return (req, _res, next) => {
    const errors = [];

    for (const key of ['body', 'query', 'params']) {
      if (!schema[key]) continue;

      const { error, value } = schema[key].validate(req[key], {
        abortEarly: false,    // Collect ALL errors, not just the first
        stripUnknown: true,   // Remove fields not in schema
        allowUnknown: false,
      });

      if (error) {
        error.details.forEach((detail) => {
          errors.push({
            field: detail.path.join('.'),
            message: detail.message.replace(/"/g, ''),
            location: key,
          });
        });
      } else {
        // Replace request data with sanitized values
        req[key] = value;
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError('Request validation failed', errors));
    }

    next();
  };
};

module.exports = { validate };
