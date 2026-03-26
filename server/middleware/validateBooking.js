/**
 * validateBooking.js
 *
 * Request-body validation middleware for POST /api/v1/bookings.
 *
 * ⚠️  FormData reality check
 * ─────────────────────────────────────────────────────────────────────────────
 * The BookingWizard sends multipart/form-data, which means:
 *
 *   1. Every value arrives as a STRING – even numbers, booleans and dates.
 *      Use z.coerce or plain z.string() for everything; never expect a Date
 *      object or a number unless you coerce it first.
 *
 *   2. Omitted fields may arrive as the literal string "undefined" or as an
 *      absent key.  We normalise both cases before Zod sees the body.
 *
 *   3. FormData cannot send `undefined` – so we cannot use z.undefined() to
 *      block client-injected fields.  Instead we strip them post-parse.
 *
 * Actual fields sent by BookingWizard.js (as of this version):
 *   deviceType | issue | preferredTime | address
 *   customIssueDescription? | photo (file, handled by multer before us)
 */

const { z } = require('zod');

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Strips keys whose value is the string "undefined" (a FormData artefact
 * when JavaScript serialises an undefined variable into a FormData field).
 */
const dropFormDataUndefined = (obj) => {
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== 'undefined' && v !== undefined) clean[k] = v;
  }
  return clean;
};

// ─── Booking Schema ───────────────────────────────────────────────────────────

const bookingSchema = z.object({
  // ── Required fields ────────────────────────────────────────────────────────

  deviceType: z
    .string({ required_error: 'Device type is required' })
    .min(2, 'Device type must be at least 2 characters')
    .max(100, 'Device type must be under 100 characters')
    .transform((v) => v.trim()),

  issue: z
    .string({ required_error: 'Issue description is required' })
    // min(1) not min(10): the wizard sends short IDs like "battery" or "broken-screen"
    .min(1, 'Issue is required')
    .max(1000, 'Issue description must be under 1000 characters')
    .transform((v) => v.trim()),

  // FormData sends slot strings like "9:00 AM" or "14:00" – not a strict HH:MM
  // format.  Accept any non-empty string; the wizard already enforces valid slots.
  preferredTime: z
    .string({ required_error: 'Preferred time is required' })
    .min(1, 'Preferred time is required')
    .max(20, 'Preferred time value is too long'),

  address: z
    .string({ required_error: 'Service address is required' })
    .min(5, 'Address seems too short – please provide a full address')
    .max(300, 'Address must be under 300 characters')
    .transform((v) => v.trim()),

  // ── Optional fields ────────────────────────────────────────────────────────

  // brand / model are not collected by the current wizard but may be added later
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),

  // Free-text elaboration when issue === 'other'
  customIssueDescription: z.string().max(1000).optional(),

  additionalNotes: z.string().max(500).optional(),

  // preferredDate is not sent by the current wizard; kept optional for future use
  preferredDate: z
    .string()
    .refine(
      (val) => {
        const d = new Date(val);
        return !isNaN(d.getTime()) && d >= new Date(new Date().toDateString());
      },
      'Preferred date must be today or a future date',
    )
    .optional(),

  // ── Server-only fields – strip silently rather than reject ─────────────────
  // Using z.undefined() on a FormData payload causes spurious 400s when an
  // empty string arrives for these keys.  We accept-and-strip them here, then
  // overwrite them authoritatively in the route handler.
  status:     z.string().optional(),
  technician: z.string().optional(),
});

// ─── Middleware factory ───────────────────────────────────────────────────────

/**
 * validate(schema)
 *
 * Generic Zod validation middleware factory.
 *
 *   router.post('/route', validate(someSchema), handler)
 *
 * On success  → replaces req.body with the Zod-parsed output (coerced + stripped).
 * On failure  → calls next(err) with { statusCode: 400, errors: string[] }
 *               so the global errorHandler produces the standard JSON shape.
 */
const validate = (schema) => (req, res, next) => {
  // Normalise FormData artefacts before schema validation.
  const rawBody = dropFormDataUndefined(req.body || {});

  const result = schema.safeParse(rawBody);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const field = issue.path.join('.');
      // Produce messages like "address: Service address is required"
      return field ? `${field}: ${issue.message}` : issue.message;
    });

    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.errors     = errors;
    return next(err);
  }

  // Strip server-only fields so the route handler can set them authoritatively
  // without having to delete them manually.
  const { status, technician, ...safeBody } = result.data;

  req.body = safeBody; // downstream handler receives only trusted, typed fields
  next();
};

// ─── Exports ──────────────────────────────────────────────────────────────────

const validateBooking = validate(bookingSchema);

module.exports = { validateBooking, validate, bookingSchema };

