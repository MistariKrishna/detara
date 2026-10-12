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

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  ready_to_ship: 'bg-blue-50 text-blue-700 border-blue-200',
  label_created: 'bg-blue-50 text-blue-700 border-blue-200',
  picked_up: 'bg-amber-50 text-amber-700 border-amber-200',
  in_transit: 'bg-amber-50 text-amber-700 border-amber-200',
  customs: 'bg-purple-50 text-purple-700 border-purple-200',
  out_for_delivery: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  delivered: 'bg-[#1C1917] text-white border-[#1C1917]',
  exception: 'bg-red-50 text-red-700 border-red-200',
};

export default function ShippingPage() {
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
      setJobs(data.filter(j => ['ready_to_ship', 'shipped', 'in_transit', 'delivered'].includes(j.current_stage)));
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
            <span className="text-[#1C1917]">Shipping</span>
          </div>
          <Link href="/production" className="text-[10px] text-[#8B7355] hover:text-[#1C1917] transition-colors">← Dashboard</Link>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-[#1C1917] mb-1">Shipping & Fulfilment</h1>
          <p className="text-[#6B6B6B] text-sm">Jobs ready to ship, in transit, and delivered.</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Ready to Ship', value: jobs.filter(j => j.current_stage === 'ready_to_ship').length },
            { label: 'Shipped', value: jobs.filter(j => j.current_stage === 'shipped').length },
            { label: 'In Transit', value: jobs.filter(j => j.current_stage === 'in_transit').length },
            { label: 'Delivered', value: jobs.filter(j => j.current_stage === 'delivered').length },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#E8E4DC] p-5">
              <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-2">{s.label}</p>
              <p className="font-serif text-3xl text-[#1C1917]">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#E8E4DC]">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#E8E4DC]">
                {['Job #', 'Product', 'Customer', 'Stage', 'Est. Delivery', 'Location', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[9px] text-[#8B7355] tracking-widest uppercase font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#8B7355]">No jobs in shipping stages</td></tr>
              ) : jobs.map(job => (
                <tr key={job.id} className="border-b border-[#F0EDE6] hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1C1917]">{job.job_number}</td>
                  <td className="px-4 py-3 text-[#1C1917]">{job.product_name}</td>
                  <td className="px-4 py-3">
                    <p className="text-[#1C1917]">{job.customer_name}</p>
                    <p className="text-[#8B7355] text-[10px]">{job.customer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[9px] border ${
                      job.current_stage === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      job.current_stage === 'in_transit'? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]'
                    }`}>
                      {job.current_stage.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B]">{formatDate(job.estimated_delivery)}</td>
                  <td className="px-4 py-3 text-[#6B6B6B]">
                    {[job.current_city, job.current_country].filter(Boolean).join(', ') || '—'}
                  </td>
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
