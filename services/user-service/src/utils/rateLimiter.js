/**
 * In-memory Token Bucket Rate Limiter
 * - Per-IP rate limiting by default
 * - Configurable window and max requests
 * - Returns standard rate-limit headers (X-RateLimit-*)
 * - For production at scale, swap to Redis-backed store
 */

const { AppError } = require('./errors');

class RateLimiter {
  /**
   * @param {Object} options
   * @param {number} [options.windowMs=60000]     - Time window in ms
   * @param {number} [options.maxRequests=100]     - Max requests per window
   * @param {Function} [options.keyGenerator]      - Custom key function (req) => string
   * @param {string} [options.message]             - Custom error message
   */
  constructor(options = {}) {
    this.windowMs = options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000;
    this.maxRequests = options.maxRequests || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100;
    this.keyGenerator = options.keyGenerator || ((req) => req.ip || req.connection.remoteAddress);
    this.message = options.message || 'Too many requests, please try again later';
    this.store = new Map();

    // Periodic cleanup of expired entries
    this._cleanupInterval = setInterval(() => this._cleanup(), this.windowMs * 2);
    this._cleanupInterval.unref(); // Don't prevent process exit
  }

  /**
   * Express middleware
   */
  middleware() {
    return (req, res, next) => {
      const key = this.keyGenerator(req);
      const now = Date.now();
      let record = this.store.get(key);

      if (!record || now - record.windowStart >= this.windowMs) {
        record = { windowStart: now, count: 0 };
        this.store.set(key, record);
      }

      record.count++;

      // Set rate-limit headers
      const remaining = Math.max(0, this.maxRequests - record.count);
      const resetTime = Math.ceil((record.windowStart + this.windowMs) / 1000);

      res.set('X-RateLimit-Limit', String(this.maxRequests));
      res.set('X-RateLimit-Remaining', String(remaining));
      res.set('X-RateLimit-Reset', String(resetTime));

      if (record.count > this.maxRequests) {
        res.set('Retry-After', String(Math.ceil(this.windowMs / 1000)));
        return next(new AppError(this.message, 429, 'RATE_LIMIT_EXCEEDED'));
      }

      next();
    };
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store) {
      if (now - record.windowStart >= this.windowMs) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this._cleanupInterval);
    this.store.clear();
  }
}

/**
 * Quick middleware factory
 * Usage: app.use(rateLimiterMiddleware({ maxRequests: 50 }));
 */
const rateLimiterMiddleware = (options = {}) => {
  const limiter = new RateLimiter(options);
  return limiter.middleware();
};

module.exports = { RateLimiter, rateLimiterMiddleware };
