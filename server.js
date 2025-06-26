// server.js - Starter Express server for Week 2 assignment

// Import required modules
const express = require('express');
const mongoose = require ('mongoose');
const { v4: uuidv4 } = require('uuid');
const productRoutes = require('./routes');
const { NotFoundError, ValidationError } = require('./errors');
const Product = require('./products'); // Add this with your other requires
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

//connect to mongoDb
const mongoUri= 'mongodb://localhost:27017/productsdb';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    // Seed in-memory products if collection is empty
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(products);
      console.log('Seeded in-memory products to MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Middleware setup
app.use(express.json());

// Logger middleware
function logger(req, res, next) {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
}
app.use(logger);

// Authentication middleware
function authenticateApiKey(req, res, next) {
  const apiKey = req.header('x-api-key');
  const validApiKey = process.env.API_KEY;
  if (apiKey !== validApiKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  next();
}

// Product validation middleware
function validateProduct(req, res, next) {
  const { name, description, price, category, inStock } = req.body;
  if (
    typeof name !== 'string' ||
    typeof description !== 'string' ||
    typeof price !== 'number' ||
    typeof category !== 'string' ||
    typeof inStock !== 'boolean'
  ) {
    return res.status(400).json({ error: 'Invalid product data' });
  }
  next();
}

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Example route implementation for GET /api/products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Protect all product routes
app.use('/api/products', authenticateApiKey);

// Use product routes
app.use(productRoutes);

// Global error handler
app.use((err, req, res, next) => {
  if (err.status) {
    res.status(err.status).json({ error: err.name, message: err.message });
  } else {
    res.status(500).json({ error: 'InternalServerError', message: err.message || 'Something went wrong' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app;