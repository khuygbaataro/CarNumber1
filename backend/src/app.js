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
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
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
