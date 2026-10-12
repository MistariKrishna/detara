'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppImage from '@/components/ui/AppImage';

interface DebugInfo {
  step: string;
  status: 'ok' | 'fail' | 'warn' | 'info';
  detail: string;
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([]);
  const [debugLoading, setDebugLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get('error');
    const blockedEmail = searchParams.get('email');
    if (err === 'unauthorized') {
      setError(
        blockedEmail
          ? `Access denied. The email "${blockedEmail}" is not in the admin list.`
          : 'Access denied. You do not have admin privileges.'
      );
    } else if (err === 'no_session') {
      setError('Session expired or not found. Please sign in again.');
    }
  }, [searchParams]);

  const runDebugCheck = async () => {
    setDebugLoading(true);
    const logs: DebugInfo[] = [];

    try {
      const supabase = createClient();

      // Step 1: Check Supabase connection
      logs.push({ step: 'Supabase URL', status: 'info', detail: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing' });

      // Step 2: Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        logs.push({ step: 'Session Check', status: 'fail', detail: `Error: ${sessionError.message}` });
      } else if (session) {
        logs.push({ step: 'Session Check', status: 'ok', detail: `Active session for: ${session.user.email}` });
      } else {
        logs.push({ step: 'Session Check', status: 'warn', detail: 'No active session — you need to sign in first' });
      }

      // Step 3: If email entered, try to sign in and check
      if (email && password) {
        logs.push({ step: 'Attempting Sign-In', status: 'info', detail: `Trying: ${email}` });
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
          logs.push({ step: 'Sign-In Result', status: 'fail', detail: `Auth failed: ${authError.message}` });
        } else if (authData.user) {
          logs.push({ step: 'Sign-In Result', status: 'ok', detail: `Authenticated as: ${authData.user.email}` });

          const userEmail = authData.user.email?.toLowerCase().trim() || '';

          // Step 4: Check hardcoded list
          const hardcoded = ['suryakiranfloral@gmail.com'];
          const inHardcoded = hardcoded.includes(userEmail);
          logs.push({
            step: 'Hardcoded Admin List',
            status: inHardcoded ? 'ok' : 'warn',
            detail: inHardcoded ? `✓ "${userEmail}" is in hardcoded admin list` : `✗ "${userEmail}" NOT in hardcoded list [${hardcoded.join(', ')}]`
          });

          // Step 5: Check admin_users table
          try {
            const { data: adminRow, error: dbError } = await supabase
              .from('admin_users')
              .select('email, is_active, role')
              .eq('email', userEmail)
              .maybeSingle();

            if (dbError) {
              logs.push({ step: 'admin_users Table', status: 'fail', detail: `DB error: ${dbError.message} (code: ${dbError.code})` });
            } else if (adminRow) {
              logs.push({
                step: 'admin_users Table',
                status: adminRow.is_active ? 'ok' : 'fail',
                detail: `Found row — email: ${adminRow.email}, is_active: ${adminRow.is_active}, role: ${adminRow.role}`
              });
            } else {
              logs.push({ step: 'admin_users Table', status: 'warn', detail: `No row found for "${userEmail}" in admin_users` });
            }
          } catch (e) {
            logs.push({ step: 'admin_users Table', status: 'fail', detail: `Exception: ${e}` });
          }

          // Step 6: Simulate what middleware will do
          const willPass = inHardcoded;
          logs.push({
            step: 'Middleware Decision',
            status: willPass ? 'ok' : 'fail',
            detail: willPass
              ? '✓ Middleware WILL allow access (hardcoded match)'
              : '✗ Middleware will BLOCK — email not in env vars or hardcoded list. Service role DB check happens server-side.'
          });
        }
      } else {
        logs.push({ step: 'Credential Check', status: 'info', detail: 'Enter email + password above and run debug again to test sign-in flow' });
      }
    } catch (e) {
      logs.push({ step: 'Debug Error', status: 'fail', detail: `Unexpected: ${e}` });
    }

    setDebugInfo(logs);
    setDebugLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError || !data.user) {
        setError(authError?.message || 'Invalid credentials. Please verify your email and password.');
        setLoading(false);
        return;
      }

      // Hard navigation so the browser sends the fresh session cookie to the server,
      // allowing middleware to read the JWT and validate admin access.
      window.location.href = '/admin';
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/login`,
      });

      if (resetError) {
        setError('Failed to send reset email. Please verify the email address.');
      } else {
        setSuccess('A password reset link has been sent to your inbox.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: DebugInfo['status']) => {
    if (s === 'ok') return 'text-emerald-400';
    if (s === 'fail') return 'text-red-400';
    if (s === 'warn') return 'text-yellow-400';
    return 'text-blue-400';
  };

  const statusIcon = (s: DebugInfo['status']) => {
    if (s === 'ok') return '✓';
    if (s === 'fail') return '✗';
    if (s === 'warn') return '⚠';
    return 'ℹ';
  };

  return (
    <div className="w-full max-w-[420px]">
      {/* Logo & Branding */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <AppImage
              src="/assets/images/file_000000004f747208abb644f0cadec060-1773492339421.png"
              alt="DETARA"
              width={200}
              height={70}
              className="object-contain h-[60px] w-auto"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C9A96E]" />
          <span className="text-[9px] font-medium tracking-[0.4em] uppercase text-[#C9A96E]">Admin Portal</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C9A96E]" />
        </div>
        <p className="text-[10px] text-[#9CA3AF] tracking-[0.2em] uppercase">Authorized Access Only</p>
      </div>

      {/* Card */}
      <div className="relative">
        <div className="absolute -inset-px bg-gradient-to-b from-[#C9A96E]/20 to-transparent rounded-sm pointer-events-none" />
        <div className="relative bg-white/95 backdrop-blur-sm border border-[rgba(201,169,110,0.2)] shadow-2xl shadow-black/10 p-8">

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="mb-2">
                <h1 className="text-base font-light text-[#1C1917] tracking-wide">Welcome back</h1>
                <p className="text-[11px] text-[#9CA3AF] mt-1">Sign in to your admin account</p>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#6B6560] uppercase tracking-[0.15em] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-4 py-3.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] focus:bg-white transition-all placeholder:text-[#C4BFB9]"
                  placeholder="admin@detara.store"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#6B6560] uppercase tracking-[0.15em] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-4 py-3.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] focus:bg-white transition-all placeholder:text-[#C4BFB9] pr-12"
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B6560] transition-colors text-xs"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setDebugMode(!debugMode)}
                  className="text-[10px] text-[#9CA3AF] hover:text-[#C9A96E] uppercase tracking-[0.1em] transition-colors"
                >
                  {debugMode ? '🔍 Hide Debug' : '🔍 Debug Mode'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); }}
                  className="text-[10px] text-[#C9A96E] hover:text-[#B8935A] uppercase tracking-[0.15em] transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 px-4 py-3">
                  <span className="text-red-500 text-sm flex-shrink-0 mt-0.5">⚠</span>
                  <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full relative bg-[#1C1917] text-white py-4 text-[10px] font-medium uppercase tracking-[0.3em] hover:bg-[#2C2927] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#C9A96E]/0 via-[#C9A96E]/10 to-[#C9A96E]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Sign In to Admin'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="mb-2">
                <h2 className="text-base font-light text-[#1C1917] tracking-wide">Reset Password</h2>
                <p className="text-[11px] text-[#9CA3AF] mt-1">Enter your admin email to receive a secure reset link.</p>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[#6B6560] uppercase tracking-[0.15em] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-[#FAFAF8] border border-[rgba(28,25,23,0.12)] px-4 py-3.5 text-sm text-[#1C1917] focus:outline-none focus:border-[#C9A96E] focus:bg-white transition-all placeholder:text-[#C4BFB9]"
                  placeholder="admin@detara.store"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 px-4 py-3">
                  <span className="text-red-500 text-sm flex-shrink-0 mt-0.5">⚠</span>
                  <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <span className="text-emerald-500 text-sm flex-shrink-0 mt-0.5">✓</span>
                  <p className="text-xs text-emerald-700 leading-relaxed">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#1C1917] text-white py-4 text-[10px] font-medium uppercase tracking-[0.3em] hover:bg-[#2C2927] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="w-full text-center text-[10px] text-[#9CA3AF] hover:text-[#6B6560] uppercase tracking-[0.15em] transition-colors py-1"
              >
                ← Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <div className="mt-4 bg-[#0D0D0D] border border-[#333] rounded p-4 font-mono text-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#C9A96E] text-[10px] uppercase tracking-widest">🔍 Auth Debug Console</span>
            <button
              type="button"
              onClick={runDebugCheck}
              disabled={debugLoading}
              className="text-[9px] bg-[#1a1a1a] border border-[#444] text-[#C9A96E] px-3 py-1 hover:bg-[#222] transition-colors disabled:opacity-50"
            >
              {debugLoading ? 'Running...' : 'Run Check'}
            </button>
          </div>

          {debugInfo.length === 0 ? (
            <p className="text-[#555] text-[10px]">Enter credentials above then click "Run Check" to diagnose login issues.</p>
          ) : (
            <div className="space-y-2">
              {debugInfo.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className={`flex-shrink-0 ${statusColor(item.status)}`}>{statusIcon(item.status)}</span>
                  <div>
                    <span className="text-[#888] text-[10px]">{item.step}: </span>
                    <span className={`text-[10px] ${statusColor(item.status)}`}>{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-[#222]">
            <p className="text-[#444] text-[9px]">Admin email hardcoded: suryakiranfloral@gmail.com</p>
            <p className="text-[#444] text-[9px]">Middleware also checks ADMIN_EMAIL env var + admin_users table</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-[#C9A96E]/60" />
          <p className="text-[9px] text-[#9CA3AF] tracking-[0.3em] uppercase">DETARA · Luxury Jewellery</p>
          <div className="w-1 h-1 rounded-full bg-[#C9A96E]/60" />
        </div>
        <p className="text-[9px] text-[#C4BFB9] tracking-wider">Secured · Encrypted · Private</p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Layered background */}
      <div className="absolute inset-0 bg-[#0F0E0D]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#2C2520_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#1A1410_0%,_transparent_50%)]" />
      {/* Subtle gold accent lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/20 to-transparent" />
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />

      <div className="relative z-10 w-full max-w-[420px]">
        <Suspense fallback={
          <div className="w-full max-w-[420px]">
            <div className="text-center mb-10">
              <div className="h-[60px] bg-white/10 rounded mx-auto w-48 animate-pulse mb-6" />
              <div className="h-3 bg-white/5 rounded mx-auto w-32 animate-pulse" />
            </div>
            <div className="bg-white/95 border border-[rgba(201,169,110,0.2)] p-8 space-y-5">
              <div className="h-12 bg-[#F4F2EE] rounded animate-pulse" />
              <div className="h-12 bg-[#F4F2EE] rounded animate-pulse" />
              <div className="h-14 bg-[#E8E4DE] rounded animate-pulse" />
            </div>
          </div>
        }>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
