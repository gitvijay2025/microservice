const User = require('../models/user.model');
const { NotFoundError, ConflictError, UnauthorizedError } = require('../utils');
const { generateToken } = require('../utils/authMiddleware');

class UserService {
  async register({ name, email, password, role }) {
    const existing = await User.findOne({ email });
    if (existing) throw new ConflictError('Email already registered');
    const user = await User.create({ name, email, password, role });
    const token = generateToken({ id: user._id, email: user.email, role: user.role });
    return { user, token };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new UnauthorizedError('Invalid email or password');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new UnauthorizedError('Invalid email or password');
    const token = generateToken({ id: user._id, email: user.email, role: user.role });
    return { user: user.toJSON(), token };
  }

  async findAll(query = {}) {
    const { page = 1, limit = 20, search } = query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    const users = await User.find(filter).skip((page - 1) * limit).limit(Number(limit)).sort('-createdAt');
    const total = await User.countDocuments(filter);
    return { users, total, page: Number(page), totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return user;
  }

  async update(id, data) {
    const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!user) throw new NotFoundError('User', id);
    return user;
  }

  async delete(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new NotFoundError('User', id);
    return user;
  }

  async getProfile(userId) {
    return this.findById(userId);
  }
}

module.exports = new UserService();
