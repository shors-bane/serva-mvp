/**
 * errorHandler.js
 *
 * Centralised Express error-handling middleware.
 *
 * Architecture:
 *  - Must be the LAST middleware registered in index.js (after all routes).
 *  - Every route/controller that encounters an error should call next(err)
 *    instead of manually writing res.status(500).json(…).
 *  - Distinguishes between known error types (Mongoose validation, JWT, cast
 *    errors, duplicate keys) and unknown errors, producing a consistent JSON
 *    response shape.
 *
 * Response shape:
 *  {
 *    success: false,
 *    statusCode: number,
 *    message: string,
 *    errors?: string[]   // only for validation errors
 *  }
 */

// ─── Known Error Classifiers ──────────────────────────────────────────────────

/**
 * Converts a Mongoose ValidationError into a structured 400 response.
 * Each failed path becomes its own error message in the `errors` array.
 */
const handleMongooseValidationError = (err) => ({
  statusCode: 400,
  message: 'Validation failed',
  errors: Object.values(err.errors).map((e) => e.message),
});

/**
 * Mongoose CastError: usually a malformed ObjectId in a route param.
 * e.g. GET /api/v1/bookings/not-a-valid-id
 */
const handleCastError = (err) => ({
  statusCode: 400,
  message: `Invalid value for field '${err.path}': ${err.value}`,
});

/**
 * MongoDB duplicate key (code 11000).
 * Extracts the duplicated field name from the error keyValue map.
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  return {
    statusCode: 409,
    message: `A record with this ${field} already exists`,
  };
};

/**
 * JWT errors thrown by jsonwebtoken when the middleware calls next(err).
 */
const handleJwtError = (err) => {
  if (err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Your session has expired. Please log in again.' };
  }
  if (err.name === 'JsonWebTokenError') {
    return { statusCode: 401, message: 'Invalid authentication token.' };
  }
  if (err.name === 'NotBeforeError') {
    return { statusCode: 401, message: 'Token is not yet valid.' };
  }
  return null; // Not a JWT error we recognise
};

// ─── Main Handler ─────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default shape
  let statusCode = err.statusCode || err.status || 500;
  let message    = err.message    || 'An unexpected error occurred';
  let errors;    // optional validation error list

  // ── Mongoose ValidationError ────────────────────────────────────────────────
  if (err.name === 'ValidationError' && err.errors) {
    const result = handleMongooseValidationError(err);
    statusCode   = result.statusCode;
    message      = result.message;
    errors        = result.errors;
  }

  // ── Mongoose CastError ──────────────────────────────────────────────────────
  else if (err.name === 'CastError') {
    const result = handleCastError(err);
    statusCode   = result.statusCode;
    message      = result.message;
  }

  // ── MongoDB Duplicate Key ───────────────────────────────────────────────────
  else if (err.code === 11000) {
    const result = handleDuplicateKeyError(err);
    statusCode   = result.statusCode;
    message      = result.message;
  }

  // ── JWT Errors ──────────────────────────────────────────────────────────────
  else if (['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(err.name)) {
    const result = handleJwtError(err);
    statusCode   = result.statusCode;
    message      = result.message;
  }

  // ── Log unexpected server errors only (not client errors) ──────────────────
  if (statusCode >= 500) {
    console.error(`[ErrorHandler] ${req.method} ${req.url}`, err);
  }

  // ── Send consistent JSON response ───────────────────────────────────────────
  const body = { success: false, statusCode, message };
  if (errors) body.errors = errors;

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
