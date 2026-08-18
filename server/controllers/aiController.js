/**
 * controllers/aiController.js
 *
 * Serva — AI-Powered Device Diagnosis & Pricing Controller
 *
 * Architecture overview:
 *
 *  1. SINGLE RESPONSIBILITY: This module orchestrates two things:
 *       a) Sending the device photo to Gemini for structured diagnosis.
 *       b) Passing Gemini's output to the pricingEngine for an INR estimate.
 *     Multer upload handling stays in the route layer (not here).
 *
 *  2. STRICT JSON CONTRACT: Gemini is instructed via a detailed system prompt
 *     to return ONLY a valid JSON object matching a precise schema. Any markdown
 *     fences, extra prose, or malformed JSON is stripped/caught safely.
 *
 *  3. GRACEFUL DEGRADATION: Every failure path (missing key, timeout, quota,
 *     SyntaxError from LLM hallucination) produces a typed { success: false,
 *     fallbackRequired: true } payload so the frontend can switch to manual
 *     input without crashing.
 *
 *  4. CONFIGURABLE TIMEOUT: AI_TIMEOUT_MS prevents a slow Gemini call from
 *     blocking the Express event loop indefinitely.
 */

'use strict';

const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { calculateEstimate, REPAIR_DICTIONARY } = require('../utils/pricingEngine');

// ─── Configuration ────────────────────────────────────────────────────────────

/** Target model. gemini-2.5-flash is optimal: fast, multimodal, cost-effective. */
const GEMINI_MODEL  = process.env.GEMINI_MODEL  || 'gemini-2.5-flash';

/** Hard ceiling for the full Gemini round-trip (default: 20 s). */
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS, 10) || 20_000;

// ─── System Prompt ────────────────────────────────────────────────────────────

/**
 * buildSystemPrompt
 *
 * Builds the instruction block sent to Gemini as the "system" context.
 * Including the full list of valid issueCodes as a reference forces Gemini
 * to pick a code that actually exists in our pricing dictionary — this is
 * the single most important constraint to prevent hallucinated codes.
 *
 * @returns {string}
 */
const buildSystemPrompt = () => {
  // Dynamically generate the valid code list from our single source of truth.
  const validCodes = Object.keys(REPAIR_DICTIONARY).join(' | ');

  return `
You are an expert electronics repair diagnostician working for Serva, an Indian repair marketplace.

Your ONLY job is to analyse the device photo provided by the user and return a single, minified, valid JSON object — NO markdown fences, NO explanation text, NO trailing commas, nothing else.

The JSON object MUST conform EXACTLY to this TypeScript schema:
{
  "issueCode": string,       // MUST be one of the valid codes listed below
  "brand": string,           // MUST be EXACTLY one of: "Apple" | "Samsung" | "Android" | "Windows"
  "estimatedAgeYears": number, // integer or decimal; your best estimate of the device's age in years (e.g. 2, 3.5)
  "customerExplanation": string // A single, friendly, jargon-free sentence explaining the visible issue to the device owner
}

VALID issueCodes (choose the SINGLE best match):
${validCodes}

Rules:
1. If you cannot determine the brand, default to "Android" for phones/tablets or "Windows" for laptops.
2. If no specific issue code matches, use "GENERAL_DIAGNOSIS".
3. estimatedAgeYears must be a positive number. If uncertain, use 2.
4. customerExplanation must be in plain English, friendly, and start with "It looks like…".
5. Output ONLY the raw JSON object. Any other output will break the production system.
  `.trim();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * withTimeout
 *
 * Races a promise against a timeout. Rejects with a named TimeoutError so
 * the catch block can distinguish it from other failure modes.
 *
 * @param {Promise<any>} promise
 * @param {number}       ms
 * @returns {Promise<any>}
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
      // Allow the process to exit cleanly in tests even if this fires.
      if (timer.unref) timer.unref();
    }),
  ]);

/**
 * safeParseGeminiJSON
 *
 * Gemini sometimes wraps JSON in markdown code fences despite instructions.
 * This function strips common artefacts and parses safely, returning null
 * on any failure so the caller can handle it as a fallback case.
 *
 * @param {string} rawText
 * @returns {object|null}
 */
const safeParseGeminiJSON = (rawText) => {
  try {
    // Strip markdown code fences (```json … ``` or ``` … ```)
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate that required keys are present before we trust the object.
    const requiredKeys = ['issueCode', 'brand', 'estimatedAgeYears', 'customerExplanation'];
    const hasAllKeys = requiredKeys.every((k) => k in parsed);

    if (!hasAllKeys) {
      console.warn('[AI] Gemini response missing required keys:', Object.keys(parsed));
      return null;
    }

    return parsed;
  } catch (parseErr) {
    console.warn('[AI] safeParseGeminiJSON failed:', parseErr.message, '| Raw text:', rawText?.slice(0, 200));
    return null;
  }
};

/**
 * FALLBACK_PAYLOAD
 *
 * Frozen, typed sentinel returned whenever AI or pricing fails.
 * The frontend contract: check success === false && fallbackRequired === true
 * → switch to the manual issue-description form.
 */
const FALLBACK_PAYLOAD = Object.freeze({
  success:          false,
  fallbackRequired: true,
  message:          'AI analysis unavailable. Please describe the issue manually.',
});

// ─── Core Analysis Function (pure, testable, framework-agnostic) ──────────────

/**
 * analyzeDeviceImage
 *
 * Sends a device image to Gemini, parses the structured diagnosis, and
 * enriches it with a price estimate from the pricingEngine.
 *
 * @param {Buffer} imageBuffer  - Raw image bytes
 * @param {string} mimeType     - e.g. 'image/jpeg' | 'image/png' | 'image/webp'
 *
 * @returns {Promise<{
 *   issueCode:            string,
 *   brand:                string,
 *   estimatedAgeYears:    number,
 *   customerExplanation:  string,
 *   pricing:              object    // full object from calculateEstimate()
 * }>}
 *
 * @throws {Error} — Any failure: let the controller route it to FALLBACK_PAYLOAD
 */
const analyzeDeviceImage = async (imageBuffer, mimeType) => {
  // ── Guard: API key must be set in environment ─────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  // ── Initialise SDK ────────────────────────────────────────────────────────
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    // systemInstruction is the recommended way to inject a persistent system
    // prompt in the @google/generative-ai ≥ 0.12 SDK.
    systemInstruction: buildSystemPrompt(),
  });

  // ── Build the multimodal request parts ───────────────────────────────────
  const userPrompt = 'Please analyse this device photo and return the JSON diagnosis.';
  const imagePart  = {
    inlineData: {
      data:     imageBuffer.toString('base64'),
      mimeType,
    },
  };

  // ── Call Gemini with a timeout guard ──────────────────────────────────────
  const result = await withTimeout(
    model.generateContent([userPrompt, imagePart]),
    AI_TIMEOUT_MS,
  );

  const rawText = result.response.text();

  // ── Parse and validate Gemini's response ─────────────────────────────────
  const diagnosis = safeParseGeminiJSON(rawText);
  if (!diagnosis) {
    // safeParseGeminiJSON already logged the warning.
    throw new Error('Gemini returned an invalid or incomplete JSON response');
  }

  // ── Destructure with safe defaults ───────────────────────────────────────
  const {
    issueCode           = 'GENERAL_DIAGNOSIS',
    brand               = 'Android',
    estimatedAgeYears   = 2,
    customerExplanation = 'The device appears to have an issue that needs technician inspection.',
  } = diagnosis;

  // ── Calculate price estimate ───────────────────────────────────────────────
  // calculateEstimate handles unknown issueCodes by falling back to
  // GENERAL_DIAGNOSIS internally, so this call is always safe.
  const pricing = calculateEstimate(issueCode, brand, estimatedAgeYears);

  return {
    issueCode,
    brand,
    estimatedAgeYears,
    customerExplanation,
    pricing,
  };
};

// ─── Express Controller ───────────────────────────────────────────────────────

/**
 * analyzeIssue
 *
 * Express route handler for POST /api/v1/analyze-issue
 * Expects multer to have placed the uploaded file at req.file.
 *
 * SUCCESS response shape:
 * {
 *   success: true,
 *   diagnosis: {
 *     issueCode:           string,
 *     brand:               string,
 *     estimatedAgeYears:   number,
 *     customerExplanation: string,
 *     pricing: {
 *       issueCode:       string,
 *       label:           string,
 *       brandMultiplier: number,
 *       ageMultiplier:   number,
 *       servaMargin:     number,
 *       estimateMin:     number,
 *       estimateMax:     number,
 *       currency:        'INR',
 *       note:            string
 *     }
 *   }
 * }
 *
 * FALLBACK response:
 * { success: false, fallbackRequired: true, message: string }
 *
 * We deliberately do NOT call next(err) for AI/pricing failures.
 * A gracefully-degraded response is a valid business outcome, not a 500.
 */
const analyzeIssue = async (req, res, next) => {
  // ── Guard: multer must have processed a file ──────────────────────────────
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image uploaded. Please attach a photo of the device.',
    });
  }

  let imageBuffer;
  const mimeType = req.file.mimetype;

  try {
    // Read bytes from disk then remove the temp file (fire-and-forget).
    imageBuffer = fs.readFileSync(req.file.path);
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.warn('[AI] Could not delete temp file:', req.file.path, unlinkErr.message);
    });
  } catch (fileErr) {
    // If we can't even read the upload, log and degrade.
    console.error('[AI] Failed to read uploaded file:', fileErr.message);
    return res.json(FALLBACK_PAYLOAD);
  }

  try {
    const diagnosis = await analyzeDeviceImage(imageBuffer, mimeType);

    return res.json({
      success: true,
      diagnosis,
    });

  } catch (err) {
    // ── Classify error for better observability ───────────────────────────
    // All failure modes produce the same graceful fallback; the label helps
    // with log-based alerting in production.
    const label =
      err.name === 'TimeoutError'   ? 'TIMEOUT'   :
      err.name === 'SyntaxError'    ? 'PARSE_ERR' :
      err.message.includes('GEMINI_API_KEY') ? 'NO_API_KEY' :
      'UNKNOWN';

    console.error(`[AI] analyzeIssue failed [${label}] (${err.name}): ${err.message}`);

    return res.json(FALLBACK_PAYLOAD);
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  analyzeIssue,
  analyzeDeviceImage,   // exported for unit testing without HTTP layer
  FALLBACK_PAYLOAD,
  buildSystemPrompt,    // exported so tests can inspect / snapshot the prompt
};
