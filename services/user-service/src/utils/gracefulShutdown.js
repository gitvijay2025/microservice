/**
 * Graceful Shutdown Handler
 * Ensures in-flight requests complete and resources are cleaned up before exit.
 */
const logger = require('./logger');
const { disconnectMongo } = require('./mongo');

const gracefulShutdown = (server, options = {}) => {
  const { timeout = 10000, onShutdown } = options;
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        if (onShutdown) await onShutdown();
        await disconnectMongo();
      } catch (err) {
        logger.error('Error during shutdown cleanup', { error: err.message });
      }
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error(`Forced shutdown after ${timeout}ms timeout`);
      process.exit(1);
    }, timeout).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason: String(reason) });
    shutdown('unhandledRejection');
  });
};

module.exports = { gracefulShutdown };
