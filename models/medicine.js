const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: String,
  category: { type: String, required: true },
  price: { type: Number, required: true }, // Priced in ETB
  description: String,
  sideEffects: [String], // Array of common side effects
  counselingNotes: String, // Important pharmacist counseling points
  inStock: { type: Boolean, default: true },
  image: String
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);