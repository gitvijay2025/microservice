/**
 * API Gateway — Proxy routes to downstream services
 * 
 * Routing strategy: the gateway forwards the FULL original path to each service.
 * e.g. GET /api/products/123 → product-service receives GET /api/products/123
 * NEST, NEXT
 */
const { createProxyMiddleware } = require('http-proxy-middleware');
const { logger } = require('../utils');
const config = require('../config');

/**
 * Creates a proxy middleware for a downstream service
 */
const createServiceProxy = (name, target, paths) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: 15000,
    proxyTimeout: 15000,
    // Match only specific path prefixes
    pathFilter: paths,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.traceId) proxyReq.setHeader('x-trace-id', req.traceId);
        if (req.headers.authorization) proxyReq.setHeader('authorization', req.headers.authorization);
        logger.debug(`→ Proxy ${req.method} ${req.originalUrl} → ${name} (${target})`);
      },
      error: (err, req, res) => {
        logger.error(`Proxy error [${name}]`, { error: err.message, url: req.originalUrl });
        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            error: { code: 'SERVICE_UNAVAILABLE', message: `${name} is currently unavailable` },
          });
        }
      },
    },
  });
};

// Export proxy middlewares — each matches full paths and forwards as-is
const proxies = [
  createServiceProxy('user-service', config.services.user, ['/api/auth', '/api/users']),
  createServiceProxy('product-service', config.services.product, ['/api/products']),
  createServiceProxy('order-service', config.services.order, ['/api/orders']),
];

module.exports = proxies;
