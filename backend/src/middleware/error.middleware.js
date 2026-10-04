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
  // Multer rejects a file before the route runs and carries no statusCode,
  // so without this an oversized or wrong-typed upload read as a 500 — a
  // server fault — when it is the request that is wrong.
  if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Файл хэт том байна'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Хэт олон файл сонгосон байна'
          : `Файл хүлээж авахад алдаа гарлаа (${err.code})`;
  }

  // Logged in production too. Vercel's function log is the only record a
  // failed request leaves, and skipping it here is why an upload that broke
  // on the live site left nothing behind to look at. The message and name
  // are enough to name the cause; the full error is not printed, so nothing
  // from the request body or the Cloudinary config can leak into the log.
  console.error(
    `[api] ${req.method} ${req.originalUrl} -> ${statusCode}:`,
    err.name || 'Error',
    '—',
    err.message || '(no message)',
    err.http_code ? `(cloudinary ${err.http_code})` : ''
  );

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
