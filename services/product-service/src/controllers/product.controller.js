const productService = require('../services/product.service');
const { logger } = require('../utils');

exports.create = async (req, res, next) => {
  try {
    const product = await productService.create(req.body);
    logger.info('Product created', { productId: product._id, sku: product.sku });
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.findAll = async (req, res, next) => {
  try {
    const result = await productService.findAll(req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.findById = async (req, res, next) => {
  try {
    const product = await productService.findById(req.params.id);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const product = await productService.update(req.params.id, req.body);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await productService.delete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
};
