/**
 * Request Context — Trace ID propagation via AsyncLocalStorage
 * Propagates traceId across async boundaries without polluting function signatures.
 */
const { AsyncLocalStorage } = require('async_hooks');
const { v4: uuidv4 } = require('uuid');

const requestContext = new AsyncLocalStorage();

const requestContextMiddleware = (req, _res, next) => {
  const traceId = req.headers['x-trace-id'] || uuidv4();
  req.traceId = traceId;
  requestContext.run({ traceId, startTime: Date.now() }, () => next());
};

const getTraceId = () => {
  const store = requestContext.getStore();
  return store ? store.traceId : null;
};

module.exports = { requestContext, requestContextMiddleware, getTraceId };
