/* eslint-disable no-unused-vars */

// 404 handler for unknown routes.
const notFound = (req, res, next) => {
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

// Central error handler. Translates thrown errors into a consistent shape.
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Серверийн алдаа гарлаа';

  // Mongoose validation / cast errors -> 400
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Буруу ID байна';
  }
  // Duplicate key (e.g. email already exists)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Энэ утга аль хэдийн бүртгэгдсэн байна';
  }

  if (process.env.NODE_ENV !== 'production') console.error(err);

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
