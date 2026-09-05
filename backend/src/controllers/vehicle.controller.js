const ApiError = require('../utils/ApiError');
const Vehicle = require('../models/Vehicle');

// Whitelist of sort options the client may request.
const SORT_MAP = {
  newest: '-createdAt',
  oldest: 'createdAt',
  price_asc: 'price',
  price_desc: '-price',
  year_desc: '-year',
  year_asc: 'year',
};

// GET /api/vehicles  — list with search / filter / sort / pagination
const getVehicles = async (req, res, next) => {
  try {
    const {
      brand,
      model,
      year,
      minPrice,
      maxPrice,
      status,
      search,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (model) filter.model = { $regex: model, $options: 'i' };
    if (year) filter.year = Number(year);
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
    const skip = (pageNum - 1) * limitNum;
    const sortBy = SORT_MAP[sort] || SORT_MAP.newest;

    const [items, total] = await Promise.all([
      Vehicle.find(filter).sort(sortBy).skip(skip).limit(limitNum),
      Vehicle.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/vehicles/featured
const getFeatured = async (req, res, next) => {
  try {
    const items = await Vehicle.find({ featured: true, status: 'available' })
      .sort('-createdAt')
      .limit(8);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

// GET /api/vehicles/latest
const getLatest = async (req, res, next) => {
  try {
    const items = await Vehicle.find({ status: 'available' })
      .sort('-createdAt')
      .limit(8);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

// Загварын нэрээс ангилал гаргана (Prius 41, Sai, RX, ... эсвэл Бусад)
function categoryOf(model) {
  const m = String(model || '').trim();
  const prius = m.match(/prius\s*(\d{2})/i);
  if (prius) return `Prius ${prius[1]}`;
  if (/prius/i.test(m)) return 'Prius';
  if (/^aqua/i.test(m)) return 'Aqua';
  if (/^sai/i.test(m)) return 'Sai';
  if (/^alphard/i.test(m)) return 'Alphard';
  if (/^crown/i.test(m)) return 'Crown';
  if (/^camry/i.test(m)) return 'Camry';
  if (/^harrier/i.test(m)) return 'Harrier';
  if (/^vellfire/i.test(m)) return 'Vellfire';
  if (/land\s*cruiser/i.test(m)) return 'Land Cruiser';
  if (/^rx/i.test(m)) return 'RX';
  if (/^hs/i.test(m)) return 'HS';
  if (/^gs/i.test(m)) return 'GS';
  if (/^c-?hr/i.test(m)) return 'CHR';
  return 'Бусад';
}

// GET /api/vehicles/categories — маркаар ангилсан тоо + боломжит онууд
const getCategories = async (req, res, next) => {
  try {
    const docs = await Vehicle.find({ status: 'available' }).select('model year').lean();
    const counts = {};
    const years = new Set();
    for (const d of docs) {
      const c = categoryOf(d.model);
      counts[c] = (counts[c] || 0) + 1;
      const y = Math.trunc(Number(d.year));
      if (y >= 1990 && y <= 2030) years.add(y); // алдаатай онуудыг (ж: 203) хасна
    }
    // "Бусад"-ыг үргэлж хамгийн сүүлд, бусдыг тоогоор нь буурахаар
    const categories = Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => {
        if (a.label === 'Бусад') return 1;
        if (b.label === 'Бусад') return -1;
        return b.count - a.count;
      });
    res.json({
      success: true,
      data: { categories, years: [...years].sort((a, b) => b - a), total: docs.length },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/vehicles/:id
const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) throw new ApiError(404, 'Машин олдсонгүй');
    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// POST /api/vehicles  (protected)
const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// PUT /api/vehicles/:id  (protected)
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vehicle) throw new ApiError(404, 'Машин олдсонгүй');
    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/vehicles/:id/status  (protected)
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['available', 'sold'].includes(status)) {
      throw new ApiError(400, 'Төлөв буруу байна');
    }
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!vehicle) throw new ApiError(404, 'Машин олдсонгүй');
    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/vehicles/:id  (protected)
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) throw new ApiError(404, 'Машин олдсонгүй');
    res.json({ success: true, message: 'Машин устгагдлаа' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicles,
  getFeatured,
  getLatest,
  getCategories,
  getVehicle,
  createVehicle,
  updateVehicle,
  updateStatus,
  deleteVehicle,
};
