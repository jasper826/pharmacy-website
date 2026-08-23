const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');

// Get all medicines (with optional search & category filter)
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All') {
      query.category = category;
    }

    const medicines = await Medicine.find(query);
    res.json({ success: true, count: medicines.length, data: medicines });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching medicines', error: err.message });
  }
});

// Add new medicine
router.post('/', async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();
    res.status(201).json({ success: true, data: medicine });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to add medicine', error: err.message });
  }
});

module.exports = router;