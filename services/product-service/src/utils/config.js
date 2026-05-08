/**
 * Environment Config Loader with Joi Validation
 */
const Joi = require('joi');
const logger = require('./logger');

const loadConfig = (schema, envOverrides = {}) => {
  const env = { ...process.env, ...envOverrides };

  const baseSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    JWT_SECRET: Joi.string().min(10).default('your-super-secret-key-change-in-production'),
    JWT_EXPIRES_IN: Joi.string().default('24h'),
  }).unknown(true);

  const mergedSchema = schema ? baseSchema.concat(schema) : baseSchema;
  const { error, value } = mergedSchema.validate(env, { abortEarly: false, stripUnknown: false });

  if (error) {
    const details = error.details.map((d) => `  - ${d.message}`).join('\n');
    logger.error(`Config validation failed:\n${details}`);
    throw new Error(`Config validation failed:\n${details}`);
  }

  return value;
};

module.exports = { loadConfig };
