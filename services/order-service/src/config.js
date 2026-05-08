const Joi = require('joi');
const { loadConfig } = require('./utils');

const schema = Joi.object({
  ORDER_SERVICE_PORT: Joi.number().default(3003),
  MONGO_URI: Joi.string().default('mongodb://localhost:27017'),
  MONGO_DB_ORDER: Joi.string().default('micro_orders'),
  PRODUCT_SERVICE_URL: Joi.string().uri().default('http://localhost:3002'),
}).unknown(true);

const config = loadConfig(schema);

module.exports = {
  port: config.ORDER_SERVICE_PORT,
  mongoUri: `${config.MONGO_URI}/${config.MONGO_DB_ORDER}`,
  productServiceUrl: config.PRODUCT_SERVICE_URL,
};
