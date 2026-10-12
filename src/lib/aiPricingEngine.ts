/**
 * DETARA AI Initial Pricing Engine
 *
 * Generates structured, commercially realistic Norway MSRP (NOK) for each product variant.
 * Uses rule-based + AI-assisted methodology.
 * AI suggests — Admin decides. Never auto-publishes.
 *
 * ── PRICING FORMULA (deterministic, auditable) ────────────────────────────────
 *
 * SOURCE CURRENCY: All internal prices are GBP. NOK is the Norway display currency.
 * The `price` field on the products table is a LEGACY field — its currency is
 * indeterminate (may be NOK or GBP depending on when the product was created).
 * DO NOT use product.price as a GBP input to the pricing engine.
 *
 * FORMULA (no B2B anchor):
 *   rawMsrp = categoryBase × metalMultiplier × stoneMultiplier × caratMultiplier
 *             × colorMultiplier × clarityMultiplier × settingMultiplier
 *
 * FORMULA (with B2B anchor in NOK):
 *   rawMsrp = b2bPriceNok × baseRetailMultiplier × metalMultiplier × caratMultiplier
 *             × colorMultiplier × clarityMultiplier × settingMultiplier
 *             × (1 + (stoneMultiplier - 1) × 0.3)   ← partial stone positioning only
 *
 * FORMULA (with verified GBP selling price):
 *   rawMsrp = sellingPriceGbp × gbpToNokRate × baseRetailMultiplier
 *             × metalMultiplier × caratMultiplier × colorMultiplier
 *             × clarityMultiplier × settingMultiplier
 *   NOTE: Only use this path when the caller explicitly confirms the value is GBP.
 *         Pass gbpSellingPrice separately from the legacy price field.
 *
 * MULTIPLIERS (all relative, never stacked twice):
 *   - Metal: 14K=1.0, 18K=1.15, Platinum=1.35, Silver=0.65
 *   - Stone: Moissanite=1.0, Lab-Grown=2.2, Gemstone=1.4, Natural=4.5 (absolute, not stacked)
 *   - Carat: see CARAT_MULTIPLIERS table (relative to 0.50ct = 1.0)
 *   - Color: D=1.18 … J=0.92
 *   - Clarity: FL=1.25 … I3=0.65
 *   - Setting: solitaire=1.0 … eternity=1.25
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type PriceStatus = 'draft' | 'reviewed' | 'approved' | 'manual_override' | 'locked';

export type PriceWarning =
  | 'price_too_low' |'price_too_high' |'unusual_variant_difference' |'metal_price_anomaly' |'diamond_quality_anomaly' |'carat_price_anomaly' |'b2b_above_msrp' |'final_price_below_b2b';

export type MarketPosition = 'below_market' | 'competitive' | 'premium' | 'high';

export interface VariantPricingInput {
  productId: string;
  variantId?: string | null;
  productName: string;
  category: string;
  metal?: string | null;
  diamondType?: string | null; // 'Lab-Grown Diamond' | 'Moissanite' | 'Natural Diamond' | 'Gemstone'
  carat?: string | null;       // '0.50ct' | '1.00ct' etc.
  shape?: string | null;
  settingType?: string | null;
  clarity?: string | null;     // 'VVS1' | 'VVS2' | 'VS1' | 'VS2' | 'SI1' | 'SI2'
  color?: string | null;       // 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
  b2bPriceNok?: number | null; // existing B2B price in NOK — primary anchor when available
  /**
   * IMPORTANT: Only populate this field when the value is CONFIRMED to be in GBP.
   * Do NOT pass product.price here — that field has indeterminate currency.
   * Use product.selling_price_gbp (from the GBP Pricing Engine columns) only.
   */
  verifiedSellingPriceGbp?: number | null;
  currentPriceNok?: number | null;
}

export interface PricingSettings {
  baseRetailMultiplier: number;
  premium18k: number;
  premiumPlatinum: number;
  multiplierLgd: number;
  multiplierMoissanite: number;
  multiplierGemstone: number;
  outlierLowPercent: number;
  outlierHighPercent: number;
  gbpToNokRate?: number | null;
}

export interface GeneratedPrice {
  productId: string;
  variantId?: string | null;
  aiMsrpNok: number;
  b2bPriceNok?: number | null;
  warnings: PriceWarning[];
  marketPosition: MarketPosition;
  aiReasoning: string;
  priceStatus: PriceStatus;
}

// ── Constants: Norway market reference prices (NOK) ──────────────────────────

// Base MSRP reference by category (Norway premium market positioning)
// These are the FLOOR prices used when no B2B anchor or verified GBP price is available.
const CATEGORY_BASE_NOK: Record<string, number> = {
  'engagement rings': 18000,
  'rings': 12000,
  'diamond rings': 18000,
  'wedding bands': 8000,
  'diamond bands': 10000,
  'necklaces': 9000,
  'pendants': 8000,
  'diamond pendants': 12000,
  'earrings': 7000,
  'diamond studs': 10000,
  'bracelets': 9000,
  'tennis bracelet': 22000,
  'cufflinks': 6000,
  'mens jewellery': 8000,
  'fine jewellery': 14000,
  'custom jewellery': 20000,
  'default': 10000,
};

// Carat weight multipliers (relative to 0.50ct = 1.0)
// Applied ONCE to the base price. Never applied twice.
const CARAT_MULTIPLIERS: Record<string, number> = {
  '0.10ct': 0.30,
  '0.15ct': 0.38,
  '0.20ct': 0.45,
  '0.25ct': 0.52,
  '0.30ct': 0.58,
  '0.35ct': 0.64,
  '0.40ct': 0.72,
  '0.50ct': 1.00,
  '0.60ct': 1.18,
  '0.70ct': 1.38,
  '0.75ct': 1.48,
  '0.80ct': 1.58,
  '0.90ct': 1.78,
  '1.00ct': 2.00,
  '1.10ct': 2.22,
  '1.20ct': 2.45,
  '1.25ct': 2.55,
  '1.50ct': 3.10,
  '1.75ct': 3.70,
  '2.00ct': 4.50,
  '2.50ct': 5.80,
  '3.00ct': 7.50,
  '4.00ct': 10.00,
  '5.00ct': 13.00,
};

// Color grade multipliers (D = best = highest price)
const COLOR_MULTIPLIERS: Record<string, number> = {
  'D': 1.18,
  'E': 1.12,
  'F': 1.08,
  'G': 1.04,
  'H': 1.00,
  'I': 0.96,
  'J': 0.92,
  'K': 0.88,
};

// Clarity multipliers (VVS1 = best = highest price)
const CLARITY_MULTIPLIERS: Record<string, number> = {
  'FL':   1.25,
  'IF':   1.20,
  'VVS1': 1.15,
  'VVS2': 1.10,
  'VS1':  1.05,
  'VS2':  1.00,
  'SI1':  0.94,
  'SI2':  0.88,
  'I1':   0.80,
  'I2':   0.72,
  'I3':   0.65,
};

// Setting complexity multipliers
const SETTING_MULTIPLIERS: Record<string, number> = {
  'solitaire': 1.00,
  'prong': 1.00,
  'bezel': 1.05,
  'pavé': 1.12,
  'pave': 1.12,
  'halo': 1.15,
  'three stone': 1.20,
  'three-stone': 1.20,
  'channel': 1.10,
  'tension': 1.08,
  'cluster': 1.18,
  'eternity': 1.25,
  'vintage': 1.15,
  'cathedral': 1.08,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse carat string to float. Handles "0.70ct", "0.70", "70pt" etc.
 */
function parseCarat(carat: string | null | undefined): number | null {
  if (!carat) return null;
  const cleaned = carat.toLowerCase().replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

/**
 * Normalize carat to nearest key in CARAT_MULTIPLIERS.
 */
function getCaratMultiplier(carat: string | null | undefined): number {
  const val = parseCarat(carat);
  if (!val) return 1.0;

  const keys = Object.keys(CARAT_MULTIPLIERS).map((k) => ({
    key: k,
    val: parseCarat(k) || 0,
  }));

  // Find closest
  let closest = keys[0];
  let minDiff = Math.abs(val - closest.val);
  for (const k of keys) {
    const diff = Math.abs(val - k.val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = k;
    }
  }
  return CARAT_MULTIPLIERS[closest.key] || 1.0;
}

/**
 * Get category base price (case-insensitive).
 */
function getCategoryBase(category: string): number {
  const lower = category.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_BASE_NOK)) {
    if (lower.includes(key)) return val;
  }
  return CATEGORY_BASE_NOK['default'];
}

/**
 * Apply Norway premium price psychology rounding.
 * Rounds to nearest psychologically appealing price point.
 */
export function applyPricePsychology(rawPrice: number): number {
  if (rawPrice < 3000) {
    // Round to nearest 100, ending in 90
    const base = Math.round(rawPrice / 100) * 100;
    return base - 10 > 0 ? base - 10 : base;
  } else if (rawPrice < 10000) {
    // Round to nearest 500, ending in 900 or 400
    const rounded = Math.round(rawPrice / 500) * 500;
    const candidates = [rounded - 100, rounded + 400];
    return candidates.reduce((a, b) => Math.abs(a - rawPrice) < Math.abs(b - rawPrice) ? a : b);
  } else if (rawPrice < 30000) {
    // Round to nearest 1000, ending in 900
    const base = Math.round(rawPrice / 1000) * 1000;
    return base - 100 > 0 ? base - 100 : base;
  } else if (rawPrice < 100000) {
    // Round to nearest 2500, ending in 900
    const base = Math.round(rawPrice / 2500) * 2500;
    return base - 100 > 0 ? base - 100 : base;
  } else {
    // Round to nearest 5000
    return Math.round(rawPrice / 5000) * 5000;
  }
}

/**
 * Determine market position label.
 */
function getMarketPosition(msrpNok: number, categoryBase: number): MarketPosition {
  const ratio = msrpNok / categoryBase;
  if (ratio < 0.7) return 'below_market';
  if (ratio < 1.3) return 'competitive';
  if (ratio < 2.0) return 'premium';
  return 'high';
}

/**
 * Detect pricing anomalies and return warnings.
 */
function detectWarnings(
  msrpNok: number,
  b2bNok: number | null | undefined,
  categoryBase: number,
  settings: PricingSettings,
): PriceWarning[] {
  const warnings: PriceWarning[] = [];

  const lowThreshold = categoryBase * (1 - settings.outlierLowPercent / 100);
  // High threshold: category base × (1 + outlierHighPercent%) × 3 upper bound
  const highThreshold = categoryBase * (1 + settings.outlierHighPercent / 100) * 3;

  if (msrpNok < lowThreshold) warnings.push('price_too_low');
  if (msrpNok > highThreshold) warnings.push('price_too_high');

  if (b2bNok) {
    if (b2bNok > msrpNok) warnings.push('b2b_above_msrp');
    if (msrpNok < b2bNok) warnings.push('final_price_below_b2b');
  }

  return warnings;
}

// ── Core pricing function ─────────────────────────────────────────────────────

/**
 * Generate AI-suggested Norway MSRP for a single variant.
 * Uses structured rule-based methodology — not random.
 *
 * IMPORTANT: This function never uses product.price (legacy field with indeterminate currency).
 * It uses only:
 *   1. b2bPriceNok — B2B cost in NOK (primary anchor)
 *   2. verifiedSellingPriceGbp — confirmed GBP price × gbpToNokRate (secondary anchor)
 *   3. categoryBase — Norway market reference (fallback when no anchor)
 */
export function generateVariantPrice(
  input: VariantPricingInput,
  settings: PricingSettings,
  gbpToNokRate: number = 13.8,
): GeneratedPrice {
  const reasoning: string[] = [];

  // 1. Category base (used as fallback and for warning thresholds)
  const categoryBase = getCategoryBase(input.category);
  reasoning.push(`Category base (${input.category}): NOK ${categoryBase.toLocaleString()}`);

  // 2. Determine base NOK price — priority: B2B anchor > verified GBP > category base
  let baseNok: number;
  let anchorType: 'b2b' | 'gbp' | 'category';

  if (input.b2bPriceNok && input.b2bPriceNok > 0) {
    // B2B anchor: apply retail multiplier to get MSRP floor
    baseNok = input.b2bPriceNok * settings.baseRetailMultiplier;
    anchorType = 'b2b';
    reasoning.push(`B2B anchor: NOK ${input.b2bPriceNok.toLocaleString()} × ${settings.baseRetailMultiplier} (retail multiplier) = NOK ${Math.round(baseNok).toLocaleString()}`);
  } else if (input.verifiedSellingPriceGbp && input.verifiedSellingPriceGbp > 0) {
    // Verified GBP price: convert to NOK, then apply retail multiplier
    // This path is ONLY used when the caller confirms the value is GBP.
    const nokFromGbp = input.verifiedSellingPriceGbp * gbpToNokRate;
    baseNok = nokFromGbp * settings.baseRetailMultiplier;
    anchorType = 'gbp';
    reasoning.push(`Verified GBP price: £${input.verifiedSellingPriceGbp} × ${gbpToNokRate} (GBP→NOK) = NOK ${Math.round(nokFromGbp).toLocaleString()} × ${settings.baseRetailMultiplier} (retail multiplier) = NOK ${Math.round(baseNok).toLocaleString()}`);
  } else {
    // No anchor — use category base directly
    baseNok = categoryBase;
    anchorType = 'category';
    reasoning.push(`No B2B or GBP anchor — using category base: NOK ${categoryBase.toLocaleString()}`);
  }

  // 3. Metal multiplier (applied once)
  let metalMultiplier = 1.0;
  const metalLower = (input.metal || '').toLowerCase();
  if (metalLower.includes('platinum')) {
    metalMultiplier = settings.premiumPlatinum;
    reasoning.push(`Metal: Platinum 950 × ${settings.premiumPlatinum}`);
  } else if (metalLower.includes('18k') || metalLower.includes('18 k')) {
    metalMultiplier = settings.premium18k;
    reasoning.push(`Metal: 18K Gold × ${settings.premium18k}`);
  } else if (metalLower.includes('14k') || metalLower.includes('14 k')) {
    metalMultiplier = 1.0;
    reasoning.push(`Metal: 14K Gold × 1.0 (base)`);
  } else if (metalLower.includes('silver') || metalLower.includes('925')) {
    metalMultiplier = 0.65;
    reasoning.push(`Metal: Silver × 0.65`);
  } else if (metalLower.includes('rose') || metalLower.includes('yellow')) {
    metalMultiplier = 1.0;
    reasoning.push(`Metal: ${input.metal} × 1.0`);
  }

  // 4. Stone type multiplier (applied once, absolute values — never stacked)
  // Natural Diamond multiplier is defined directly, NOT as LGD × 2.5 to avoid compounding.
  let stoneMultiplier = 1.0;
  const stoneLower = (input.diamondType || '').toLowerCase();
  if (stoneLower.includes('lab') || stoneLower.includes('lgd')) {
    stoneMultiplier = settings.multiplierLgd; // e.g. 2.20
    reasoning.push(`Stone: Lab-Grown Diamond × ${settings.multiplierLgd}`);
  } else if (stoneLower.includes('moissanite')) {
    stoneMultiplier = settings.multiplierMoissanite; // e.g. 1.00
    reasoning.push(`Stone: Moissanite × ${settings.multiplierMoissanite}`);
  } else if (stoneLower.includes('natural')) {
    // Natural diamonds are ~4.5× category base (absolute, not LGD × 2.5)
    stoneMultiplier = 4.5;
    reasoning.push(`Stone: Natural Diamond × 4.5 (absolute premium, not stacked on LGD)`);
  } else if (stoneLower.includes('gemstone') || stoneLower.includes('sapphire') || stoneLower.includes('ruby') || stoneLower.includes('emerald')) {
    stoneMultiplier = settings.multiplierGemstone; // e.g. 1.40
    reasoning.push(`Stone: Gemstone × ${settings.multiplierGemstone}`);
  }

  // 5. Carat multiplier (applied once)
  const caratMult = getCaratMultiplier(input.carat);
  if (input.carat) {
    reasoning.push(`Carat: ${input.carat} × ${caratMult.toFixed(2)}`);
  }

  // 6. Color multiplier (applied once)
  const colorMult = COLOR_MULTIPLIERS[(input.color || '').toUpperCase()] || 1.0;
  if (input.color) {
    reasoning.push(`Color: ${input.color} × ${colorMult.toFixed(2)}`);
  }

  // 7. Clarity multiplier (applied once)
  const clarityMult = CLARITY_MULTIPLIERS[(input.clarity || '').toUpperCase()] || 1.0;
  if (input.clarity) {
    reasoning.push(`Clarity: ${input.clarity} × ${clarityMult.toFixed(2)}`);
  }

  // 8. Setting complexity (applied once)
  const settingLower = (input.settingType || '').toLowerCase();
  let settingMult = 1.0;
  for (const [key, val] of Object.entries(SETTING_MULTIPLIERS)) {
    if (settingLower.includes(key)) {
      settingMult = val;
      reasoning.push(`Setting: ${input.settingType} × ${val.toFixed(2)}`);
      break;
    }
  }

  // 9. Calculate raw MSRP
  // Formula depends on anchor type:
  //   B2B anchor: B2B already reflects stone cost → apply partial stone positioning only
  //   GBP anchor: GBP price already reflects stone → apply partial stone positioning only
  //   Category base: no anchor → apply full stone multiplier
  let rawMsrp: number;

  if (anchorType === 'b2b' || anchorType === 'gbp') {
    // Anchor already reflects stone cost. Apply metal + carat + color + clarity + setting.
    // Apply a partial stone positioning premium (30% of the stone premium) for market positioning.
    const stonePositioningPremium = 1 + (stoneMultiplier - 1) * 0.3;
    rawMsrp = baseNok * metalMultiplier * caratMult * colorMult * clarityMult * settingMult * stonePositioningPremium;
    reasoning.push(`Formula (anchored): base × metal × carat × color × clarity × setting × stone_positioning(${stonePositioningPremium.toFixed(2)})`);
  } else {
    // No anchor — apply all multipliers to category base
    rawMsrp = baseNok * metalMultiplier * stoneMultiplier * caratMult * colorMult * clarityMult * settingMult;
    reasoning.push(`Formula (category base): base × metal × stone × carat × color × clarity × setting`);
  }

  reasoning.push(`Raw MSRP before psychology: NOK ${Math.round(rawMsrp).toLocaleString()}`);

  // 10. Apply price psychology
  const msrpNok = applyPricePsychology(rawMsrp);
  reasoning.push(`After price psychology rounding: NOK ${msrpNok.toLocaleString()}`);

  // 11. Detect warnings
  const warnings = detectWarnings(msrpNok, input.b2bPriceNok, categoryBase, settings);

  // 12. Market position
  const marketPosition = getMarketPosition(msrpNok, categoryBase);
  reasoning.push(`Market position: ${marketPosition}`);

  return {
    productId: input.productId,
    variantId: input.variantId,
    aiMsrpNok: msrpNok,
    b2bPriceNok: input.b2bPriceNok,
    warnings,
    marketPosition,
    aiReasoning: reasoning.join(' | '),
    priceStatus: 'draft',
  };
}

/**
 * Generate prices for a batch of variants.
 * Maintains price ladder consistency within a product family.
 */
export function generateBatchPrices(
  inputs: VariantPricingInput[],
  settings: PricingSettings,
  gbpToNokRate: number = 13.8,
): GeneratedPrice[] {
  const results = inputs.map((input) => generateVariantPrice(input, settings, gbpToNokRate));

  // Post-process: detect unusual variant differences within same product
  const byProduct = new Map<string, GeneratedPrice[]>();
  for (const r of results) {
    const arr = byProduct.get(r.productId) || [];
    arr.push(r);
    byProduct.set(r.productId, arr);
  }

  for (const [, variants] of byProduct) {
    if (variants.length < 2) continue;
    const prices = variants.map((v) => v.aiMsrpNok);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const maxDeviation = avg * 0.6; // flag if >60% deviation from average

    for (const v of variants) {
      if (Math.abs(v.aiMsrpNok - avg) > maxDeviation) {
        if (!v.warnings.includes('unusual_variant_difference')) {
          v.warnings.push('unusual_variant_difference');
        }
      }
    }
  }

  return results;
}

/**
 * Default pricing settings (used when DB settings not available).
 */
export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  baseRetailMultiplier: 1.80,
  premium18k: 1.15,
  premiumPlatinum: 1.35,
  multiplierLgd: 2.20,
  multiplierMoissanite: 1.00,
  multiplierGemstone: 1.40,
  outlierLowPercent: 30,
  outlierHighPercent: 50,
};

/**
 * Format NOK price for display.
 */
export function formatNok(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return `NOK ${amount.toLocaleString('nb-NO')}`;
}

/**
 * Warning label map for display.
 */
export const WARNING_LABELS: Record<PriceWarning, string> = {
  price_too_low: 'Price Too Low',
  price_too_high: 'Price Too High',
  unusual_variant_difference: 'Unusual Variant Difference',
  metal_price_anomaly: 'Metal Price Anomaly',
  diamond_quality_anomaly: 'Diamond Quality Anomaly',
  carat_price_anomaly: 'Carat Price Anomaly',
  b2b_above_msrp: 'B2B Above MSRP',
  final_price_below_b2b: 'Final Price Below B2B',
};

/**
 * Status label map for display.
 */
export const STATUS_LABELS: Record<PriceStatus, string> = {
  draft: 'Draft',
  reviewed: 'Reviewed',
  approved: 'Approved',
  manual_override: 'Manual Override',
  locked: 'Locked',
};

export const STATUS_COLORS: Record<PriceStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  manual_override: 'bg-purple-100 text-purple-800',
  locked: 'bg-gray-100 text-gray-800',
};
