const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

/* =======================================================
   1. MIDDLEWARE CONFIGURATION
   ======================================================= */
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
// If script.js is in a public/ subfolder, change to path.join(__dirname, 'public')
app.use(express.static(__dirname));

/* =======================================================
   2. MOUNT API ROUTERS
   ======================================================= */
// Adjust paths according to your file structure (e.g. './prescription' or './routes/prescription')
const prescriptionRoutes = require(fs.existsSync(path.join(__dirname, 'routes', 'prescription.js')) ? './routes/prescription' : './prescription');
const orderRoutes = require(fs.existsSync(path.join(__dirname, 'routes', 'order.js')) ? './routes/order' : './order');

app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/orders', orderRoutes);

/* =======================================================
   3. DATABASE CONNECTION & SERVER START
   ======================================================= */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careplus_db';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
  });