import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // For password recovery, redirect to account page where they can update password
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/account?tab=details&reset=true`);
  }

  return NextResponse.redirect(`${origin}/account`);
}
