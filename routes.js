const Product = require('./products');
const express = require('express');
const { NotFoundError, ValidationError } = require('./errors'); // Custom errors (see below)
const validateProduct = require('./validateProduct'); // Your validation middleware
const router = express.Router();

// Helper to wrap async route handlers
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Get all products
router.get('/api/products', asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10, search } = req.query;
  const filter = {};

  if (category) {
    filter.category = category;
  }
  if (search) {
    filter.name = { $regex: search, $options: 'i' }; 
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const products = await Product.find(filter).skip(skip).limit(parseInt(limit));
  res.json(products);
}));

// Get a specific product by id
router.get('/api/products/:id', asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  res.json(product);
}));

// Create a new product
router.post('/api/products', validateProduct, asyncHandler(async (req, res) => {
  const product = new Product({ ...req.body, id: uuidv4() });
  const savedProduct = await product.save();
  res.status(201).json(savedProduct);
}));

// Update an existing product
router.put('/api/products/:id', validateProduct, asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  res.json(product);
}));

// Delete a product
router.delete('/api/products/:id', asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  res.status(204).send();
}));

// Get product count by category
router.get('/api/products/stats/category', asyncHandler(async (req, res) => {
  const stats = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  res.json(stats);
}));

module.exports = router;
