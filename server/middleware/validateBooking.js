/**
 * validateBooking.js
 *
 * Request-body validation middleware for POST /api/v1/bookings.
 *
 * Uses Zod for schema definition because it is TypeScript-native,
 * has excellent tree-shakeable refinements, and generates very clear
 * error messages without requiring a separate "yup"/"joi" adapter.
 *
 * If you prefer Joi, swap the schema definition – the middleware wrapper
 * pattern stays identical.
 *
 * NOTE: `zod` must be installed: npm install zod  (in /server)
 */

const { z } = require('zod');

// ─── Booking Schema ───────────────────────────────────────────────────────────

const bookingSchema = z.object({
  deviceType: z
    .string({ required_error: 'Device type is required' })
    .min(2, 'Device type must be at least 2 characters')
    .max(100, 'Device type must be under 100 characters'),

  brand: z
    .string({ required_error: 'Brand is required' })
    .min(1, 'Brand cannot be empty')
    .max(100, 'Brand must be under 100 characters'),

  issue: z
    .string({ required_error: 'Issue description is required' })
    .min(10, 'Please describe the issue in at least 10 characters')
    .max(1000, 'Issue description must be under 1000 characters'),

  address: z
    .string({ required_error: 'Service address is required' })
    .min(10, 'Address seems too short – please provide a full address')
    .max(300),

  // ISO date string or JS-parseable date; must be today or in the future.
  preferredDate: z
    .string({ required_error: 'Preferred date is required' })
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date >= new Date(new Date().toDateString());
    }, 'Preferred date must be today or a future date'),

  preferredTime: z
    .string({ required_error: 'Preferred time is required' })
    .regex(/^\d{2}:\d{2}$/, 'Preferred time must be in HH:MM format'),

  // Optional fields
  model: z.string().max(100).optional(),
  additionalNotes: z.string().max(500).optional(),

  // These are set server-side; reject if the client tries to inject them.
  status: z.undefined({ errorMap: () => ({ message: 'Field "status" cannot be set by the client' }) }),
  technician: z.undefined({ errorMap: () => ({ message: 'Field "technician" cannot be set by the client' }) }),
});

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * validate(schema)
 *
 * Generic Zod validation factory.  Parses req.body against the given schema
 * and calls next() on success, or calls next(err) with a structured error
 * so the global errorHandler picks it up.
 *
 * Keeping the factory generic means any route can reuse it:
 *   router.post('/route', validate(someSchema), handler)
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Map Zod issues into a flat array of human-readable messages.
    const errors = result.error.issues.map((issue) => {
      const field = issue.path.join('.');
      return field ? `${field}: ${issue.message}` : issue.message;
    });

    // Build an error object that our errorHandler recognises.
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.errors = errors;
    return next(err);
  }

  // Replace req.body with the Zod-parsed (stripped + coerced) data
  // so downstream handlers always receive clean, typed input.
  req.body = result.data;
  next();
};

// Export a ready-to-use middleware for the bookings route.
const validateBooking = validate(bookingSchema);

module.exports = { validateBooking, validate, bookingSchema };
