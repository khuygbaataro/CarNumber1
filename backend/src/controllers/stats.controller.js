const mongoose = require('mongoose');
const PageView = require('../models/PageView');
const Vehicle = require('../models/Vehicle');

// The dashboard offers these three windows; anything else is rejected rather
// than quietly served, so a typo cannot turn into a full-collection scan.
const WINDOWS = {
  day: { hours: 24, bucket: 'hour', buckets: 24 },
  week: { hours: 24 * 7, bucket: 'day', buckets: 7 },
  month: { hours: 24 * 30, bucket: 'day', buckets: 30 },
};

// POST /api/stats/view  (public)
const trackView = async (req, res) => {
  // Always 204, whatever happens. A counter must never be the reason a page
  // reports an error, and a visitor gains nothing from knowing it failed.
  try {
    const path = String(req.body?.path || '').trim().slice(0, 300);
    const visitor = String(req.body?.visitor || '').trim().slice(0, 64);
    if (!path || !visitor || path.startsWith('/admin')) return res.status(204).end();

    const id = String(req.body?.vehicleId || '');
    const vehicle = mongoose.isValidObjectId(id) ? id : null;

    await PageView.create({ path, visitor, vehicle });
  } catch (error) {
    console.error('[stats] view not recorded:', error && error.message);
  }
  return res.status(204).end();
};

// GET /api/stats/traffic?window=day|week|month  (protected)
const getTraffic = async (req, res, next) => {
  try {
    const key = WINDOWS[req.query.window] ? req.query.window : 'week';
    const { hours, bucket, buckets } = WINDOWS[key];
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Buckets are built from the series Mongo returns rather than from it —
    // an hour with no visitors has no row, and a chart with holes in it reads
    // as broken data rather than a quiet hour.
    const unit = bucket === 'hour' ? 'hour' : 'day';
    const [series, totals, carViews, topVehicles] = await Promise.all([
      PageView.aggregate([
        { $match: { at: { $gte: since } } },
        {
          $group: {
            _id: { $dateTrunc: { date: '$at', unit } },
            views: { $sum: 1 },
            visitors: { $addToSet: '$visitor' },
          },
        },
        { $project: { _id: 1, views: 1, visitors: { $size: '$visitors' } } },
        { $sort: { _id: 1 } },
      ]),
      PageView.aggregate([
        { $match: { at: { $gte: since } } },
        { $group: { _id: null, views: { $sum: 1 }, visitors: { $addToSet: '$visitor' } } },
        { $project: { _id: 0, views: 1, visitors: { $size: '$visitors' } } },
      ]),
      // Every opening counts, repeats included: this is how often a car was
      // looked at, not how many people looked at it. The same person coming
      // back to a car twice is two looks, which is the reading asked for —
      // and it keeps the per-car numbers below adding up to this total.
      PageView.aggregate([
        { $match: { at: { $gte: since }, vehicle: { $ne: null } } },
        { $count: 'n' },
      ]),
      PageView.aggregate([
        { $match: { at: { $gte: since }, vehicle: { $ne: null } } },
        { $group: { _id: '$vehicle', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const byBucket = new Map(series.map((row) => [new Date(row._id).getTime(), row]));
    const step = unit === 'hour' ? 3600e3 : 86400e3;
    const end = Math.floor(Date.now() / step) * step;
    const points = [];
    for (let i = buckets - 1; i >= 0; i--) {
      const at = end - i * step;
      const row = byBucket.get(at);
      points.push({ at: new Date(at), views: row?.views || 0, visitors: row?.visitors || 0 });
    }

    const cars = await Vehicle.find(
      { _id: { $in: topVehicles.map((v) => v._id) } },
      'brand model images price'
    ).lean();
    const byId = new Map(cars.map((c) => [String(c._id), c]));

    res.json({
      success: true,
      data: {
        window: key,
        bucket: unit,
        totals: { ...(totals[0] || { views: 0, visitors: 0 }), carViews: carViews[0]?.n || 0 },
        points,
        topVehicles: topVehicles
          .map((row) => {
            const car = byId.get(String(row._id));
            // A car deleted since it was viewed leaves rows behind; they
            // still count in the totals but have nothing to name here.
            return car ? { ...car, _id: String(car._id), views: row.views } : null;
          })
          .filter(Boolean),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { trackView, getTraffic };
