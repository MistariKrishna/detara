import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshExchangeRatesFromApi } from '@/lib/pricingEngine';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const apiKey = body.api_key as string | undefined;

    const result = await refreshExchangeRatesFromApi(apiKey);

    if (!result.success) {
      return NextResponse.json({ error: result.error, source: result.source }, { status: 502 });
    }

    return NextResponse.json({ success: true, rates: result.rates, source: result.source });
  } catch (err: unknown) {
    console.error('[refresh-exchange-rates] Error:', err);
    return NextResponse.json({ error: 'Failed to refresh exchange rates.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: rates } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', 'GBP')
      .order('target_currency');

    const { data: settings } = await supabase
      .from('currency_settings')
      .select('*')
      .limit(1)
      .single();

    return NextResponse.json({ rates: rates || [], settings: settings || null });
  } catch (err: unknown) {
    console.error('[refresh-exchange-rates GET] Error:', err);
    return NextResponse.json({ error: 'Failed to load exchange rates.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.fx_api_key !== undefined) updatePayload.fx_api_key = body.fx_api_key;
    if (body.rounding_mode) updatePayload.rounding_mode = body.rounding_mode;
    if (body.rounding_precision != null) updatePayload.rounding_precision = Number(body.rounding_precision);
    if (body.refresh_interval_minutes) updatePayload.refresh_interval_minutes = Number(body.refresh_interval_minutes);

    const { error } = await supabase
      .from('currency_settings')
      .update(updatePayload)
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[refresh-exchange-rates PATCH] Error:', err);
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 });
  }
}
