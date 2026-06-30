const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'Авто Дилер' },
    logo: { type: String, default: '' }, // Cloudinary URL
    banner: { type: String, default: '' }, // Cloudinary URL
    contact: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    social: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },
    // Trust signals (all admin-editable, optional).
    about: { type: String, default: '' },
    workingHours: { type: String, default: '' },
    testimonials: {
      type: [{ name: String, text: String, _id: false }],
      default: [],
    },
    partners: { type: [String], default: [] }, // partner logo URLs
    // Loan calculator config — set once by admin, applies to all vehicles.
    loan: {
      minDownPercent: { type: Number, default: 30 }, // minimum down payment %
      monthlyInterestRate: { type: Number, default: 2.8 }, // % per month
      termOptions: { type: [Number], default: [12, 24, 36] }, // months
    },
    // Image processing — applied to vehicle photos at upload time (baked in).
    // Changing these only affects images uploaded afterwards.
    images: {
      maxWidth: { type: Number, default: 1600 }, // resize: max width in px (keeps aspect ratio)
      watermark: {
        enabled: { type: Boolean, default: true },
        text: { type: String, default: '' }, // empty → falls back to companyName
        position: { type: String, default: 'bottom-right' }, // bottom-right|bottom-left|top-right|top-left|center
        fontFamily: { type: String, default: 'Arial' }, // Arial|Verdana|Impact|Georgia|Montserrat
        fontSize: { type: Number, default: 48 },
        opacity: { type: Number, default: 40 }, // 0–100
        color: { type: String, default: '#FFFFFF' },
      },
    },
  },
  { timestamps: true }
);

/**
 * The site has exactly one settings document. This helper always
 * returns it, creating it with defaults on first access.
 */
settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
