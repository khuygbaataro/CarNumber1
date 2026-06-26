const Settings = require('../models/Settings');

// GET /api/settings  (public — drives header, footer, contact, banner, loan)
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings  (protected) — partial update.
// Uses $set with dot-notation so nested fields (contact/social/loan) persist
// reliably (assigning a whole nested object on a Mongoose doc can be missed
// by change tracking).
const updateSettings = async (req, res, next) => {
  try {
    const { companyName, logo, banner, contact, social, loan } = req.body;
    const $set = {};

    if (companyName !== undefined) $set.companyName = companyName;
    if (logo !== undefined) $set.logo = logo;
    if (banner !== undefined) $set.banner = banner;

    if (contact) {
      if (contact.phone !== undefined) $set['contact.phone'] = contact.phone;
      if (contact.email !== undefined) $set['contact.email'] = contact.email;
      if (contact.address !== undefined) $set['contact.address'] = contact.address;
    }

    if (social) {
      if (social.facebook !== undefined) $set['social.facebook'] = social.facebook;
      if (social.instagram !== undefined) $set['social.instagram'] = social.instagram;
      if (social.youtube !== undefined) $set['social.youtube'] = social.youtube;
    }

    if (loan) {
      if (loan.minDownPercent !== undefined)
        $set['loan.minDownPercent'] = Number(loan.minDownPercent);
      if (loan.monthlyInterestRate !== undefined)
        $set['loan.monthlyInterestRate'] = Number(loan.monthlyInterestRate);
      if (Array.isArray(loan.termOptions)) {
        const terms = loan.termOptions
          .map(Number)
          .filter((n) => Number.isFinite(n) && n > 0);
        if (terms.length) $set['loan.termOptions'] = terms;
      }
    }

    // Ensure the singleton exists, then update it.
    await Settings.getSingleton();
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
