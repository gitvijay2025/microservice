/**
 * Circuit Breaker
 * Prevents cascading failures in inter-service communication.
 *
 * States:
 *   CLOSED  → requests flow normally; failures are counted
 *   OPEN    → requests are immediately rejected (fail-fast)
 *   HALF_OPEN → a single probe request is allowed to test recovery
 *
 * Usage:
 *   const breaker = new CircuitBreaker({ name: 'user-service' });
 *   const result = await breaker.fire(() => httpClient.get('/users/1'));
 */

const logger = require('./logger');

const STATE = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
};

class CircuitBreaker {
  /**
   * @param {Object} options
   * @param {string}  options.name             - Identifier for logging
   * @param {number}  [options.failureThreshold=5]  - Failures before opening
   * @param {number}  [options.resetTimeout=30000]  - ms before trying half-open
   * @param {number}  [options.successThreshold=2]  - Successes in half-open to close
   * @param {number}  [options.timeout=10000]       - Per-request timeout (ms)
   */
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 10000;

    this.state = STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = Date.now();
  }

  /**
   * Execute a function through the circuit breaker
   * @param {Function} fn - async function to execute
   * @returns {Promise<*>}
   */
  async fire(fn) {
    if (this.state === STATE.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker [${this.name}] is OPEN — request rejected`);
      }
      // Transition to half-open
      this.state = STATE.HALF_OPEN;
      logger.info(`Circuit breaker [${this.name}] → HALF_OPEN`);
    }

    try {
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Circuit breaker [${this.name}] timeout`)), this.timeout)
        ),
      ]);

      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  _onSuccess() {
    if (this.state === STATE.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = STATE.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        logger.info(`Circuit breaker [${this.name}] → CLOSED (recovered)`);
      }
    } else {
      this.failureCount = 0; // Reset on success in CLOSED state
    }
  }

  _onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === STATE.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.state = STATE.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeout;
      this.successCount = 0;
      logger.warn(`Circuit breaker [${this.name}] → OPEN (failures: ${this.failureCount})`);
    }
  }

  /** Current state info for health checks */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

module.exports = { CircuitBreaker, STATE };
