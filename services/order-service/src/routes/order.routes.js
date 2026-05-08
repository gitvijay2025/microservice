const express = require('express');
const Joi = require('joi');
const { validate, authMiddleware } = require('../utils');
const { authorize } = require('../utils/authMiddleware');
const ctrl = require('../controllers/order.controller');

const router = express.Router();

const createSchema = {
  body: Joi.object({
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    ).min(1).required(),
    shippingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().default('IN'),
    }).required(),
    notes: Joi.string().allow('').default(''),
  }),
};

const statusSchema = {
  body: Joi.object({
    status: Joi.string().valid('confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required(),
  }),
};

// All order routes require authentication
router.use(authMiddleware);

router.post('/orders', validate(createSchema), ctrl.create);
router.get('/orders', ctrl.findAll);
router.get('/orders/:id', ctrl.findById);
router.patch('/orders/:id/status', authorize('admin'), validate(statusSchema), ctrl.updateStatus);
router.post('/orders/:id/cancel', ctrl.cancel);

module.exports = router;
