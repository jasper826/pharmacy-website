const mongoose = require('mongoose');

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
    enum: ['Pending', 'Approved', 'Rejected', 'Fulfilled', 'pending', 'reviewed', 'fulfilled'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);