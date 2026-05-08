/**
 * Resilient HTTP Client (Axios + Circuit Breaker + Retry)
 */
const axios = require('axios');
const { CircuitBreaker } = require('./circuitBreaker');
const logger = require('./logger');
const { getTraceId } = require('./requestContext');

class HttpClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 10000;
    this.retries = options.retries || 2;
    this.retryDelay = options.retryDelay || 500;

    this.breaker = new CircuitBreaker({
      name: options.name || this.baseURL,
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 30000,
    });

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
    });
  }

  async _request(config, attempt = 1) {
    const traceId = getTraceId();
    if (traceId) config.headers = { ...config.headers, 'x-trace-id': traceId };

    try {
      const response = await this.breaker.fire(() => this.client(config));
      return response.data;
    } catch (error) {
      if (attempt < this.retries && this._isRetryable(error)) {
        logger.warn(`HTTP retry ${attempt}/${this.retries} for ${config.method} ${config.url}`);
        await new Promise((r) => setTimeout(r, this.retryDelay * attempt));
        return this._request(config, attempt + 1);
      }
      throw error;
    }
  }

  _isRetryable(error) {
    if (error.response) {
      return error.response.status >= 500;
    }
    return error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED';
  }

  get(url, config = {}) { return this._request({ ...config, method: 'GET', url }); }
  post(url, data, config = {}) { return this._request({ ...config, method: 'POST', url, data }); }
  put(url, data, config = {}) { return this._request({ ...config, method: 'PUT', url, data }); }
  patch(url, data, config = {}) { return this._request({ ...config, method: 'PATCH', url, data }); }
  delete(url, config = {}) { return this._request({ ...config, method: 'DELETE', url }); }
}

module.exports = { HttpClient };
