/**
 * Structured JSON Logger (Winston)
 * - Outputs JSON in production for log aggregation (ELK, Datadog, etc.)
 * - Outputs colorized human-readable logs in development
 * - Automatically attaches traceId from request context
 */

const { createLogger, format, transports } = require('winston');

const isProduction = process.env.NODE_ENV === 'production';

// Custom format that injects traceId from AsyncLocalStorage context
const traceIdFormat = format((info) => {
  try {
    const { getTraceId } = require('./requestContext');
    const traceId = getTraceId();
    if (traceId) {
      info.traceId = traceId;
    }
  } catch {
    // requestContext not yet initialized — skip
  }
  return info;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'unknown-service',
  },
  format: format.combine(
    traceIdFormat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
    isProduction
      ? format.json()
      : format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, service, traceId, ...meta }) => {
            const tid = traceId ? ` [${traceId.slice(0, 8)}]` : '';
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level} [${service}]${tid}: ${message}${metaStr}`;
          })
        )
  ),
  transports: [new transports.Console()],
  // Don't exit on uncaught exceptions — let gracefulShutdown handle it
  exitOnError: false,
});

// Stream for Morgan HTTP request logging
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;
