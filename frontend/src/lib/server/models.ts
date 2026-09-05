import mongoose, { Schema, Model } from 'mongoose';

// These schemas mirror the backend models. They exist here only so the
// Messenger webhook (running on Vercel) can read/write the same collections
// the Express backend uses. Keep the field lists in sync with backend/src/models.

// --- Vehicle (subset the bot writes; matches backend/src/models/Vehicle.js) ---
const vehicleSchema = new Schema(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    month: { type: Number, default: null }, // үйлдвэрлэсэн сар (1-12)
    price: { type: Number, required: true, min: 0 },
    mileage: { type: Number, required: true, min: 0 },
    engine: { type: String, trim: true, default: '' },
    exteriorColor: { type: String, trim: true, default: '' },
    interiorColor: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    images: { type: [String], default: [] },
    video: { type: String, default: '' },
    status: { type: String, enum: ['available', 'sold'], default: 'available' },
    featured: { type: Boolean, default: false },
    downPercent: { type: Number, default: null },
    transmission: { type: String, default: '' },
    steering: { type: String, default: '' },
    fuel: { type: String, default: '' },
  },
  { timestamps: true }
);

// --- Settings (read-only here; used for the image transformation) ---
const settingsSchema = new Schema({}, { strict: false, timestamps: true });

// --- Bot conversation state (this collection is owned by the bot) ---
// versionKey off: concurrent webhook deliveries otherwise trigger
// VersionError on array saves.
const botSessionSchema = new Schema(
  {
    senderId: { type: String, required: true, unique: true, index: true },
    messages: {
      type: [{ role: String, content: String, _id: false }],
      default: [],
    },
    images: { type: [String], default: [] }, // Cloudinary URLs collected this draft
    processedMids: { type: [String], default: [] }, // recent FB message ids (dedupe)
  },
  { timestamps: true, versionKey: false }
);

// Guard against model recompilation on hot reload / warm lambdas.
export const Vehicle: Model<any> =
  mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);
export const Settings: Model<any> =
  mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
export const BotSession: Model<any> =
  mongoose.models.BotSession || mongoose.model('BotSession', botSessionSchema);
