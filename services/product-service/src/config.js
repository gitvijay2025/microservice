const Joi = require('joi');
const { loadConfig } = require('./utils');

const schema = Joi.object({
  PRODUCT_SERVICE_PORT: Joi.number().default(3002),
  MONGO_URI: Joi.string().default('mongodb://localhost:27017'),
  MONGO_DB_PRODUCT: Joi.string().default('micro_products'),
}).unknown(true);

const config = loadConfig(schema);

module.exports = {
  port: config.PRODUCT_SERVICE_PORT,
  mongoUri: `${config.MONGO_URI}/${config.MONGO_DB_PRODUCT}`,
};
