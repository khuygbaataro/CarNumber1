const Settings = require('../models/Settings');

// GET /api/settings  (public — drives header, footer, contact, banner)
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings  (protected) — partial update / merge
const updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    const { companyName, logo, banner, contact, social, loan } = req.body;

    if (companyName !== undefined) settings.companyName = companyName;
    if (logo !== undefined) settings.logo = logo;
    if (banner !== undefined) settings.banner = banner;

    if (contact) {
      settings.contact = {
        phone: contact.phone ?? settings.contact?.phone ?? '',
        email: contact.email ?? settings.contact?.email ?? '',
        address: contact.address ?? settings.contact?.address ?? '',
      };
    }
    if (social) {
      settings.social = {
        facebook: social.facebook ?? settings.social?.facebook ?? '',
        instagram: social.instagram ?? settings.social?.instagram ?? '',
        youtube: social.youtube ?? settings.social?.youtube ?? '',
      };
    }
    if (loan) {
      const current = settings.loan || {};
      const terms = Array.isArray(loan.termOptions)
        ? loan.termOptions.map(Number).filter((n) => Number.isFinite(n) && n > 0)
        : current.termOptions;
      settings.loan = {
        minDownPercent: loan.minDownPercent ?? current.minDownPercent ?? 30,
        monthlyInterestRate:
          loan.monthlyInterestRate ?? current.monthlyInterestRate ?? 2.8,
        termOptions: terms && terms.length ? terms : [12, 24, 36],
      };
    }

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
