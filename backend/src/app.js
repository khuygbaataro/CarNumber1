const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const settingsRoutes = require('./routes/settings.routes');
const uploadRoutes = require('./routes/upload.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// --- Core middleware ---
app.use(helmet());
// CLIENT_URL may be a comma-separated list of allowed origins.
// If unset, reflect the request origin (allow all) — fine for a public,
// token-authenticated API with no cookies.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// --- Health check ---
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'OK' })
);

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

// --- Errors ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
