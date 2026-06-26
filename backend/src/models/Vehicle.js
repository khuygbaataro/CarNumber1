const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true, index: true },
    year: { type: Number, required: true, index: true },
    price: { type: Number, required: true, min: 0, index: true }, // MNT
    mileage: { type: Number, required: true, min: 0 }, // km
    engine: { type: String, trim: true, default: '' },
    exteriorColor: { type: String, trim: true, default: '' },
    interiorColor: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    images: { type: [String], default: [] }, // Cloudinary URLs
    video: { type: String, default: '' }, // optional Cloudinary URL
    status: {
      type: String,
      enum: ['available', 'sold'],
      default: 'available',
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    // Optional per-vehicle down payment %. null = use the global setting.
    downPercent: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
