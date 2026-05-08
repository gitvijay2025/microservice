/**
 * User Service — Entry Point
 */
require('dotenv').config();
process.env.SERVICE_NAME = 'user-service';

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
const userRoutes = require('./routes/user.routes');

const app = express();

// ─── Middleware ──────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('short', { stream: logger.stream }));
app.use(requestContextMiddleware);

// ─── Routes ─────────────────────────────────────────────
app.use(createHealthRouter());
app.use('/api', userRoutes);

// ─── Error Handling ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────
const start = async () => {
  await connectMongo(config.mongoUri);
  const server = app.listen(config.port, () => {
    logger.info(`🔐 User Service running on port ${config.port}`);
  });
  gracefulShutdown(server);
};

start().catch((err) => {
  logger.error('Failed to start User Service', { error: err.message });
  process.exit(1);
});

module.exports = app;
