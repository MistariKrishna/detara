import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshExchangeRatesFromApi } from '@/lib/pricingEngine';

/**
 * GET /api/cron/refresh-exchange-rates
 *
 * Checks whether the configured refresh interval has elapsed since the last
 * successful FX rate fetch. If yes, fetches live rates and stores them in
 * Supabase. If no, returns the current cached rates without calling the FX API.
 *
 * This route is designed to be called:
 *  - By a Vercel Cron Job (vercel.json)
 *  - By the CurrencyContext on the client (lightweight poll)
 *  - Manually from the admin Currency page
 *
 * Auth: accepts an optional CRON_SECRET header for scheduled calls.
 * Public GET is allowed so the storefront can trigger it safely.
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: validate cron secret for scheduled calls
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    const isCronCall = cronSecret && authHeader === `Bearer ${cronSecret}`;

    const supabase = await createClient();

    // Load currency settings to check interval and last refresh time
    const { data: settings, error: settingsError } = await supabase
      .from('currency_settings')
      .select('refresh_interval_minutes, last_refresh_at, last_refresh_status, fx_api_key')
      .limit(1)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json({ skipped: true, reason: 'No currency settings found' });
    }

    const intervalMs = (settings.refresh_interval_minutes || 60) * 60 * 1000;
    const lastRefresh = settings.last_refresh_at ? new Date(settings.last_refresh_at).getTime() : 0;
    const now = Date.now();
    const elapsed = now - lastRefresh;
    const nextRefreshAt = new Date(lastRefresh + intervalMs).toISOString();

    // If interval has not elapsed yet (and this is not a forced cron call), skip
    const forceRefresh = request.nextUrl.searchParams.get('force') === '1';
    if (!forceRefresh && !isCronCall && elapsed < intervalMs) {
      return NextResponse.json({
        skipped: true,
        reason: 'Interval not elapsed',
        next_refresh_at: nextRefreshAt,
        last_refresh_at: settings.last_refresh_at,
        interval_minutes: settings.refresh_interval_minutes,
      });
    }

    // Fetch live rates
    const result = await refreshExchangeRatesFromApi(settings.fx_api_key || undefined);

    if (!result.success) {
      return NextResponse.json(
        {
          refreshed: false,
          error: result.error,
          source: result.source,
          last_refresh_at: settings.last_refresh_at,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      refreshed: true,
      rates: result.rates,
      source: result.source,
      refreshed_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[cron/refresh-exchange-rates] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
