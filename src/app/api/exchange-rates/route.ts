import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Public endpoint — returns current GBP-based exchange rates and rounding settings for the storefront.
 * No auth required. Rates are read from the exchange_rates table (public read RLS).
 * Rounding settings are read from currency_settings (public read RLS).
 * Also returns next_refresh_at so the client can schedule the next poll.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const [ratesRes, settingsRes] = await Promise.all([
      supabase
        .from('exchange_rates')
        .select('target_currency, rate, fetched_at, source')
        .eq('base_currency', 'GBP'),
      supabase
        .from('currency_settings')
        .select('rounding_mode, rounding_precision, refresh_interval_minutes, last_refresh_at')
        .limit(1)
        .single(),
    ]);

    const rates: Record<string, number> = {};
    let latestFetchedAt: string | null = null;

    if (!ratesRes.error && ratesRes.data) {
      ratesRes.data.forEach((r: { target_currency: string; rate: number; fetched_at: string }) => {
        rates[r.target_currency] = Number(r.rate);
        if (!latestFetchedAt || r.fetched_at > latestFetchedAt) {
          latestFetchedAt = r.fetched_at;
        }
      });
    }

    const roundingMode = settingsRes.data?.rounding_mode ?? 'round';
    const roundingPrecision = settingsRes.data?.rounding_precision ?? 0;
    const intervalMinutes = settingsRes.data?.refresh_interval_minutes ?? 60;
    const lastRefreshAt = settingsRes.data?.last_refresh_at ?? null;

    // Calculate when the next auto-refresh should happen
    const nextRefreshAt = lastRefreshAt
      ? new Date(new Date(lastRefreshAt).getTime() + intervalMinutes * 60 * 1000).toISOString()
      : null;

    return NextResponse.json(
      {
        rates,
        rounding_mode: roundingMode,
        rounding_precision: roundingPrecision,
        interval_minutes: intervalMinutes,
        last_refresh_at: lastRefreshAt,
        next_refresh_at: nextRefreshAt,
        fetched_at: latestFetchedAt,
      },
      {
        headers: {
          // Cache for 5 minutes at the CDN edge; clients re-poll based on interval
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch {
    return NextResponse.json({ rates: {}, rounding_mode: 'round', rounding_precision: 0 });
  }
}
