/**
 * MongoDB Connection Helper
 */
const mongoose = require('mongoose');
const logger = require('./logger');

const connectMongo = async (uri, options = {}) => {
  const defaultOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    await mongoose.connect(uri, { ...defaultOptions, ...options });
    logger.info(`MongoDB connected: ${uri.replace(/\/\/.*@/, '//***@')}`);

    mongoose.connection.on('error', (err) => logger.error('MongoDB error', { error: err.message }));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message });
    throw error;
  }
};

const disconnectMongo = async () => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
};

module.exports = { connectMongo, disconnectMongo };
