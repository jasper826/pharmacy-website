const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Prescription = require('../models/prescription');

// 1. Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'prescriptions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Multer Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique filename format: rx-TIMESTAMP-RANDOM.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `rx-${uniqueSuffix}${ext}`);
  }
});

// 3. File Filter (Accept JPG, PNG, WEBP, and PDF formats)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|pdf/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = /image\/(jpeg|jpg|png|webp)|application\/pdf/.test(file.mimetype);

  if (extName || mimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPG, PNG, WEBP) and PDF documents are allowed!'));
  }
};

// 4. Initialize Multer Middleware (Max 10MB file size)
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Middleware wrapper to catch Multer errors gracefully
const uploadMiddleware = (req, res, next) => {
  upload.single('rx-file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size exceeds 10MB limit. Please upload a smaller file.' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Handler for uploading prescription
const handleUpload = async (req, res) => {
  try {
    const patientName = req.body['rx-name'] || req.body.patientName || req.body.name;
    const phone = req.body['rx-phone'] || req.body.phone;
    const notes = req.body['rx-notes'] || req.body.notes || '';

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a prescription document or image.' });
    }

    if (!patientName || !phone) {
      return res.status(400).json({ success: false, message: 'Patient name and phone number are required.' });
    }

    // Relative web path (e.g. "uploads/prescriptions/rx-123.jpg")
    const relativeFilePath = `uploads/prescriptions/${req.file.filename}`;

    // Save upload metadata into MongoDB
    const newPrescription = await Prescription.create({
      patientName,
      phone,
      filePath: relativeFilePath,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Prescription uploaded successfully!',
      prescription: newPrescription,
      data: newPrescription
    });
  } catch (error) {
    console.error('Prescription Upload Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during prescription upload.' });
  }
};

// ==========================================
// @route   POST /api/prescriptions/upload or POST /api/prescriptions
// @desc    Upload patient prescription document
// ==========================================
router.post('/upload', uploadMiddleware, handleUpload);
router.post('/', uploadMiddleware, handleUpload);


// ==========================================
// @route   GET /api/prescriptions
// @desc    Get all uploaded prescriptions (for Pharmacist Dashboard)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const prescriptions = await Prescription.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
      prescriptions
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching prescriptions.' });
  }
});

// ==========================================
// @route   PATCH /api/prescriptions/:id/status
// @desc    Update prescription status
// ==========================================
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Reviewed', 'Approved', 'Rejected', 'Fulfilled'];
    
    // Normalize status capitalization
    const normalizedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : '';

    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}` });
    }

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status: normalizedStatus },
      { new: true, runValidators: true }
    );

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Prescription status updated to ${normalizedStatus}`,
      prescription,
      data: prescription
    });
  } catch (error) {
    console.error('Error updating status:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating prescription status.' });
  }
});

module.exports = router;