/**
 * API Gateway — Entry Point
 */
require('dotenv').config();
process.env.SERVICE_NAME = 'api-gateway';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const {
  logger,
  requestContextMiddleware,
  rateLimiterMiddleware,
  errorHandler,
  notFoundHandler,
} = require('./utils');
const config = require('./config');
const proxies = require('./routes/proxy');

const app = express();

// ─── Global Middleware ───────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('short', { stream: logger.stream }));
app.use(requestContextMiddleware);
app.use(rateLimiterMiddleware({ maxRequests: 200, windowMs: 60000 }));

// ─── Gateway Info Endpoint ───────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    routes: ['/api/auth', '/api/users', '/api/products', '/api/orders'],
  });
});

// ─── Proxy Routes ────────────────────────────────────────
proxies.forEach((proxy) => app.use(proxy));

// ─── Error Handling ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────
const server = app.listen(config.port, () => {
  logger.info(`🚀 API Gateway running on port ${config.port}`);
  logger.info(`   → User Service:    ${config.services.user}`);
  logger.info(`   → Product Service: ${config.services.product}`);
  logger.info(`   → Order Service:   ${config.services.order}`);
});

const { gracefulShutdown } = require('./utils');
gracefulShutdown(server);

module.exports = app;
