const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// POST: Place a new order from cart checkout
router.post('/checkout', async (req, res) => {
  try {
    const { items, totalAmount, customerPhone, deliveryAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart cannot be empty.' });
    }

    const newOrder = new Order({
      items,
      totalAmount,
      customerPhone,
      deliveryAddress
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: newOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET: Fetch all orders (for admin review)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;