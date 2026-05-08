/**
 * Health Check Utility
 */
const express = require('express');
const mongoose = require('mongoose');

const healthCheck = () => {
  const mongoState = mongoose.connection.readyState;
  const mongoStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  return {
    status: mongoState === 1 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    service: process.env.SERVICE_NAME || 'unknown',
    dependencies: {
      mongodb: mongoStates[mongoState] || 'unknown',
    },
  };
};

const createHealthRouter = () => {
  const router = express.Router();
  router.get('/health', (_req, res) => {
    const health = healthCheck();
    const status = health.status === 'healthy' ? 200 : 503;
    res.status(status).json(health);
  });

  router.get('/ready', (_req, res) => {
    const mongoReady = mongoose.connection.readyState === 1;
    if (mongoReady) {
      res.json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready', reason: 'MongoDB not connected' });
    }
  });

  return router;
};

module.exports = { healthCheck, createHealthRouter };
