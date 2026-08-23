const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/* =======================================================
   1. MONGOOSE ORDER SCHEMA & MODEL
   ======================================================= */
const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  deliveryAddress: {
    type: String,
    required: [true, 'Delivery address is required'],
    trim: true
  },
  items: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, min: 1 }
    }
  ],
  totalPrice: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Telebirr', 'CBE Birr'],
    default: 'Cash on Delivery'
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Delivered', 'Cancelled'],
    default: 'Pending'
  }
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

/* =======================================================
   2. API ROUTE ENDPOINTS
   ======================================================= */

/**
 * @route   POST /api/orders
 * @desc    Create a new order from shopping cart checkout
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { customerName, phone, deliveryAddress, items, totalPrice, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty. Cannot process order.' });
    }

    if (!customerName || !phone || !deliveryAddress) {
      return res.status(400).json({ message: 'Name, phone number, and delivery address are required.' });
    }

    const newOrder = new Order({
      customerName,
      phone,
      deliveryAddress,
      items,
      totalPrice,
      paymentMethod: paymentMethod || 'Cash on Delivery'
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({
      message: 'Order placed successfully!',
      order: savedOrder
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ message: err.message || 'Failed to place order.' });
  }
});

/**
 * @route   GET /api/orders
 * @desc    Get all orders (for pharmacy admin or order history)
 * @access  Public / Admin
 */
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Order fetch error:', err);
    res.status(500).json({ message: 'Server error retrieving orders.' });
  }
});

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Admin / Pharmacist
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status option.' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (err) {
    console.error('Order status update error:', err);
    res.status(500).json({ message: 'Server error updating order status.' });
  }
});

// ALWAYS KEEP module.exports AT THE VERY BOTTOM
module.exports = router;