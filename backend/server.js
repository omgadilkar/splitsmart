require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');

const app = express();

// ======================
// Debug (Remove later)
// ======================
console.log("Current Working Directory:", process.cwd());
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("PORT:", process.env.PORT);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*'
}));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    message: 'Something went wrong on the server'
  });
});

// ======================
// MongoDB Connection
// ======================

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is not defined.");
  console.error("Check your .env file.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err.message);
    process.exit(1);
  });