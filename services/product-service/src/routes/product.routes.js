const express = require('express');
const Joi = require('joi');
const { validate, authMiddleware } = require('../utils');
const { authorize } = require('../utils/authMiddleware');
const ctrl = require('../controllers/product.controller');

const router = express.Router();

const createSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(2000).allow(''),
    price: Joi.number().positive().required(),
    category: Joi.string().required(),
    stock: Joi.number().integer().min(0).default(0),
    sku: Joi.string().min(3).max(50).required(),
    tags: Joi.array().items(Joi.string()).default([]),
  }),
};

const updateSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(200),
    description: Joi.string().max(2000),
    price: Joi.number().positive(),
    category: Joi.string(),
    stock: Joi.number().integer().min(0),
    tags: Joi.array().items(Joi.string()),
    isActive: Joi.boolean(),
  }).min(1),
};

// Public
router.get('/products', ctrl.findAll);
router.get('/products/:id', ctrl.findById);

// Protected (admin only)
router.post('/products', authMiddleware, authorize('admin'), validate(createSchema), ctrl.create);
router.put('/products/:id', authMiddleware, authorize('admin'), validate(updateSchema), ctrl.update);
router.delete('/products/:id', authMiddleware, authorize('admin'), ctrl.delete);

module.exports = router;
