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
    const {
      companyName,
      logo,
      banner,
      contact,
      social,
      loan,
      about,
      workingHours,
      testimonials,
      partners,
      images,
    } = req.body;
    const $set = {};

    if (companyName !== undefined) $set.companyName = companyName;
    if (logo !== undefined) $set.logo = logo;
    if (banner !== undefined) $set.banner = banner;
    if (about !== undefined) $set.about = String(about).slice(0, 2000);
    if (workingHours !== undefined) $set.workingHours = String(workingHours).slice(0, 200);
    if (Array.isArray(testimonials)) {
      $set.testimonials = testimonials
        .filter((x) => x && (x.name || x.text))
        .map((x) => ({
          name: String(x.name || '').slice(0, 100),
          text: String(x.text || '').slice(0, 500),
        }))
        .slice(0, 20);
    }
    if (Array.isArray(partners)) {
      $set.partners = partners
        .filter((u) => typeof u === 'string' && u)
        .slice(0, 20);
    }

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

    if (images) {
      if (images.maxWidth !== undefined) {
        const w = Number(images.maxWidth);
        if (Number.isFinite(w) && w > 0) $set['images.maxWidth'] = w;
      }
      const wm = images.watermark;
      if (wm) {
        if (wm.enabled !== undefined) $set['images.watermark.enabled'] = Boolean(wm.enabled);
        if (wm.text !== undefined)
          $set['images.watermark.text'] = String(wm.text).slice(0, 60);
        if (wm.position !== undefined) {
          const allowed = ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center'];
          if (allowed.includes(wm.position)) $set['images.watermark.position'] = wm.position;
        }
        if (wm.fontFamily !== undefined) {
          const fonts = ['Arial', 'Verdana', 'Impact', 'Georgia', 'Montserrat'];
          if (fonts.includes(wm.fontFamily)) $set['images.watermark.fontFamily'] = wm.fontFamily;
        }
        if (wm.fontSize !== undefined) {
          const fs = Number(wm.fontSize);
          if (Number.isFinite(fs) && fs > 0) $set['images.watermark.fontSize'] = fs;
        }
        if (wm.opacity !== undefined) {
          const op = Number(wm.opacity);
          if (Number.isFinite(op)) $set['images.watermark.opacity'] = Math.min(100, Math.max(0, op));
        }
        if (wm.color !== undefined) $set['images.watermark.color'] = String(wm.color).slice(0, 20);
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
