/**
 * utils/pricingEngine.js
 *
 * Serva Pricing Engine — Indian Consumer Electronics Repair Market
 *
 * Purpose:
 *   Provide a curated dictionary of common repair issues and a deterministic
 *   function that converts a Gemini-diagnosed issue code into a realistic INR
 *   price RANGE for the Serva marketplace.
 *
 * Formula:
 *   baseEstimate = (partCost + baseLabor) * brandMultiplier * ageMultiplier
 *   finalEstimate = baseEstimate * (1 + SERVA_MARGIN)
 *   range = { min: finalEstimate * 0.90, max: finalEstimate * 1.10 }
 *
 * All prices are in Indian Rupees (INR) and reflect mid-2025 retail rates
 * for Tier-1/Tier-2 Indian city repair shops.
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Serva's take on top of part+labour cost (15 %). Adjust via env if needed. */
const SERVA_MARGIN = parseFloat(process.env.SERVA_MARGIN) || 0.15;

/**
 * AGE_THRESHOLD_YEARS — devices older than this receive the ageMultiplier
 * discount on part costs because aftermarket/used parts are more available.
 */
const AGE_THRESHOLD_YEARS = 3;

// Brand multipliers reflect sourcing complexity and technician skill premium.
const BRAND_MULTIPLIERS = {
  Apple:   1.3,   // Genuine / high-grade aftermarket parts, certified tech premium
  Samsung: 1.1,   // Official service centre pricing influence
  Android: 1.0,   // Generic Android (Xiaomi, Realme, OPPO, Vivo, OnePlus, etc.)
  Windows: 1.0,   // Standard laptop servicing
};

/**
 * REPAIR_DICTIONARY
 *
 * Key  : issueCode  — matches the string Gemini must return (SCREAMING_SNAKE_CASE)
 * Value: { partCost, baseLabor, label }
 *
 * Costs are in INR and represent the wholesale/mid-market rate.
 * "label" is a human-readable display string used in receipts / UI.
 */
const REPAIR_DICTIONARY = {
  // ── Smartphones: Screens ──────────────────────────────────────────────────
  SCREEN_REPLACEMENT_IPHONE: {
    label:     'iPhone Screen Replacement (LCD/OLED)',
    partCost:  4500,
    baseLabor: 800,
  },
  SCREEN_REPLACEMENT_SAMSUNG: {
    label:     'Samsung Screen Replacement (AMOLED)',
    partCost:  3200,
    baseLabor: 700,
  },
  SCREEN_REPLACEMENT_XIAOMI: {
    label:     'Xiaomi / Redmi Screen Replacement',
    partCost:  1800,
    baseLabor: 500,
  },
  SCREEN_REPLACEMENT_REALME: {
    label:     'Realme Screen Replacement',
    partCost:  1700,
    baseLabor: 500,
  },
  SCREEN_REPLACEMENT_ONEPLUS: {
    label:     'OnePlus Screen Replacement (AMOLED)',
    partCost:  2800,
    baseLabor: 650,
  },
  SCREEN_REPLACEMENT_GENERIC_ANDROID: {
    label:     'Android Screen Replacement (Generic)',
    partCost:  1500,
    baseLabor: 450,
  },

  // ── Smartphones: Batteries ────────────────────────────────────────────────
  BATTERY_REPLACEMENT_IPHONE: {
    label:     'iPhone Battery Replacement',
    partCost:  1800,
    baseLabor: 400,
  },
  BATTERY_REPLACEMENT_SAMSUNG: {
    label:     'Samsung Battery Replacement',
    partCost:  1200,
    baseLabor: 350,
  },
  BATTERY_REPLACEMENT_GENERIC_ANDROID: {
    label:     'Android Battery Replacement (Generic)',
    partCost:  700,
    baseLabor: 300,
  },

  // ── Smartphones: Charging & Ports ─────────────────────────────────────────
  CHARGING_PORT_REPAIR: {
    label:     'Charging Port Repair / Replacement',
    partCost:  400,
    baseLabor: 500,
  },
  USB_BOARD_REPLACEMENT: {
    label:     'USB / Charging Board Replacement',
    partCost:  800,
    baseLabor: 600,
  },

  // ── Smartphones: Cameras ──────────────────────────────────────────────────
  CAMERA_LENS_REPLACEMENT: {
    label:     'Camera Lens / Glass Replacement',
    partCost:  600,
    baseLabor: 400,
  },
  REAR_CAMERA_REPLACEMENT: {
    label:     'Rear Camera Module Replacement',
    partCost:  1800,
    baseLabor: 600,
  },
  FRONT_CAMERA_REPLACEMENT: {
    label:     'Front Camera Module Replacement',
    partCost:  900,
    baseLabor: 500,
  },

  // ── Smartphones: Back Panel / Body ────────────────────────────────────────
  BACK_PANEL_REPLACEMENT: {
    label:     'Back Panel / Cover Replacement',
    partCost:  700,
    baseLabor: 350,
  },
  FRAME_REPLACEMENT: {
    label:     'Metal Frame / Chassis Replacement',
    partCost:  2200,
    baseLabor: 1000,
  },

  // ── Smartphones: Motherboard / IC ─────────────────────────────────────────
  MOTHERBOARD_REPAIR: {
    label:     'Motherboard-Level Repair (Micro-Soldering)',
    partCost:  500,   // consumables; labour dominates
    baseLabor: 2500,
  },
  IC_POWER_REPAIR: {
    label:     'Power IC / PMIC Replacement',
    partCost:  400,
    baseLabor: 2000,
  },

  // ── Smartphones: Audio ────────────────────────────────────────────────────
  SPEAKER_REPLACEMENT: {
    label:     'Speaker / Earpiece Replacement',
    partCost:  500,
    baseLabor: 350,
  },
  MIC_REPLACEMENT: {
    label:     'Microphone Replacement',
    partCost:  250,
    baseLabor: 400,
  },

  // ── Smartphones: Software ─────────────────────────────────────────────────
  SOFTWARE_FLASH: {
    label:     'Software Flash / OS Reinstall',
    partCost:  0,
    baseLabor: 600,
  },
  DATA_RECOVERY: {
    label:     'Data Recovery Service',
    partCost:  200,   // media cost
    baseLabor: 1500,
  },

  // ── Laptops: Display ──────────────────────────────────────────────────────
  LAPTOP_SCREEN_REPLACEMENT: {
    label:     'Laptop Screen / Display Replacement',
    partCost:  5500,
    baseLabor: 800,
  },
  LAPTOP_SCREEN_BACKLIGHT_REPAIR: {
    label:     'Laptop Screen Backlight Repair',
    partCost:  300,
    baseLabor: 1200,
  },

  // ── Laptops: Input ────────────────────────────────────────────────────────
  LAPTOP_KEYBOARD_REPLACEMENT: {
    label:     'Laptop Keyboard Replacement',
    partCost:  1800,
    baseLabor: 600,
  },
  LAPTOP_TOUCHPAD_REPLACEMENT: {
    label:     'Laptop Touchpad Replacement',
    partCost:  1200,
    baseLabor: 500,
  },

  // ── Laptops: Structural ───────────────────────────────────────────────────
  LAPTOP_HINGE_REPAIR: {
    label:     'Laptop Hinge Repair / Replacement',
    partCost:  1200,
    baseLabor: 900,
  },
  LAPTOP_CHASSIS_REPAIR: {
    label:     'Laptop Chassis / Body Repair',
    partCost:  1000,
    baseLabor: 1200,
  },

  // ── Laptops: Battery & Power ──────────────────────────────────────────────
  LAPTOP_BATTERY_REPLACEMENT: {
    label:     'Laptop Battery Replacement',
    partCost:  2800,
    baseLabor: 500,
  },
  LAPTOP_CHARGER_PORT_REPAIR: {
    label:     'Laptop DC Jack / Charger Port Repair',
    partCost:  350,
    baseLabor: 700,
  },

  // ── Laptops: Internals ────────────────────────────────────────────────────
  LAPTOP_RAM_UPGRADE: {
    label:     'Laptop RAM Upgrade',
    partCost:  3000,  // 8 GB DDR4 module mid-range
    baseLabor: 300,
  },
  LAPTOP_SSD_UPGRADE: {
    label:     'Laptop SSD Upgrade / Replacement',
    partCost:  4500,  // 512 GB SSD mid-range
    baseLabor: 350,
  },
  LAPTOP_COOLING_FAN_REPLACEMENT: {
    label:     'Laptop Cooling Fan Replacement',
    partCost:  900,
    baseLabor: 600,
  },
  LAPTOP_THERMAL_PASTE: {
    label:     'Laptop Thermal Paste Application',
    partCost:  150,
    baseLabor: 500,
  },

  // ── Laptops: Software ─────────────────────────────────────────────────────
  LAPTOP_OS_REINSTALL: {
    label:     'Windows OS Reinstall / Activation',
    partCost:  500,   // Windows key if needed
    baseLabor: 700,
  },

  // ── Tablets ───────────────────────────────────────────────────────────────
  TABLET_SCREEN_REPLACEMENT: {
    label:     'Tablet Screen Replacement',
    partCost:  3500,
    baseLabor: 900,
  },
  TABLET_BATTERY_REPLACEMENT: {
    label:     'Tablet Battery Replacement',
    partCost:  1500,
    baseLabor: 500,
  },

  // ── Generic / Fallback ────────────────────────────────────────────────────
  GENERAL_DIAGNOSIS: {
    label:     'General Diagnosis & Assessment',
    partCost:  0,
    baseLabor: 400,
  },
  WATER_DAMAGE_TREATMENT: {
    label:     'Water Damage Treatment & Cleaning',
    partCost:  500,
    baseLabor: 1500,
  },
};

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * getBrandMultiplier
 *
 * Resolves a brand string (case-insensitive) to its price multiplier.
 * Falls back to Android (1.0) for unknown brands.
 *
 * @param {string} brand
 * @returns {number}
 */
const getBrandMultiplier = (brand = '') => {
  const normalized = (brand || '').trim();
  // Direct lookup first (handles exact casing from Gemini)
  if (BRAND_MULTIPLIERS[normalized] !== undefined) {
    return BRAND_MULTIPLIERS[normalized];
  }
  // Case-insensitive fallback
  const key = Object.keys(BRAND_MULTIPLIERS).find(
    (k) => k.toLowerCase() === normalized.toLowerCase(),
  );
  return key ? BRAND_MULTIPLIERS[key] : BRAND_MULTIPLIERS.Android;
};

/**
 * getAgeMultiplier
 *
 * Devices older than AGE_THRESHOLD_YEARS years use cheaper aftermarket
 * parts, so we apply a 0.85 discount on the part cost component.
 * Labour stays at 1.0 regardless of age.
 *
 * NOTE: The multiplier is applied to partCost only, not to the labour cost,
 * which is why we return two separate values instead of a single number.
 *
 * @param {number} ageInYears
 * @returns {{ partMultiplier: number, laborMultiplier: number }}
 */
const getAgeMultiplier = (ageInYears = 0) => {
  const age = typeof ageInYears === 'number' ? ageInYears : parseFloat(ageInYears) || 0;
  return {
    partMultiplier:  age > AGE_THRESHOLD_YEARS ? 0.85 : 1.0,
    laborMultiplier: 1.0,
  };
};

/**
 * calculateEstimate
 *
 * The primary exported function. Looks up the issue in REPAIR_DICTIONARY,
 * applies dynamic multipliers, and returns a price range (INR).
 *
 * Formula:
 *   adjustedCost = (partCost * partMultiplier + baseLabor * laborMultiplier)
 *   baseEstimate = adjustedCost * brandMultiplier
 *   finalEstimate = baseEstimate * (1 + SERVA_MARGIN)
 *   range = { min: finalEstimate * 0.90, max: finalEstimate * 1.10 }
 *
 * @param {string}  issueCode    - Must match a key in REPAIR_DICTIONARY
 * @param {string}  brand        - 'Apple' | 'Samsung' | 'Android' | 'Windows'
 * @param {number}  ageInYears   - Device age in years (e.g. 2.5)
 *
 * @returns {{
 *   issueCode:       string,
 *   label:           string,
 *   brandMultiplier: number,
 *   ageMultiplier:   number,   // effective part-cost multiplier
 *   servaMargin:     number,
 *   estimateMin:     number,
 *   estimateMax:     number,
 *   currency:        'INR',
 *   note:            string
 * }}
 */
const calculateEstimate = (issueCode, brand, ageInYears) => {
  // ── 1. Resolve the issue entry; fall back gracefully ──────────────────────
  const entry = REPAIR_DICTIONARY[issueCode] || REPAIR_DICTIONARY.GENERAL_DIAGNOSIS;
  const resolvedCode = REPAIR_DICTIONARY[issueCode] ? issueCode : 'GENERAL_DIAGNOSIS';

  // ── 2. Multipliers ─────────────────────────────────────────────────────────
  const brandMul                        = getBrandMultiplier(brand);
  const { partMultiplier, laborMultiplier } = getAgeMultiplier(ageInYears);

  // ── 3. Adjusted cost (age discount applies only to parts) ─────────────────
  const adjustedPartCost  = entry.partCost  * partMultiplier;
  const adjustedLaborCost = entry.baseLabor * laborMultiplier;
  const adjustedCost      = adjustedPartCost + adjustedLaborCost;

  // ── 4. Apply brand premium ────────────────────────────────────────────────
  const baseEstimate = adjustedCost * brandMul;

  // ── 5. Apply Serva margin ──────────────────────────────────────────────────
  const finalEstimate = baseEstimate * (1 + SERVA_MARGIN);

  // ── 6. ±10 % dynamic range (rounded to nearest ₹10) ──────────────────────
  const round10 = (n) => Math.round(n / 10) * 10;
  const estimateMin = round10(finalEstimate * 0.90);
  const estimateMax = round10(finalEstimate * 1.10);

  return {
    issueCode:       resolvedCode,
    label:           entry.label,
    brandMultiplier: brandMul,
    ageMultiplier:   partMultiplier,   // expose for transparency / frontend display
    servaMargin:     SERVA_MARGIN,
    estimateMin,
    estimateMax,
    currency:        'INR',
    note: 'Final price depends on technician inspection. This is a non-binding estimate.',
  };
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  calculateEstimate,
  REPAIR_DICTIONARY,  // exported for testing & admin tooling
  BRAND_MULTIPLIERS,  // exported for frontend display
  SERVA_MARGIN,
};
