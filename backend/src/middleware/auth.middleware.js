const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');
const User = require('../models/User');

/**
 * Protect admin-only routes. Expects: Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw new Error('No token');
    }
    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) throw new Error('User not found');
    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, 'Нэвтрэх эрх хүчингүй байна'));
  }
};

module.exports = { protect };
