const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: '' },
    vehicleId: { type: String, default: '' }, // optional reference
    vehicleName: { type: String, default: '' }, // snapshot for display
    status: {
      type: String,
      enum: ['new', 'contacted'],
      default: 'new',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', leadSchema);
