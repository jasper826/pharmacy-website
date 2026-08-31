const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// POST: Place a new order from cart checkout (supports / and /checkout)
const handleCreateOrder = async (req, res) => {
  try {
    const {
      items,
      customerName,
      name,
      customerPhone,
      phone,
      deliveryAddress,
      totalAmount,
      totalPrice,
      paymentMethod
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart cannot be empty.' });
    }

    const resolvedName = customerName || name || 'Guest Customer';
    const resolvedPhone = customerPhone || phone;
    const resolvedTotal = totalPrice !== undefined ? totalPrice : totalAmount;

    if (!resolvedPhone) {
      return res.status(400).json({ success: false, message: 'Phone number is required for delivery coordination.' });
    }
    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: 'Delivery address is required.' });
    }

    const formattedItems = items.map(item => ({
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1
    }));

    const newOrder = new Order({
      customerName: resolvedName,
      phone: resolvedPhone,
      deliveryAddress,
      items: formattedItems,
      totalPrice: Number(resolvedTotal) || formattedItems.reduce((sum, it) => sum + it.price * it.quantity, 0),
      paymentMethod: paymentMethod || 'Cash on Delivery'
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: newOrder,
      data: newOrder
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error placing order.' });
  }
};

router.post('/', handleCreateOrder);
router.post('/checkout', handleCreateOrder);

// GET: Fetch all orders (for admin review)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, data: orders, orders });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error retrieving orders.' });
  }
});

// PATCH: Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating order status.' });
  }
});

module.exports = router;