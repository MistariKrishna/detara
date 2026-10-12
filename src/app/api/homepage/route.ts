import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Always fetch fresh — admin banner/media changes must appear immediately
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[homepage] Missing Supabase env vars');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    };

    // Fetch all data in parallel via direct REST API — no caching so admin changes are live
    const [sectionsRes, faqsRes, categoriesRes, journalRes, collectionsRes, configRes, productsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/homepage_sections?is_active=eq.true&order=sort_order.asc`, { headers, cache: 'no-store' }),
      fetch(`${supabaseUrl}/rest/v1/homepage_faqs?is_active=eq.true&order=category.asc,sort_order.asc`, { headers, cache: 'no-store' }),
      fetch(`${supabaseUrl}/rest/v1/categories?is_active=eq.true&order=sort_order.asc&select=id,name,slug,description,image_url,is_active,sort_order`, { headers, cache: 'no-store' }),
      fetch(`${supabaseUrl}/rest/v1/journal_posts?is_published=eq.true&order=published_at.desc&limit=4&select=id,title,slug,excerpt,cover_image,category,published_at,reading_time,is_featured`, { headers, cache: 'no-store' }),
      fetch(`${supabaseUrl}/rest/v1/collections?is_active=eq.true&order=sort_order.asc&limit=6&select=id,name,slug,description,image_url,is_active,sort_order`, { headers, cache: 'no-store' }),
      fetch(`${supabaseUrl}/rest/v1/homepage_config?config_key=eq.section_order&select=config_value`, { headers, cache: 'no-store' }),
      // Single deterministic product query — is_active=true only, ordered by created_at
      fetch(
        `${supabaseUrl}/rest/v1/products?is_active=eq.true&order=created_at.asc&limit=8&select=id,name,price,image,category,slug,carat_range,certification,diamond_type,is_featured,is_bestseller`,
        { headers, cache: 'no-store' }
      ),
    ]);

    const sections: any[] = sectionsRes.ok ? await sectionsRes.json() : [];
    const faqs: any[] = faqsRes.ok ? await faqsRes.json() : [];
    const categories: any[] = categoriesRes.ok ? await categoriesRes.json() : [];
    const journalPosts: any[] = journalRes.ok ? await journalRes.json() : [];
    const collections: any[] = collectionsRes.ok ? await collectionsRes.json() : [];
    const configData: any[] = configRes.ok ? await configRes.json() : [];

    // Products query with Supabase JS client fallback on auth failure
    let featuredProducts: any[] = [];
    if (productsRes.ok) {
      const data = await productsRes.json();
      featuredProducts = Array.isArray(data) ? data : [];
    } else {
      console.error('[homepage] Product query failed:', productsRes.status, productsRes.statusText);
      // Fallback: use Supabase JS client which handles auth internally
      try {
        const supabase = createClient();
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('id,name,price,image,category,slug,carat_range,certification,diamond_type,is_featured,is_bestseller')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .limit(8);
        if (!fallbackError && Array.isArray(fallbackData)) {
          featuredProducts = fallbackData;
        } else if (fallbackError) {
          console.error('[homepage] Fallback product query failed:', fallbackError.message);
        }
      } catch (fallbackErr) {
        console.error('[homepage] Fallback product query exception:', fallbackErr);
      }
    }

    // Build sections map
    const sectionsMap: Record<string, any> = {};
    (Array.isArray(sections) ? sections : []).forEach((s: any) => {
      sectionsMap[s.section_key] = s;
    });

    const sectionOrder: string[] =
      (Array.isArray(configData) && configData[0]?.config_value?.order) ||
      (Array.isArray(sections) ? sections.map((s: any) => s.section_key) : []);

    const response = NextResponse.json({
      sections: sectionsMap,
      faqs: Array.isArray(faqs) ? faqs : [],
      featuredProducts,
      featuredCollections: Array.isArray(collections) ? collections : [],
      categories: Array.isArray(categories) ? categories : [],
      journalPosts: Array.isArray(journalPosts) ? journalPosts : [],
      sectionOrder,
    });

    // No CDN caching — admin media changes must be immediately visible
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    return response;
  } catch (error) {
    console.error('[homepage] API route error:', error);
    return NextResponse.json({ error: 'Failed to load homepage data' }, { status: 500 });
  }
}
