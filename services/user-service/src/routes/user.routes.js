const express = require('express');
const Joi = require('joi');
const { validate, authMiddleware } = require('../utils');
const { authorize } = require('../utils/authMiddleware');
const ctrl = require('../controllers/user.controller');

const router = express.Router();

// ─── Validation Schemas ──────────────────────────────────
const registerSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid('user', 'admin').default('user'),
  }),
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const updateSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    role: Joi.string().valid('user', 'admin'),
    isActive: Joi.boolean(),
  }).min(1),
};

// ─── Auth Routes (Public) ────────────────────────────────
router.post('/auth/register', validate(registerSchema), ctrl.register);
router.post('/auth/login', validate(loginSchema), ctrl.login);

// ─── User Routes (Protected) ────────────────────────────
router.get('/users/me', authMiddleware, ctrl.getProfile);
router.get('/users', authMiddleware, authorize('admin'), ctrl.findAll);
router.get('/users/:id', authMiddleware, ctrl.findById);
router.put('/users/:id', authMiddleware, validate(updateSchema), ctrl.update);
router.delete('/users/:id', authMiddleware, authorize('admin'), ctrl.delete);

module.exports = router;
