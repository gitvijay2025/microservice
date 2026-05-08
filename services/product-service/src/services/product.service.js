const Product = require('../models/product.model');
const { NotFoundError, ConflictError, EventBus } = require('../utils');

class ProductService {
  async create(data) {
    const existing = await Product.findOne({ sku: data.sku.toUpperCase() });
    if (existing) throw new ConflictError(`Product with SKU '${data.sku}' already exists`);
    const product = await Product.create(data);
    await EventBus.emit('product.created', { productId: product._id, sku: product.sku });
    return product;
  }

  async findAll(query = {}) {
    const { page = 1, limit = 20, category, search, minPrice, maxPrice, sortBy = '-createdAt' } = query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) filter.$text = { $search: search };

    const products = await Product.find(filter)
      .skip((page - 1) * limit).limit(Number(limit)).sort(sortBy);
    const total = await Product.countDocuments(filter);
    return { products, total, page: Number(page), totalPages: Math.ceil(total / limit) };
  }

  async findById(id) {
    const product = await Product.findById(id);
    if (!product) throw new NotFoundError('Product', id);
    return product;
  }

  async update(id, data) {
    const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!product) throw new NotFoundError('Product', id);
    await EventBus.emit('product.updated', { productId: product._id });
    return product;
  }

  async delete(id) {
    const product = await Product.findByIdAndDelete(id);
    if (!product) throw new NotFoundError('Product', id);
    await EventBus.emit('product.deleted', { productId: id });
    return product;
  }

  async updateStock(id, quantity) {
    const product = await Product.findById(id);
    if (!product) throw new NotFoundError('Product', id);
    product.stock += quantity;
    if (product.stock < 0) product.stock = 0;
    await product.save();
    return product;
  }
}

module.exports = new ProductService();
