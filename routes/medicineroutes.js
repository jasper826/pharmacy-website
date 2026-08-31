const express = require('express');
const router = express.Router();
const Medicine = require('../models/medicine');

// Get all medicines (with optional search & category filter)
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { genericName: searchRegex },
        { category: searchRegex },
        { description: searchRegex }
      ];
    }

    if (category && category !== 'All' && category.trim() !== '') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    const medicines = await Medicine.find(query);
    res.json({
      success: true,
      count: medicines.length,
      data: medicines,
      medicines
    });
  } catch (err) {
    console.error('Fetch medicines error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching medicines', error: err.message });
  }
});

// Get single medicine by ID
router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found.' });
    }
    res.json({ success: true, data: medicine, medicine });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching medicine details', error: err.message });
  }
});

// Add new medicine
router.post('/', async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();
    res.status(201).json({ success: true, data: medicine, medicine });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to add medicine', error: err.message });
  }
});

module.exports = router;