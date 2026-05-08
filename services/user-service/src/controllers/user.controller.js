const userService = require('../services/user.service');
const { logger } = require('../utils');

exports.register = async (req, res, next) => {
  try {
    const result = await userService.register(req.body);
    logger.info('User registered', { userId: result.user._id });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const result = await userService.login(req.body);
    logger.info('User logged in', { userId: result.user._id });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.findAll = async (req, res, next) => {
  try {
    const result = await userService.findAll(req.query);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.findById = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    await userService.delete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
};
