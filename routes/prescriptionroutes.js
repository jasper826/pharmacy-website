const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Prescription = require('../models/prescription');

// 1. Configure Multer Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Unique filename format: rx-TIMESTAMP-RANDOM.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `rx-${uniqueSuffix}${ext}`);
  }
});

// 2. File Filter (Accept JPG, PNG, and PDF formats)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPG, PNG) and PDF documents are allowed!'));
  }
};

// 3. Initialize Multer Middleware (Max 5MB file size)
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ==========================================
// @route   POST /api/prescriptions/upload
// @desc    Upload patient prescription document
// ==========================================
router.post('/upload', upload.single('rx-file'), async (req, res) => {
  try {
    const { 'rx-name': patientName, 'rx-phone': phone, 'rx-notes': notes } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a prescription document or image.' });
    }

    if (!patientName || !phone) {
      return res.status(400).json({ message: 'Patient name and phone number are required.' });
    }

    // Save upload metadata into MongoDB
    const newPrescription = await Prescription.create({
      patientName,
      phone,
      filePath: req.file.path,
      notes: notes || ''
    });

    res.status(201).json({
      message: 'Prescription uploaded successfully!',
      prescription: newPrescription
    });
  } catch (error) {
    console.error('Prescription Upload Error:', error.message);
    res.status(500).json({ message: error.message || 'Server error during prescription upload.' });
  }
});

// ==========================================
// @route   GET /api/prescriptions
// @desc    Get all uploaded prescriptions (for Pharmacist Dashboard)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const prescriptions = await Prescription.find().sort({ createdAt: -1 });
    res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error.message);
    res.status(500).json({ message: 'Server error fetching prescriptions.' });
  }
});

// ==========================================
// @route   PATCH /api/prescriptions/:id/status
// @desc    Update prescription status (pending, reviewed, fulfilled)
// ==========================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'reviewed', 'fulfilled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found.' });
    }

    res.status(200).json({
      message: 'Prescription status updated successfully!',
      prescription
    });
  } catch (error) {
    console.error('Error updating status:', error.message);
    res.status(500).json({ message: 'Server error updating prescription status.' });
  }
});

module.exports = router;