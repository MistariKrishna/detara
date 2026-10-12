/**
 * DETARA Centralized Pricing Engine
 *
 * - GBP is the internal base currency for all pricing
 * - Exchange rates are fetched from a live FX API and cached in Supabase
 * - Customer-facing prices are derived from selling_price_gbp × live rate
 * - Internal cost/profit/margin fields are NEVER exposed to customers
 *
 * ── CURRENCY ARCHITECTURE ────────────────────────────────────────────────────
 * Source currency: GBP (all selling_price_gbp, cost_price_gbp, compare_price_gbp fields)
 * Display currencies: GBP, EUR, USD, NOK (converted from GBP using live rates)
 * Legacy field: products.price — indeterminate currency (may be NOK or GBP depending
 *   on import source). DO NOT use products.price as a GBP input to pricing calculations.
 *   Use selling_price_gbp instead.
 * Norway MSRP: stored in NOK in variant_prices.final_msrp_nok
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@/lib/supabase/server';

export type SupportedCurrency = 'GBP' | 'EUR' | 'USD' | 'NOK';

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
  NOK: 'kr',
};

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  GBP: 'GBP £',
  EUR: 'EUR €',
  USD: 'USD $',
  NOK: 'NOK kr',
};

export interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  fetched_at: string;
  source: string;
}

export interface PricingCalculation {
  cost_price_gbp: number | null;
  selling_price_gbp: number | null;
  compare_price_gbp: number | null;
  sale_price_gbp: number | null;
  profit_amount_gbp: number | null;
  profit_margin_percent: number | null;
  markup_percent: number | null;
}

export interface AdditionalCosts {
  shipping_cost_gbp: number;
  gateway_fee_percent: number;
  vat_rate_percent: number;
  other_cost_gbp: number;
}

export interface FullProfitMetrics {
  // Gross (selling - cost only)
  gross_profit_gbp: number;
  gross_margin_percent: number;
  markup_percent: number;
  // Additional costs breakdown
  shipping_cost_gbp: number;
  gateway_fee_gbp: number;
  vat_amount_gbp: number;
  other_cost_gbp: number;
  total_additional_costs_gbp: number;
  // Net (after all costs)
  net_profit_gbp: number;
  net_margin_percent: number;
  // VAT display
  price_before_vat_gbp: number;
  customer_price_incl_vat_gbp: number;
  is_profitable: boolean;
}

export interface ExchangeRateResult {
  rates: Record<SupportedCurrency, number>;
  source: 'live' | 'db_cache' | 'fallback';
  fetchedAt: string | null;
  isStale: boolean;
  staleSinceMinutes: number | null;
}

// ── In-memory rate cache (server-side, refreshed per request cycle) ──────────
let rateCache: Record<string, number> = {};
let rateCacheTime = 0;
let rateCacheSource: 'live' | 'db_cache' | 'fallback' = 'fallback';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache

// Hardcoded fallback rates — used ONLY when DB is unavailable.
// These are approximate and should never be used as the permanent pricing source.
const FALLBACK_RATES: Record<SupportedCurrency, number> = {
  GBP: 1,
  EUR: 1.17,
  USD: 1.27,
  NOK: 13.8,
};

/**
 * Get exchange rates from Supabase cache (which is refreshed by the FX API cron).
 * Falls back to hardcoded approximate rates if DB is unavailable.
 * Returns rates AND metadata about source/staleness.
 */
export async function getExchangeRatesWithMeta(): Promise<ExchangeRateResult> {
  const now = Date.now();
  if (Object.keys(rateCache).length > 0 && now - rateCacheTime < CACHE_TTL_MS) {
    return {
      rates: rateCache as Record<SupportedCurrency, number>,
      source: rateCacheSource,
      fetchedAt: new Date(rateCacheTime).toISOString(),
      isStale: false,
      staleSinceMinutes: null,
    };
  }

  try {
    const supabase = await createClient();
    const [ratesRes, settingsRes] = await Promise.all([
      supabase
        .from('exchange_rates')
        .select('target_currency, rate, fetched_at, source')
        .eq('base_currency', 'GBP'),
      supabase
        .from('currency_settings')
        .select('refresh_interval_minutes, last_refresh_at')
        .limit(1)
        .maybeSingle(),
    ]);

    if (!ratesRes.error && ratesRes.data && ratesRes.data.length > 0) {
      const rates: Record<string, number> = {};
      let latestFetchedAt: string | null = null;
      let latestSource = 'db_cache';

      ratesRes.data.forEach((r: { target_currency: string; rate: number; fetched_at: string; source: string }) => {
        rates[r.target_currency] = Number(r.rate);
        if (!latestFetchedAt || r.fetched_at > latestFetchedAt) {
          latestFetchedAt = r.fetched_at;
          latestSource = r.source;
        }
      });

      // Determine if rates are stale
      const intervalMinutes = settingsRes.data?.refresh_interval_minutes ?? 60;
      const lastRefreshAt = settingsRes.data?.last_refresh_at ?? latestFetchedAt;
      let isStale = false;
      let staleSinceMinutes: number | null = null;

      if (lastRefreshAt) {
        const ageMs = Date.now() - new Date(lastRefreshAt).getTime();
        const intervalMs = intervalMinutes * 60 * 1000;
        isStale = ageMs > intervalMs * 1.5; // stale if 50% past refresh interval
        if (isStale) {
          staleSinceMinutes = Math.round((ageMs - intervalMs) / 60000);
        }
      }

      // Determine source label
      const isLiveSource = latestSource === 'exchangerate-api' || latestSource === 'open.er-api';
      const resolvedSource: 'live' | 'db_cache' | 'fallback' = isLiveSource ? 'live' : 'db_cache';

      rateCache = rates;
      rateCacheTime = now;
      rateCacheSource = resolvedSource;

      return {
        rates: rates as Record<SupportedCurrency, number>,
        source: resolvedSource,
        fetchedAt: latestFetchedAt,
        isStale,
        staleSinceMinutes,
      };
    }
  } catch {
    // Fall through to fallback
  }

  // Fallback rates — DB unavailable
  rateCache = { ...FALLBACK_RATES };
  rateCacheTime = now;
  rateCacheSource = 'fallback';

  return {
    rates: FALLBACK_RATES,
    source: 'fallback',
    fetchedAt: null,
    isStale: true,
    staleSinceMinutes: null,
  };
}

/**
 * Get exchange rates from Supabase cache.
 * Simple version — returns rates only (for backward compatibility).
 */
export async function getExchangeRates(): Promise<Record<SupportedCurrency, number>> {
  const result = await getExchangeRatesWithMeta();
  return result.rates;
}

/**
 * Convert a GBP amount to the target currency using cached rates.
 * Applies configurable rounding (default: round to nearest integer).
 */
export function convertGbpTo(
  gbpAmount: number,
  rate: number,
  roundingMode: 'round' | 'floor' | 'ceil' = 'round',
  precision = 0,
): number {
  const raw = gbpAmount * rate;
  const factor = Math.pow(10, precision);
  if (roundingMode === 'floor') return Math.floor(raw * factor) / factor;
  if (roundingMode === 'ceil') return Math.ceil(raw * factor) / factor;
  return Math.round(raw * factor) / factor;
}

/**
 * Format a price for display in the given currency.
 */
export function formatCurrencyAmount(amount: number, currency: SupportedCurrency): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  if (currency === 'NOK') return `${formatted} ${symbol}`;
  return `${symbol}${formatted}`;
}

/**
 * Calculate basic profit metrics (gross only) from raw pricing inputs.
 * Used for admin display only — never exposed to customers.
 */
export function calculateProfitMetrics(
  costPriceGbp: number | null,
  sellingPriceGbp: number | null,
): {
  profit_amount_gbp: number | null;
  profit_margin_percent: number | null;
  markup_percent: number | null;
} {
  if (costPriceGbp === null || sellingPriceGbp === null) {
    return { profit_amount_gbp: null, profit_margin_percent: null, markup_percent: null };
  }
  const profit = sellingPriceGbp - costPriceGbp;
  const margin = sellingPriceGbp > 0 ? (profit / sellingPriceGbp) * 100 : null;
  const markup = costPriceGbp > 0 ? (profit / costPriceGbp) * 100 : null;
  return {
    profit_amount_gbp: Math.round(profit * 100) / 100,
    profit_margin_percent: margin !== null ? Math.round(margin * 100) / 100 : null,
    markup_percent: markup !== null ? Math.round(markup * 100) / 100 : null,
  };
}

/**
 * Calculate full profit metrics including VAT and additional costs.
 * Admin-only — never exposed to customers.
 *
 * @param costPriceGbp - Internal production/acquisition cost
 * @param sellingPriceGbp - Customer selling price (excl. VAT)
 * @param additionalCosts - Shipping, gateway fee %, VAT rate %, other costs
 */
export function calculateFullProfitMetrics(
  costPriceGbp: number,
  sellingPriceGbp: number,
  additionalCosts: Partial<AdditionalCosts> = {},
): FullProfitMetrics {
  const {
    shipping_cost_gbp = 0,
    gateway_fee_percent = 0,
    vat_rate_percent = 0,
    other_cost_gbp = 0,
  } = additionalCosts;

  // Gross profit (selling - cost only)
  const gross_profit_gbp = sellingPriceGbp - costPriceGbp;
  const gross_margin_percent = sellingPriceGbp > 0 ? (gross_profit_gbp / sellingPriceGbp) * 100 : 0;
  const markup_percent = costPriceGbp > 0 ? (gross_profit_gbp / costPriceGbp) * 100 : 0;

  // Additional costs
  const gateway_fee_gbp = sellingPriceGbp * (gateway_fee_percent / 100);
  const vat_amount_gbp = sellingPriceGbp * (vat_rate_percent / 100);
  const total_additional_costs_gbp = shipping_cost_gbp + gateway_fee_gbp + other_cost_gbp;

  // Net profit (gross profit minus all additional costs, VAT is not our profit)
  const net_profit_gbp = gross_profit_gbp - total_additional_costs_gbp;
  const net_margin_percent = sellingPriceGbp > 0 ? (net_profit_gbp / sellingPriceGbp) * 100 : 0;

  // VAT display
  const price_before_vat_gbp = sellingPriceGbp;
  const customer_price_incl_vat_gbp = sellingPriceGbp + vat_amount_gbp;

  return {
    gross_profit_gbp: Math.round(gross_profit_gbp * 100) / 100,
    gross_margin_percent: Math.round(gross_margin_percent * 100) / 100,
    markup_percent: Math.round(markup_percent * 100) / 100,
    shipping_cost_gbp: Math.round(shipping_cost_gbp * 100) / 100,
    gateway_fee_gbp: Math.round(gateway_fee_gbp * 100) / 100,
    vat_amount_gbp: Math.round(vat_amount_gbp * 100) / 100,
    other_cost_gbp: Math.round(other_cost_gbp * 100) / 100,
    total_additional_costs_gbp: Math.round(total_additional_costs_gbp * 100) / 100,
    net_profit_gbp: Math.round(net_profit_gbp * 100) / 100,
    net_margin_percent: Math.round(net_margin_percent * 100) / 100,
    price_before_vat_gbp: Math.round(price_before_vat_gbp * 100) / 100,
    customer_price_incl_vat_gbp: Math.round(customer_price_incl_vat_gbp * 100) / 100,
    is_profitable: net_profit_gbp >= 0,
  };
}

/**
 * Refresh exchange rates from the live FX API and store in Supabase.
 * Called by the admin Currency Settings page and the refresh API route.
 *
 * FX Rate Sources (in priority order):
 *   1. exchangerate-api.com (authenticated, with API key) — most reliable
 *   2. open.er-api.com (unauthenticated, free tier) — fallback when no API key
 *   3. FALLBACK_RATES (hardcoded) — only used when both live sources fail
 *
 * The source field in exchange_rates table indicates which source was used:
 *   'exchangerate-api' — live, authenticated *'open.er-api'— live, unauthenticated *'seed'             — initial migration values (stale)
 *   'fallback'         — hardcoded emergency fallback
 */
export async function refreshExchangeRatesFromApi(apiKey?: string): Promise<{
  success: boolean;
  rates?: Record<string, number>;
  error?: string;
  source: string;
}> {
  const currencies = ['EUR', 'USD', 'NOK', 'GBP'];

  // Try exchangerate-api.com (free tier available)
  try {
    const key = apiKey || process.env.FX_API_KEY || '';
    let url: string;

    if (key) {
      url = `https://v6.exchangerate-api.com/v6/${key}/latest/GBP`;
    } else {
      // Open access endpoint (limited but functional)
      url = `https://open.er-api.com/v6/latest/GBP`;
    }

    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`FX API responded with ${res.status}`);

    const json = await res.json();
    const conversionRates = json.rates || json.conversion_rates;
    if (!conversionRates) throw new Error('No rates in FX API response');

    const rates: Record<string, number> = { GBP: 1 };
    currencies.forEach((c) => {
      if (conversionRates[c]) rates[c] = Number(conversionRates[c]);
    });

    // Persist to Supabase
    const supabase = await createClient();
    const now = new Date().toISOString();
    const sourceLabel = key ? 'exchangerate-api' : 'open.er-api';
    const upserts = Object.entries(rates).map(([target, rate]) => ({
      base_currency: 'GBP',
      target_currency: target,
      rate,
      source: sourceLabel,
      fetched_at: now,
    }));

    await supabase
      .from('exchange_rates')
      .upsert(upserts, { onConflict: 'base_currency,target_currency' });

    // Update currency_settings last_refresh
    await supabase
      .from('currency_settings')
      .update({ last_refresh_at: now, last_refresh_status: 'success', updated_at: now })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    // Bust in-memory cache
    rateCache = {};
    rateCacheTime = 0;

    return { success: true, rates, source: sourceLabel };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    // Log failure to currency_settings
    try {
      const supabase = await createClient();
      await supabase
        .from('currency_settings')
        .update({ last_refresh_status: `error: ${msg}`, updated_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000');
    } catch { /* ignore */ }

    return { success: false, error: msg, source: 'none' };
  }
}

/**
 * Get the effective customer-facing price for a product/variant in GBP.
 * Priority: sale_price_gbp → selling_price_gbp → null
 */
export function getEffectiveSellingPriceGbp(pricing: {
  selling_price_gbp?: number | null;
  sale_price_gbp?: number | null;
}): number | null {
  if (pricing.sale_price_gbp && pricing.sale_price_gbp > 0) return pricing.sale_price_gbp;
  if (pricing.selling_price_gbp && pricing.selling_price_gbp > 0) return pricing.selling_price_gbp;
  return null;
}
