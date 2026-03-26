/**
 * aiController.js
 *
 * Controller for the AI device-photo analysis feature.
 *
 * Architecture decisions:
 *  1. Single responsibility: this module ONLY talks to the Gemini API.
 *     Multer file handling stays in the route definition.
 *  2. Graceful degradation is a first-class concern, not an afterthought.
 *     Any failure (missing key, timeout, bad JSON, quota exceeded) produces
 *     a well-typed fallback payload so the frontend can branch on it without
 *     crashing or showing ambiguous error messages.
 *  3. A configurable timeout (AI_TIMEOUT_MS) prevents a slow Gemini network
 *     call from blocking the request indefinitely.
 */

const fs           = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Configuration ────────────────────────────────────────────────────────────
const GEMINI_MODEL     = process.env.GEMINI_MODEL     || 'gemini-2.5-flash';
const AI_TIMEOUT_MS    = parseInt(process.env.AI_TIMEOUT_MS, 10) || 15_000; // 15 s

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wraps a promise with a timeout race.
 * Rejects with a named TimeoutError so we can distinguish it in the catch.
 */
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = setTimeout(() => {
        const err = new Error(`AI API call timed out after ${ms}ms`);
        err.name = 'TimeoutError';
        reject(err);
      }, ms);
      // Ensure the timer does not prevent Node from exiting in tests.
      if (timer.unref) timer.unref();
    }),
  ]);

/**
 * The standard fallback payload.
 * Returning { success: false, fallbackRequired: true } tells the frontend to
 * switch to manual input mode rather than showing a generic error.
 */
const FALLBACK_PAYLOAD = Object.freeze({
  success:          false,
  fallbackRequired: true,
  message:          'AI analysis unavailable. Please describe the issue manually.',
});

// ─── Core classify function (pure, testable) ──────────────────────────────────

/**
 * classifyDeviceImage
 *
 * Accepts an image buffer + MIME type and returns a structured diagnosis.
 *
 * @param {Buffer} imageBuffer  - Raw image bytes
 * @param {string} mimeType     - e.g. 'image/jpeg'
 * @returns {Promise<{ issue: string, severity: string, advice: string }>}
 * @throws if the API call fails (caller handles the fallback)
 */
const classifyDeviceImage = async (imageBuffer, mimeType) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `
    You are an expert electronics repair technician.
    Analyze this device photo and return ONLY a minified JSON object with these exact keys:
    {
      "issue":    "<one-line description of the visible problem>",
      "severity": "<Low | Moderate | High | Critical>",
      "advice":   "<recommended next step for the repair technician>"
    }
    Do not include markdown fences or any other text.
  `.trim();

  const imagePart = {
    inlineData: {
      data:     imageBuffer.toString('base64'),
      mimeType,
    },
  };

  const result = await withTimeout(
    model.generateContent([prompt, imagePart]),
    AI_TIMEOUT_MS,
  );

  const rawText = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(rawText); // throws SyntaxError if model returns non-JSON
};

// ─── Express Controller ───────────────────────────────────────────────────────

/**
 * analyzeIssue
 *
 * Express route handler for POST /api/v1/analyze-issue.
 * Expects multer to have placed the uploaded file at req.file.
 *
 * Success:  { success: true,  diagnosis: { issue, severity, advice } }
 * Fallback: { success: false, fallbackRequired: true, message: string }
 *
 * We deliberately do NOT call next(err) for AI failures – a degraded
 * response is a valid business outcome, not an unhandled server crash.
 */
const analyzeIssue = async (req, res, next) => {
  // Guard: multer must have processed a file upload.
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image uploaded. Please attach a photo of the device.',
    });
  }

  try {
    // Read the uploaded file into a buffer then remove the temp file.
    const imageBuffer = fs.readFileSync(req.file.path);
    const mimeType    = req.file.mimetype;

    // Clean up the temp file regardless of AI outcome.
    fs.unlink(req.file.path, () => {}); // fire-and-forget

    const diagnosis = await classifyDeviceImage(imageBuffer, mimeType);

    return res.json({ success: true, diagnosis });

  } catch (err) {
    // Log the technical detail server-side for observability.
    console.error(`[AI] analyzeIssue failed (${err.name}): ${err.message}`);

    // SyntaxError → model returned malformed JSON
    // TimeoutError → Gemini was too slow
    // Any other  → quota, auth, network, etc.
    // All cases → degrade gracefully so the booking flow continues.
    return res.json(FALLBACK_PAYLOAD);
  }
};

module.exports = { analyzeIssue, classifyDeviceImage, FALLBACK_PAYLOAD };
