/**
 * DETARA RP (Retail Price) Pricing Engine
 *
 * Pure rule-based calculation. No AI. No multipliers. No NOK fallback.
 *
 * PRICING UNITS — all diamonds and melee are priced PER CARAT:
 *
 *   Centre Diamond  = variant.carat × rp_per_carat_gbp
 *   Multi-Stone     = (variant.carat ÷ stone_count) × stone_count × rp_per_carat_gbp
 *                   = variant.carat × rp_per_carat_gbp  (using per-stone size for lookup)
 *   Melee           = carat_per_stone × stone_count × rp_per_carat_gbp
 *   Metal           = jewellery_weight_grams × rp_per_gram_gbp
 *   Setting         = rp_gbp (fixed per jewellery type, currently £0)
 *
 * MULTI-STONE FORMULA:
 *   individual_stone_carat = variant_total_carat ÷ product_stone_count
 *   Look up rp_per_carat_gbp for that individual stone size
 *   Main Stone Cost = individual_stone_carat × stone_count × rp_per_carat_gbp
 *                   = variant_total_carat × rp_per_carat_gbp
 *
 * FORMULA:
 *   FINAL RP (GBP) =
 *     Setting RP
 *     + Centre Diamond RP          (if diamond_pricing_mode = 'centre_diamond')
 *     + Multi-Stone Diamond RP     (if diamond_pricing_mode = 'multi_stone')
 *     + Melee RP                   (if uses_melee = true)
 *     + (Weight × Metal RP/g)
 *
 * All prices are GBP. Currency conversion is handled by CurrencyContext.
 */

import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────

export type DiamondPricingMode = 'centre_diamond' | 'multi_stone' | 'none';
export type DiamondLibrary = 'natural' | 'lgd';
export type MeleeLibrary = 'natural' | 'lgd';

export interface RpNaturalDiamond {
  id: string;
  shape: string;
  carat_from: number;
  carat_to: number;
  carat_label: string;
  /** Price per carat (GBP). Multiply by variant.carat to get diamond component. */
  rp_per_carat_gbp: number;
  is_active: boolean;
  notes?: string | null;
}

export interface RpLgdDiamond {
  id: string;
  shape: string;
  carat_from: number;
  carat_to: number;
  carat_label: string;
  /** Price per carat (GBP). Multiply by variant.carat to get diamond component. */
  rp_per_carat_gbp: number;
  is_active: boolean;
  notes?: string | null;
}

export interface RpNaturalMelee {
  id: string;
  size_mm: number;
  size_label: string;
  /** Carat weight of one stone at this mm size (e.g. 0.80mm = 0.0034ct). */
  carat_per_stone: number;
  /** Price per carat (GBP). Total melee = carat_per_stone × stone_count × rp_per_carat_gbp. */
  rp_per_carat_gbp: number;
  is_active: boolean;
  notes?: string | null;
}

export interface RpLgdMelee {
  id: string;
  size_mm: number;
  size_label: string;
  /** Carat weight of one stone at this mm size (e.g. 0.80mm = 0.0034ct). */
  carat_per_stone: number;
  /** Price per carat (GBP). Total melee = carat_per_stone × stone_count × rp_per_carat_gbp. */
  rp_per_carat_gbp: number;
  is_active: boolean;
  notes?: string | null;
}

export interface RpMetal {
  id: string;
  metal_type: string;
  rp_per_gram_gbp: number;
  is_active: boolean;
  notes?: string | null;
}

export interface RpSetting {
  id: string;
  jewellery_type: string;
  rp_gbp: number;
  is_active: boolean;
  notes?: string | null;
}

export interface RpJewelleryWeight {
  id: string;
  jewellery_type: string;
  standard_weight_grams: number;
  is_active: boolean;
  notes?: string | null;
}

export interface ProductPricingConfig {
  id: string;
  product_id: string;
  jewellery_type: string;
  diamond_pricing_mode: DiamondPricingMode;
  uses_centre_diamond: boolean;
  /**
   * Shape for centre-diamond products (e.g. 'Round').
   * Used as fallback when the variant's own shape column is null.
   */
  centre_diamond_shape?: string | null;
  /**
   * Multi-stone: which diamond library to use (natural | lgd).
   * If not set, falls back to the variant's diamond_type.
   */
  multi_stone_library?: DiamondLibrary | null;
  /** Shape of each individual stone (e.g. 'Round'). */
  multi_stone_shape?: string | null;
  /**
   * PRODUCT-SPECIFIC total stone count.
   * Individual stone carat = variant.carat ÷ multi_stone_count.
   * NEVER shared between products. NEVER guessed.
   */
  multi_stone_count?: number | null;
  uses_melee: boolean;
  melee_library?: MeleeLibrary | null;
  melee_size_mm?: number | null;
  melee_stone_count?: number | null;
  weight_override_grams?: number | null;
  is_active: boolean;
}

export interface RpCalculationInput {
  config: ProductPricingConfig;
  /** Variant fields */
  metal: string;                  // e.g. '18K White Gold' → normalised to '18K'
  diamond_type?: string | null;   // 'Natural Diamond' | 'Lab-Grown Diamond'
  shape?: string | null;          // e.g. 'Round', 'Cushion'
  carat?: string | null;          // e.g. '1.00ct' or '1.00' — TOTAL carat for multi-stone
}

export interface RpCalculationBreakdown {
  setting_rp: number;
  centre_diamond_rp: number;
  multi_stone_rp: number;
  /** Carat per individual stone (variant.carat ÷ stone_count) — for display only */
  multi_stone_carat_per_stone: number;
  /** Total carat used for multi-stone calculation (= variant.carat) */
  multi_stone_total_carat: number;
  melee_rp: number;
  metal_rp: number;
  weight_used: number;
  metal_rate: number;
  /** Carat used for centre diamond calculation */
  centre_diamond_carat: number;
  /** Total melee carat (carat_per_stone × stone_count) */
  melee_total_carat: number;
  total_rp: number;
  missing_library_entries: string[];
  is_complete: boolean;
}

// ── Metal normalisation ───────────────────────────────────────
// Converts variant metal strings like '18K White Gold' → '18K'
export function normaliseMetalType(metal: string): string {
  const m = metal.trim();
  if (m.startsWith('14K')) return '14K';
  if (m.startsWith('18K')) return '18K';
  if (m.toLowerCase().includes('platinum')) return 'Platinum 950';
  return m;
}

// ── Carat normalisation ───────────────────────────────────────
// Converts '1.00ct' → 1.00
export function normaliseCarat(carat: string | null | undefined): number | null {
  if (!carat) return null;
  const n = parseFloat(carat.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

// ── Diamond lookup with nearest-match fallback ────────────────
// Primary: exact range match (carat_from <= caratNum <= carat_to)
// Fallback: nearest entry by absolute distance from carat midpoint
// This ensures multi-stone products (e.g. 0.0556ct/stone) always find a price
async function lookupDiamondRpPerCarat(
  supabase: ReturnType<typeof createClient>,
  table: 'rp_natural_diamonds' | 'rp_lgd_diamonds',
  shape: string,
  caratNum: number
): Promise<{ rp_per_carat_gbp: number; matched_carat: number } | null> {
  // 1. Try exact range match first
  const { data: exact } = await supabase
    .from(table)
    .select('rp_per_carat_gbp, carat_from, carat_to')
    .eq('shape', shape)
    .eq('is_active', true)
    .lte('carat_from', caratNum)
    .gte('carat_to', caratNum)
    .gt('rp_per_carat_gbp', 0)
    .order('carat_from', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (exact) {
    return {
      rp_per_carat_gbp: Number(exact.rp_per_carat_gbp),
      matched_carat: Number(exact.carat_from),
    };
  }

  // 2. Nearest-match fallback: find the entry whose midpoint is closest to caratNum
  // This handles multi-stone individual stone carats that fall between seeded entries
  const { data: allEntries } = await supabase
    .from(table)
    .select('rp_per_carat_gbp, carat_from, carat_to')
    .eq('shape', shape)
    .eq('is_active', true)
    .gt('rp_per_carat_gbp', 0)
    .order('carat_from', { ascending: true });

  if (!allEntries || allEntries.length === 0) return null;

  // Find nearest entry by absolute distance
  let best = allEntries[0];
  let bestDist = Math.abs(((Number(best.carat_from) + Number(best.carat_to)) / 2) - caratNum);

  for (const entry of allEntries) {
    const mid = (Number(entry.carat_from) + Number(entry.carat_to)) / 2;
    const dist = Math.abs(mid - caratNum);
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  }

  return {
    rp_per_carat_gbp: Number(best.rp_per_carat_gbp),
    matched_carat: Number(best.carat_from),
  };
}

// ── Core calculation ──────────────────────────────────────────

export async function calculateRp(input: RpCalculationInput): Promise<RpCalculationBreakdown> {
  const supabase = createClient();
  const missing: string[] = [];

  const { config, metal, diamond_type, shape, carat } = input;
  const metalKey = normaliseMetalType(metal);
  const caratNum = normaliseCarat(carat);

  // Determine diamond library from variant diamond_type
  const isLgd = (diamond_type || '').toLowerCase().includes('lab');
  const diamondLib: DiamondLibrary = isLgd ? 'lgd' : 'natural';

  // ── Setting RP ────────────────────────────────────────────
  // Setting is a fixed per-piece price (currently £0, admin-maintained)
  let settingRp = 0;
  {
    const { data } = await supabase
      .from('rp_settings')
      .select('rp_gbp')
      .eq('jewellery_type', config.jewellery_type)
      .eq('is_active', true)
      .maybeSingle();
    if (data) {
      settingRp = Number(data.rp_gbp) || 0;
    } else {
      // Try case-insensitive fallback for jewellery type
      const { data: fallback } = await supabase
        .from('rp_settings')
        .select('rp_gbp')
        .ilike('jewellery_type', config.jewellery_type)
        .eq('is_active', true)
        .maybeSingle();
      if (fallback) {
        settingRp = Number(fallback.rp_gbp) || 0;
      } else {
        // Setting RP missing is non-fatal — default to 0 and note it
        missing.push(`Setting RP for "${config.jewellery_type}" (defaulting to £0)`);
        settingRp = 0;
      }
    }
  }

  // ── Centre Diamond RP ─────────────────────────────────────
  // Centre Diamond = variant.carat × rp_per_carat_gbp
  let centreDiamondRp = 0;
  let centreDiamondCarat = 0;
  if (config.diamond_pricing_mode === 'centre_diamond' && config.uses_centre_diamond) {
    if (caratNum === null) {
      missing.push('Centre diamond carat not set on variant');
    } else {
      // Resolve shape: prefer variant shape, fall back to config centre_diamond_shape
      const resolvedShape = shape || config.centre_diamond_shape || 'Round';
      centreDiamondCarat = caratNum;
      const table = diamondLib === 'lgd' ? 'rp_lgd_diamonds' : 'rp_natural_diamonds';

      const result = await lookupDiamondRpPerCarat(supabase, table, resolvedShape, caratNum);
      if (result) {
        // MAIN STONE COST = variant.carat × rp_per_carat_gbp
        // Do NOT divide. The library price is already per-carat.
        centreDiamondRp = result.rp_per_carat_gbp * caratNum;
      } else {
        missing.push(
          `No matching ${diamondLib === 'lgd' ? 'LGD' : 'Natural'} Diamond price for ${resolvedShape} ${carat} — check Diamond Library has an active entry covering this carat range`
        );
      }
    }
  }

  // ── Multi-Stone Diamond RP ────────────────────────────────
  //
  // FORMULA:
  //   individual_stone_carat = variant_total_carat ÷ product_stone_count
  //   Look up rp_per_carat_gbp for that individual stone size (nearest match)
  //   Main Stone Cost = individual_stone_carat × stone_count × rp_per_carat_gbp
  //                   = variant_total_carat × rp_per_carat_gbp
  //
  // The admin specifies the product-specific stone count.
  // The individual stone carat is DERIVED from the variant's total carat — never hardcoded.
  //
  let multiStoneRp = 0;
  let multiStoneCaratPerStone = 0;
  let multiStoneTotalCarat = 0;

  if (config.diamond_pricing_mode === 'multi_stone' && config.multi_stone_count && caratNum !== null) {
    const stoneCount = config.multi_stone_count;
    // Derive individual stone carat from variant total carat
    const stoneCarat = caratNum / stoneCount;
    multiStoneCaratPerStone = stoneCarat;
    multiStoneTotalCarat = caratNum; // total = variant carat

    const lib = config.multi_stone_library || diamondLib;
    const table = lib === 'lgd' ? 'rp_lgd_diamonds' : 'rp_natural_diamonds';
    const stoneShape = config.multi_stone_shape || shape || 'Round';

    // Use nearest-match lookup — individual stone carats are often between seeded entries
    const result = await lookupDiamondRpPerCarat(supabase, table, stoneShape, stoneCarat);

    if (result) {
      // Main Stone Cost = total_carat × rp_per_carat_gbp
      // (equivalent to: stoneCarat × stoneCount × rp_per_carat_gbp)
      multiStoneRp = result.rp_per_carat_gbp * caratNum;
    } else {
      missing.push(
        `${lib === 'lgd' ? 'LGD' : 'Natural'} Diamond RP/ct for ${stoneShape} ${stoneCarat.toFixed(4)}ct/stone ` +
        `(${caratNum}ct total ÷ ${stoneCount} stones) — add entries to Diamond Library`
      );
    }
  } else if (config.diamond_pricing_mode === 'multi_stone' && !config.multi_stone_count) {
    missing.push('Stone count not configured — required for multi-stone pricing');
  }

  // ── Melee RP ──────────────────────────────────────────────
  // Melee = carat_per_stone × stone_count × rp_per_carat_gbp
  let meleeRp = 0;
  let meleeTotalCarat = 0;
  if (config.uses_melee && config.melee_stone_count && config.melee_size_mm) {
    const table = config.melee_library === 'lgd' ? 'rp_lgd_melee' : 'rp_natural_melee';
    const { data } = await supabase
      .from(table)
      .select('carat_per_stone, rp_per_carat_gbp')
      .eq('size_mm', config.melee_size_mm)
      .eq('is_active', true)
      .maybeSingle();
    if (data) {
      const caratPerStone = Number(data.carat_per_stone) || 0;
      const rpPerCarat = Number(data.rp_per_carat_gbp) || 0;
      meleeTotalCarat = caratPerStone * config.melee_stone_count;
      meleeRp = meleeTotalCarat * rpPerCarat;
    } else {
      missing.push(`${config.melee_library === 'lgd' ? 'LGD' : 'Natural'} Melee RP/ct for ${config.melee_size_mm}mm`);
    }
  }

  // ── Metal RP ──────────────────────────────────────────────
  // Metal = jewellery_weight_grams × rp_per_gram_gbp
  let metalRp = 0;
  let weightUsed = 0;
  let metalRate = 0;
  {
    // Get metal rate
    const { data: metalData } = await supabase
      .from('rp_metals')
      .select('rp_per_gram_gbp')
      .eq('metal_type', metalKey)
      .eq('is_active', true)
      .maybeSingle();

    if (metalData) {
      metalRate = Number(metalData.rp_per_gram_gbp) || 0;
    } else {
      missing.push(`Metal RP for "${metalKey}"`);
    }

    // Get weight
    if (config.weight_override_grams) {
      weightUsed = Number(config.weight_override_grams);
    } else {
      const { data: weightData } = await supabase
        .from('rp_jewellery_weights')
        .select('standard_weight_grams')
        .eq('jewellery_type', config.jewellery_type)
        .eq('is_active', true)
        .maybeSingle();
      if (weightData) {
        weightUsed = Number(weightData.standard_weight_grams) || 0;
      } else {
        // Try case-insensitive fallback
        const { data: weightFallback } = await supabase
          .from('rp_jewellery_weights')
          .select('standard_weight_grams')
          .ilike('jewellery_type', config.jewellery_type)
          .eq('is_active', true)
          .maybeSingle();
        if (weightFallback) {
          weightUsed = Number(weightFallback.standard_weight_grams) || 0;
        } else {
          missing.push(`Standard weight for "${config.jewellery_type}"`);
        }
      }
    }

    metalRp = weightUsed * metalRate;
  }

  const totalRp = settingRp + centreDiamondRp + multiStoneRp + meleeRp + metalRp;

  // Filter out non-fatal "defaulting to £0" messages from is_complete check
  const fatalMissing = missing.filter(m => !m.includes('defaulting to £0'));

  return {
    setting_rp: settingRp,
    centre_diamond_rp: centreDiamondRp,
    multi_stone_rp: multiStoneRp,
    multi_stone_carat_per_stone: multiStoneCaratPerStone,
    multi_stone_total_carat: multiStoneTotalCarat,
    melee_rp: meleeRp,
    metal_rp: metalRp,
    weight_used: weightUsed,
    metal_rate: metalRate,
    centre_diamond_carat: centreDiamondCarat,
    melee_total_carat: meleeTotalCarat,
    total_rp: totalRp,
    missing_library_entries: missing,
    is_complete: fatalMissing.length === 0 && totalRp > 0,
  };
}

// ── Batch calculation for all variants of a product ──────────

export interface VariantRpResult {
  variant_id: string;
  metal: string;
  diamond_type: string | null;
  shape: string | null;
  carat: string | null;
  breakdown: RpCalculationBreakdown;
}

export async function calculateRpForAllVariants(
  productId: string,
  config: ProductPricingConfig
): Promise<VariantRpResult[]> {
  const supabase = createClient();
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, metal, diamond_type, carat, shape, setting_type')
    .eq('product_id', productId)
    .eq('is_enabled', true);

  if (!variants || variants.length === 0) return [];

  const results: VariantRpResult[] = [];
  for (const v of variants) {
    const breakdown = await calculateRp({
      config,
      metal: v.metal || '',
      diamond_type: v.diamond_type,
      shape: v.shape,
      carat: v.carat,
    });
    results.push({
      variant_id: v.id,
      metal: v.metal || '',
      diamond_type: v.diamond_type,
      shape: v.shape,
      carat: v.carat,
      breakdown,
    });
  }
  return results;
}

// ── Apply calculated RP to variants ──────────────────────────

export async function applyRpToVariants(
  results: VariantRpResult[],
  changedBy: string | null
): Promise<{ applied: number; errors: string[] }> {
  const supabase = createClient();
  let applied = 0;
  const errors: string[] = [];

  for (const r of results) {
    if (!r.breakdown.is_complete || r.breakdown.total_rp <= 0) continue;
    const newPrice = Math.round(r.breakdown.total_rp * 100) / 100;

    // Read current price for history
    const { data: current } = await supabase
      .from('product_variants')
      .select('selling_price_gbp, product_id')
      .eq('id', r.variant_id)
      .maybeSingle();

    const { error } = await supabase
      .from('product_variants')
      .update({ selling_price_gbp: newPrice })
      .eq('id', r.variant_id);

    if (error) {
      errors.push(`Variant ${r.variant_id}: ${error.message}`);
      continue;
    }

    // Log to price_history
    await supabase.from('price_history').insert({
      product_id: current?.product_id || null,
      variant_id: r.variant_id,
      field_changed: 'selling_price_gbp',
      old_value: current?.selling_price_gbp != null ? String(current.selling_price_gbp) : null,
      new_value: String(newPrice),
      change_type: 'rp_library',
      changed_by: changedBy,
      reason: 'RP Pricing Engine calculation',
    });

    applied++;
  }

  return { applied, errors };
}

// ── Fetch all library data (for admin UI) ─────────────────────

export async function fetchAllLibraryData() {
  const supabase = createClient();
  const results = await Promise.all([
    supabase.from('rp_natural_diamonds').select('*').order('shape').order('carat_from'),
    supabase.from('rp_lgd_diamonds').select('*').order('shape').order('carat_from'),
    supabase.from('rp_natural_melee').select('*').order('size_mm'),
    supabase.from('rp_lgd_melee').select('*').order('size_mm'),
    supabase.from('rp_metals').select('*').order('metal_type'),
    supabase.from('rp_settings').select('*').order('jewellery_type'),
    supabase.from('rp_jewellery_weights').select('*').order('jewellery_type'),
  ]);

  const [
    naturalDiamondsResult,
    lgdDiamondsResult,
    naturalMeleeResult,
    lgdMeleeResult,
    metalsResult,
    settingsResult,
    weightsResult,
  ] = results;

  return {
    naturalDiamonds: (naturalDiamondsResult.data || []) as RpNaturalDiamond[],
    lgdDiamonds: (lgdDiamondsResult.data || []) as RpLgdDiamond[],
    naturalMelee: (naturalMeleeResult.data || []) as RpNaturalMelee[],
    lgdMelee: (lgdMeleeResult.data || []) as RpLgdMelee[],
    metals: (metalsResult.data || []) as RpMetal[],
    settings: (settingsResult.data || []) as RpSetting[],
    weights: (weightsResult.data || []) as RpJewelleryWeight[],
  };
}
