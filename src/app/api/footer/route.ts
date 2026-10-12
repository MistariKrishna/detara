import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('footer_config')
      .select('config_key, config_value');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const config: Record<string, any> = {};
    (data || []).forEach((row: { config_key: string; config_value: any }) => {
      config[row.config_key] = row.config_value;
    });

    return NextResponse.json(config, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load footer config' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    const { error } = await supabase
      .from('footer_config')
      .upsert(
        { config_key: key, config_value: value, updated_at: new Date().toISOString() },
        { onConflict: 'config_key' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update footer config' }, { status: 500 });
  }
}
