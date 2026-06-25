const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');
const User = require('../models/User');

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, 'Имэйл болон нууц үг шаардлагатай');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Имэйл эсвэл нууц үг буруу байна');
    }

    const token = signToken({ id: user._id });
    res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { id: req.user._id, email: req.user.email, role: req.user.role },
  });
};

module.exports = { login, getMe };
