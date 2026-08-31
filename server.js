require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

/* =======================================================
   1. MIDDLEWARE CONFIGURATION
   ======================================================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload folders exist
const uploadDir = path.join(__dirname, 'uploads', 'prescriptions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded prescription files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files (index.html, style.css, script.js)
app.use(express.static(__dirname));

/* =======================================================
   2. MOUNT API ROUTERS
   ======================================================= */
const authRoutes = require('./routes/authroutes');
const medicineRoutes = require('./routes/medicineroutes');
const orderRoutes = require('./routes/orderroutes');
const prescriptionRoutes = require('./routes/prescriptionroutes');

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CarePlus Pharmacy API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Explicit root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 Handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

/* =======================================================
   3. DATABASE CONNECTION & SERVER START
   ======================================================= */
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careplus_pharmacy';

let server;

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
    server = app.listen(PORT, () => {
      console.log(`🚀 CarePlus Pharmacy Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️ Running server in offline fallback mode.');
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT} (offline fallback)`);
    });
  });

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  if (server) server.close(() => mongoose.connection.close(false));
});
