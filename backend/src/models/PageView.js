const mongoose = require('mongoose');

/**
 * One row per page a visitor opens on the public site.
 *
 * Vercel's own analytics counts visits but will not hand the numbers back to
 * the app, so the dashboard cannot show them next to the cars they are about.
 * This is the same count kept where the admin panel can read it, and with the
 * one extra fact that matters here: which car was being looked at.
 *
 * `visitor` is a random id the browser generates and keeps — enough to tell
 * one person's five pages from five people's one, and nothing more. No
 * address, no account, nothing that identifies anybody.
 */
const pageViewSchema = new mongoose.Schema(
  {
    path: { type: String, required: true, trim: true, maxlength: 300 },
    // Set only on a car's own page, so "how many looked at this car" is a
    // query rather than a guess from the url.
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    visitor: { type: String, required: true, trim: true, maxlength: 64 },
    at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// Every dashboard query is "since <date>", often narrowed to one car.
pageViewSchema.index({ at: -1 });
pageViewSchema.index({ vehicle: 1, at: -1 });

// Raw rows are only needed for the windows the dashboard offers. Ninety days
// keeps a month-over-month comparison possible without the collection growing
// without end.
pageViewSchema.index({ at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('PageView', pageViewSchema);
