/**
 * ../utils — Central export barrel
 * Import everything from one place: const { logger, AppError, ... } = require('../utils');
 */

const logger = require('./logger');
const { AppError, NotFoundError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError } = require('./errors');
const { errorHandler, notFoundHandler } = require('./errorHandler');
const { validate } = require('./validator');
const { CircuitBreaker } = require('./circuitBreaker');
const { RateLimiter, rateLimiterMiddleware } = require('./rateLimiter');
const { EventBus } = require('./eventBus');
const { authMiddleware } = require('./authMiddleware');
const { HttpClient } = require('./httpClient');
const { healthCheck, createHealthRouter } = require('./healthCheck');
const { loadConfig } = require('./config');
const { requestContext, requestContextMiddleware, getTraceId } = require('./requestContext');
const { connectMongo, disconnectMongo } = require('./mongo');
const { gracefulShutdown } = require('./gracefulShutdown');

module.exports = {
  // Logging
  logger,

  // Errors
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  errorHandler,
  notFoundHandler,

  // Validation
  validate,

  // Resilience
  CircuitBreaker,
  RateLimiter,
  rateLimiterMiddleware,

  // Messaging
  EventBus,

  // Auth
  authMiddleware,

  // HTTP
  HttpClient,

  // Health
  healthCheck,
  createHealthRouter,

  // Config
  loadConfig,

  // Context
  requestContext,
  requestContextMiddleware,
  getTraceId,

  // Database
  connectMongo,
  disconnectMongo,

  // Lifecycle
  gracefulShutdown,
};
