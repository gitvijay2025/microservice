const Joi = require('joi');
const { loadConfig } = require('./utils');

const schema = Joi.object({
  USER_SERVICE_PORT: Joi.number().default(3001),
  MONGO_URI: Joi.string().default('mongodb://localhost:27017'),
  MONGO_DB_USER: Joi.string().default('micro_users'),
}).unknown(true);

const config = loadConfig(schema);

module.exports = {
  port: config.USER_SERVICE_PORT,
  mongoUri: `${config.MONGO_URI}/${config.MONGO_DB_USER}`,
};
