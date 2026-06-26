const ApiError = require('../utils/ApiError');
const Lead = require('../models/Lead');

// POST /api/leads  (public) — customer inquiry
const createLead = async (req, res, next) => {
  try {
    const { name, phone, message, vehicleId, vehicleName } = req.body;
    if (!name || !phone) {
      throw new ApiError(400, 'Нэр болон утас шаардлагатай');
    }
    const lead = await Lead.create({
      name: String(name).trim().slice(0, 100),
      phone: String(phone).trim().slice(0, 30),
      message: String(message || '').trim().slice(0, 1000),
      vehicleId: vehicleId ? String(vehicleId).slice(0, 64) : '',
      vehicleName: vehicleName ? String(vehicleName).slice(0, 150) : '',
    });
    res.status(201).json({ success: true, data: { id: lead._id } });
  } catch (error) {
    next(error);
  }
};

// GET /api/leads  (admin)
const getLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find().sort('-createdAt').limit(300);
    res.json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/leads/:id  (admin) — toggle new/contacted
const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['new', 'contacted'].includes(status)) {
      throw new ApiError(400, 'Төлөв буруу байна');
    }
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!lead) throw new ApiError(404, 'Хүсэлт олдсонгүй');
    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/leads/:id  (admin)
const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) throw new ApiError(404, 'Хүсэлт олдсонгүй');
    res.json({ success: true, message: 'Устгагдлаа' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createLead, getLeads, updateLeadStatus, deleteLead };
