import { NextResponse } from 'next/server';

// Dev auth bypass has been removed for production security.
// Admin authentication is now handled exclusively via Supabase Auth at /admin/login.
export async function POST() {
  return NextResponse?.json(
    { success: false, error: 'Dev auth bypass is disabled. Please use /admin/login.' },
    { status: 403 }
  );
}

export async function DELETE() {
  // Clear any legacy dev session cookie if it exists
  const response = NextResponse?.json({ success: true });
  response?.cookies?.set('dev_admin_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
