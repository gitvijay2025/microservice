/**
 * JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('./errors');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

const authMiddleware = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError());
    next();
  };
};

const generateToken = (payload, expiresIn) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '24h',
  });
};

module.exports = { authMiddleware, authorize, generateToken };
