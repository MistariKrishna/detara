import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Canonical master category IDs from the DETARA master catalog
const MASTER_CAT_IDS = new Set([
  '11111111-0001-0001-0001-000000000001', // Rings
  '11111111-0001-0001-0001-000000000002', // Earrings
  '11111111-0001-0001-0001-000000000003', // Necklaces & Pendants
  '11111111-0001-0001-0001-000000000004', // Bracelets
  '11111111-0001-0001-0001-000000000005', // Men's Jewellery
  '11111111-0001-0001-0001-000000000006', // Gemstone Jewellery
]);

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ categories: [], subcategories: [] }, { status: 500 });
    }

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    };

    const res = await fetch(
      `${supabaseUrl}/rest/v1/categories?select=*&is_active=eq.true&order=sort_order.asc`,
      { headers, cache: 'no-store' }
    );

    if (!res.ok) {
      return NextResponse.json({ categories: [], subcategories: [] }, { status: 500 });
    }

    const all = await res.json();
    if (!Array.isArray(all)) {
      return NextResponse.json({ categories: [], subcategories: [] });
    }

    // Master categories = exactly the 6 canonical UUIDs
    const categories = all
      .filter((c: any) => MASTER_CAT_IDS.has(c.id))
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    // Subcategories = those whose parent_id is one of the 6 master IDs
    const subcategories = all
      .filter((c: any) => c.parent_id && MASTER_CAT_IDS.has(c.parent_id))
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    return NextResponse.json({ categories, subcategories });
  } catch (error) {
    console.error('[categories] API error:', error);
    return NextResponse.json({ categories: [], subcategories: [] }, { status: 500 });
  }
}
