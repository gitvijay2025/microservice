/**
 * Lightweight In-Process Event Bus
 * - Pub/Sub pattern for decoupled inter-module communication
 * - Supports async listeners with error isolation
 * - Can be extended to use Redis Pub/Sub or RabbitMQ for cross-service messaging
 *
 * Usage:
 *   eventBus.on('order.created', async (data) => { ... });
 *   await eventBus.emit('order.created', { orderId: '123' });
 */

const logger = require('./logger');

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name (e.g., 'order.created')
   * @param {Function} handler - Async handler function
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);

    logger.debug(`EventBus: subscribed to '${event}'`);

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  /**
   * Emit an event to all subscribers
   * Each handler runs in isolation — one failing handler won't block others
   * @param {string} event - Event name
   * @param {*} data - Payload
   */
  async emit(event, data) {
    const handlers = this.listeners.get(event) || [];

    if (handlers.length === 0) {
      logger.debug(`EventBus: no listeners for '${event}'`);
      return;
    }

    logger.debug(`EventBus: emitting '${event}' to ${handlers.length} listener(s)`);

    const results = await Promise.allSettled(
      handlers.map((handler) => handler(data))
    );

    // Log any failed handlers (but don't throw — fire-and-forget)
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`EventBus: handler ${index} for '${event}' failed`, {
          error: result.reason?.message || result.reason,
        });
      }
    });
  }

  /**
   * Subscribe to an event once
   */
  once(event, handler) {
    const unsubscribe = this.on(event, async (data) => {
      unsubscribe();
      await handler(data);
    });
    return unsubscribe;
  }

  /**
   * Remove all listeners (useful for testing)
   */
  removeAll() {
    this.listeners.clear();
  }
}

// Singleton instance — shared within a single service process
module.exports = { EventBus: new EventBus() };
