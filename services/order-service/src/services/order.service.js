const Order = require('../models/order.model');
const { NotFoundError, HttpClient, EventBus, logger } = require('../utils');
const config = require('../config');

// HTTP client to talk to Product Service
const productClient = new HttpClient({
  name: 'product-service',
  baseURL: config.productServiceUrl,
  timeout: 5000,
});

class OrderService {
  async create(userId, data) {
    // Validate products exist and calculate total
    let totalAmount = 0;
    const items = [];

    for (const item of data.items) {
      try {
        const res = await productClient.get(`/api/products/${item.productId}`);
        const product = res.data;
        items.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
        });
        totalAmount += product.price * item.quantity;
      } catch (err) {
        logger.warn(`Product ${item.productId} lookup failed`, { error: err.message });
        throw new NotFoundError('Product', item.productId);
      }
    }

    const order = await Order.create({
      userId,
      items,
      totalAmount,
      shippingAddress: data.shippingAddress,
      notes: data.notes,
    });

    await EventBus.emit('order.created', { orderId: order._id, userId, totalAmount });
    return order;
  }

  async findAll(query = {}, userId = null) {
    const { page = 1, limit = 20, status } = query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .skip((page - 1) * limit).limit(Number(limit)).sort('-createdAt');
    const total = await Order.countDocuments(filter);
    return { orders, total, page: Number(page), totalPages: Math.ceil(total / limit) };
  }

  async findById(id, userId = null) {
    const filter = { _id: id };
    if (userId) filter.userId = userId;
    const order = await Order.findOne(filter);
    if (!order) throw new NotFoundError('Order', id);
    return order;
  }

  async updateStatus(id, status) {
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!order) throw new NotFoundError('Order', id);
    await EventBus.emit('order.statusUpdated', { orderId: id, status });
    return order;
  }

  async cancel(id, userId) {
    const order = await Order.findOne({ _id: id, userId });
    if (!order) throw new NotFoundError('Order', id);
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new Error('Order cannot be cancelled in current status');
    }
    order.status = 'cancelled';
    await order.save();
    await EventBus.emit('order.cancelled', { orderId: id, userId });
    return order;
  }
}

module.exports = new OrderService();
