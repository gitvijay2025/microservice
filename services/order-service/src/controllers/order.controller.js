const orderService = require('../services/order.service');
const { logger } = require('../utils');

exports.create = async (req, res, next) => {
  try {
    const order = await orderService.create(req.user.id, req.body);
    logger.info('Order created', { orderId: order._id, userId: req.user.id });
    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.findAll = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const result = await orderService.findAll(req.query, userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.findById = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    const order = await orderService.findById(req.params.id, userId);
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const order = await orderService.cancel(req.params.id, req.user.id);
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};
