require('dotenv').config();
process.env.SERVICE_NAME = 'order-service';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const {
  logger, connectMongo, gracefulShutdown,
  requestContextMiddleware, errorHandler, notFoundHandler,
  createHealthRouter,
} = require('./utils');
const config = require('./config');
const orderRoutes = require('./routes/order.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('short', { stream: logger.stream }));
app.use(requestContextMiddleware);

app.use(createHealthRouter());
app.use('/api', orderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await connectMongo(config.mongoUri);
  const server = app.listen(config.port, () => {
    logger.info(`🛒 Order Service running on port ${config.port}`);
  });
  gracefulShutdown(server);
};

start().catch((err) => {
  logger.error('Failed to start Order Service', { error: err.message });
  process.exit(1);
});

module.exports = app;
