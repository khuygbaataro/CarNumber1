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
    // Loan calculator config — set once by admin, applies to all vehicles.
    loan: {
      minDownPercent: { type: Number, default: 30 }, // minimum down payment %
      monthlyInterestRate: { type: Number, default: 2.8 }, // % per month
      termOptions: { type: [Number], default: [12, 24, 36] }, // months
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
