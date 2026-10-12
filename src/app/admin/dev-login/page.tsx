'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Dev login bypass has been removed for production security.
// This page now redirects to the proper Supabase auth login.
export default function DevLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router?.replace('/admin/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <p className="text-sm text-[#9CA3AF]">Redirecting to admin login...</p>
    </div>
  );
}
