const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/* =======================================================
   1. MONGOOSE SCHEMA & MODEL
   ======================================================= */
const prescriptionSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'Uploaded prescription file path is required']
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Fulfilled'],
    default: 'Pending'
  }
}, { timestamps: true });

const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

/* =======================================================
   2. MULTER FILE STORAGE CONFIGURATION
   ======================================================= */
const uploadDir = path.join(__dirname, '../uploads/prescriptions');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `rx-${uniqueSuffix}${ext}`);
  }
});

// File filter for images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/* =======================================================
   3. API ROUTES
   ======================================================= */

/**
 * @route   POST /api/prescriptions
 * @desc    Upload a new prescription (Patient)
 * @access  Public
 */
router.post('/', upload.single('rx-file'), async (req, res) => {
  try {
    const { 'rx-name': patientName, 'rx-phone': phone, 'rx-notes': notes } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a prescription image or document file.' });
    }

    // Relative path for web serving
    const relativeFilePath = path.join('uploads', 'prescriptions', req.file.filename).replace(/\\/g, '/');

    const newPrescription = new Prescription({
      patientName,
      phone,
      filePath: relativeFilePath,
      notes: notes || ''
    });

    const savedPrescription = await newPrescription.save();
    res.status(201).json({
      message: 'Prescription uploaded successfully',
      prescription: savedPrescription
    });
  } catch (err) {
    console.error('Prescription POST error:', err);
    res.status(500).json({ message: err.message || 'Server error processing prescription upload' });
  }
});

/**
 * @route   GET /api/prescriptions
 * @desc    Fetch all prescriptions for the Pharmacist Dashboard
 * @access  Pharmacist / Admin
 */
router.get('/', async (req, res) => {
  try {
    const prescriptions = await Prescription.find().sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    console.error('Prescription GET error:', err);
    res.status(500).json({ message: 'Server error retrieving prescriptions list' });
  }
});

/**
 * @route   PATCH /api/prescriptions/:id/status
 * @desc    Update prescription status (Approved, Rejected, Fulfilled)
 * @access  Pharmacist
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Approved', 'Rejected', 'Fulfilled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status update option provided.' });
    }

    const updatedRx = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedRx) {
      return res.status(404).json({ message: 'Prescription record not found.' });
    }

    res.json({
      message: `Prescription status updated to ${status}`,
      prescription: updatedRx
    });
  } catch (err) {
    console.error('Prescription PATCH error:', err);
    res.status(500).json({ message: 'Server error updating prescription status' });
  }
});

module.exports = router;