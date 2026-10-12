import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const response = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            sameSite: 'none',
            secure: true,
          });
        });
      },
    },
  });

  // 1. Dynamic 301 Redirect: /products?category_id={uuid} -> /categories/{slug}
  if (pathname === '/products' && searchParams.has('category_id')) {
    const categoryId = searchParams.get('category_id');

    if (categoryId) {
      // Query Supabase dynamically for the matching category slug
      const { data: category } = await supabase
        .from('categories') // Replace with your actual database table name if different
        .select('slug')
        .eq('id', categoryId)
        .maybeSingle();

      if (category?.slug) {
        const url = request.nextUrl.clone();
        url.pathname = `/categories/${category.slug}`;
        url.searchParams.delete('category_id');
        return NextResponse.redirect(url, { status: 301 });
      }
    }
  }

  // 2. 301 Redirect: /products?category={slug} -> /categories/{slug}
  if (pathname === '/products' && searchParams.has('category')) {
    const categorySlug = searchParams.get('category');
    if (categorySlug) {
      const url = request.nextUrl.clone();
      url.pathname = `/categories/${categorySlug}`;
      url.searchParams.delete('category');
      return NextResponse.redirect(url, { status: 301 });
    }
  }

  // Skip auth check for non-admin public routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Admin auth check for /admin routes
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return response;
}