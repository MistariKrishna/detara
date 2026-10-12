'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { productionService, ProductionJob } from '@/lib/supabase/productionService';

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function QCDashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: adminData } = await supabase.from('admin_users').select('id').eq('user_id', user.id).maybeSingle();
      const { data: staffData } = await supabase.from('production_staff').select('id').eq('user_id', user.id).maybeSingle();
      if (!adminData && !staffData) { router.push('/'); return; }
      setAuthChecked(true);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    productionService.getAllJobs().then(data => {
      setJobs(data.filter(j => ['quality_control', 'final_polish', 'rework'].includes(j.current_stage)));
      setLoading(false);
    });
  }, [authChecked]);

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-6 h-6 border border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-white border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-[#8B7355] tracking-widest uppercase">
            <Link href="/production" className="hover:text-[#1C1917] transition-colors">Production</Link>
            <span>→</span>
            <span className="text-[#1C1917]">QC Dashboard</span>
          </div>
          <Link href="/production" className="text-[10px] text-[#8B7355] hover:text-[#1C1917] transition-colors">← Dashboard</Link>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-[#1C1917] mb-1">Quality Control</h1>
          <p className="text-[#6B6B6B] text-sm">Jobs currently in QC, final polish, or rework stages.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#E8E4DC] p-5">
            <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-2">In QC</p>
            <p className="font-serif text-3xl text-[#1C1917]">{jobs.filter(j => j.current_stage === 'quality_control').length}</p>
          </div>
          <div className="bg-white border border-[#E8E4DC] p-5">
            <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-2">Final Polish</p>
            <p className="font-serif text-3xl text-[#1C1917]">{jobs.filter(j => j.current_stage === 'final_polish').length}</p>
          </div>
          <div className="bg-white border border-[#E8E4DC] p-5">
            <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-2">Rework</p>
            <p className="font-serif text-3xl text-amber-700">{jobs.filter(j => j.current_stage === 'rework').length}</p>
          </div>
        </div>

        <div className="bg-white border border-[#E8E4DC]">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#E8E4DC]">
                {['Job #', 'Product', 'Customer', 'Stage', 'Status', 'Est. Delivery', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[9px] text-[#8B7355] tracking-widest uppercase font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#8B7355]">No jobs in QC stages</td></tr>
              ) : jobs.map(job => (
                <tr key={job.id} className="border-b border-[#F0EDE6] hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1C1917]">{job.job_number}</td>
                  <td className="px-4 py-3 text-[#1C1917]">{job.product_name}</td>
                  <td className="px-4 py-3 text-[#6B6B6B]">{job.customer_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[9px] border ${
                      job.current_stage === 'rework' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]'
                    }`}>
                      {job.current_stage.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[9px] border ${
                      job.current_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{job.current_status}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B]">{formatDate(job.estimated_delivery)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/production/jobs/${job.id}`} className="text-[#C9A96E] hover:text-[#8B6914]">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
