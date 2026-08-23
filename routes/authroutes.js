const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d' // Token valid for 7 days
  });
};

// ==========================================
// @route   POST /api/auth/register
// @desc    Register a new user
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // 1. Check required fields
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create new user
    const newUser = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword
    });

    // 5. Generate token & return user info
    const token = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// ==========================================
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check input fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    // 2. Find user in database
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;