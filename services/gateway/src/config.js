const Joi = require('joi');
const { loadConfig } = require('./utils');

const schema = Joi.object({
  GATEWAY_PORT: Joi.number().default(3000),
  USER_SERVICE_URL: Joi.string().uri().default('http://localhost:3001'),
  PRODUCT_SERVICE_URL: Joi.string().uri().default('http://localhost:3002'),
  ORDER_SERVICE_URL: Joi.string().uri().default('http://localhost:3003'),
}).unknown(true);

const config = loadConfig(schema);

module.exports = {
  port: config.GATEWAY_PORT,
  services: {
    user: config.USER_SERVICE_URL,
    product: config.PRODUCT_SERVICE_URL,
    order: config.ORDER_SERVICE_URL,
  },
};
