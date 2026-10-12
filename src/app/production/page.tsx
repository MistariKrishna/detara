'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { productionService, ProductionJob, STAGE_META, JOURNEY_STAGES } from '@/lib/supabase/productionService';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STAGE_GROUPS = [
  { label: 'Diamond Procurement', stages: ['diamond_sourcing', 'diamond_received'] },
  { label: 'CAD & Design', stages: ['cad_design', 'cad_approved'] },
  { label: '3D / Wax', stages: ['wax_model'] },
  { label: 'Casting', stages: ['casting', 'filing_pre_polish'] },
  { label: 'Setting', stages: ['diamond_setting'] },
  { label: 'QC', stages: ['final_polish', 'quality_control'] },
  { label: 'Certification', stages: ['certification', 'final_photography'] },
  { label: 'Packaging', stages: ['packaging', 'ready_to_ship'] },
  { label: 'Shipping', stages: ['shipped', 'in_transit', 'delivered'] },
];

function StageBadge({ stage, status }: { stage: string; status: string }) {
  const meta = STAGE_META[stage];
  const isException = ['on_hold', 'delayed', 'rework', 'cancelled'].includes(status);
  return (
    <span className={`inline-block px-2 py-0.5 text-[9px] tracking-widest uppercase border ${
      isException ? 'bg-amber-50 text-amber-700 border-amber-200' :
      stage === 'delivered'? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]'
    }`}>
      {meta?.label || stage.replace(/_/g, ' ')}
    </span>
  );
}

function StatsCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-[#E8E4DC] p-6">
      <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-2">{label}</p>
      <p className="font-serif text-3xl text-[#1C1917]">{value}</p>
      {sub && <p className="text-[11px] text-[#8B7355] mt-1">{sub}</p>}
    </div>
  );
}

function KanbanColumn({ label, jobs, stages }: { label: string; jobs: ProductionJob[]; stages: string[] }) {
  const colJobs = jobs.filter(j => stages.includes(j.current_stage));
  return (
    <div className="min-w-[220px] bg-[#FAFAF8] border border-[#E8E4DC]">
      <div className="px-4 py-3 border-b border-[#E8E4DC] flex items-center justify-between">
        <p className="text-[10px] tracking-widest uppercase text-[#1C1917] font-medium">{label}</p>
        <span className="w-5 h-5 rounded-full bg-[#E8E4DC] text-[#6B6B6B] text-[10px] flex items-center justify-center">
          {colJobs.length}
        </span>
      </div>
      <div className="p-3 space-y-2 min-h-[120px]">
        {colJobs.map(job => (
          <Link key={job.id} href={`/production/jobs/${job.id}`}>
            <div className="bg-white border border-[#E8E4DC] p-3 hover:border-[#C9A96E]/60 transition-all cursor-pointer">
              <p className="text-[10px] text-[#8B7355] mb-1">{job.job_number}</p>
              <p className="text-[11px] text-[#1C1917] font-medium leading-snug mb-2 line-clamp-2">{job.product_name}</p>
              <p className="text-[10px] text-[#6B6B6B] mb-2">{job.customer_name}</p>
              <div className="flex items-center justify-between">
                <span className={`text-[9px] px-1.5 py-0.5 border ${
                  job.current_status === 'delayed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  job.current_status === 'active'? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]'
                }`}>
                  {job.current_status}
                </span>
                {job.is_demo && <span className="text-[8px] text-amber-600">DEMO</span>}
              </div>
            </div>
          </Link>
        ))}
        {colJobs.length === 0 && (
          <p className="text-[10px] text-[#C0BAB0] text-center py-4">No jobs</p>
        )}
      </div>
    </div>
  );
}

export default function ProductionDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, delayed: 0, completed: 0, byStage: {} as Record<string, number> });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isStaff, setIsStaff] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      // Check if admin_users or production_staff
      const { data: adminData } = await supabase.from('admin_users').select('id').eq('user_id', user.id).maybeSingle();
      const { data: staffData } = await supabase.from('production_staff').select('id').eq('user_id', user.id).maybeSingle();
      if (!adminData && !staffData) { router.push('/'); return; }
      setIsStaff(true);
      setAuthChecked(true);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    const load = async () => {
      setLoading(true);
      const [jobsData, statsData] = await Promise.all([
        productionService.getAllJobs(),
        productionService.getProductionStats(),
      ]);
      setJobs(jobsData);
      setStats(statsData);
      setLoading(false);
    };
    load();
  }, [authChecked]);

  const filteredJobs = jobs.filter(j => {
    if (stageFilter !== 'all' && j.current_stage !== stageFilter) return false;
    if (statusFilter !== 'all' && j.current_status !== statusFilter) return false;
    return true;
  });

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-6 h-6 border border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Top Nav */}
      <div className="bg-white border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-serif text-[#1C1917] text-lg tracking-wider">DETARA</Link>
            <span className="text-[#E8E4DC]">|</span>
            <span className="text-[10px] text-[#8B7355] tracking-widest uppercase">Production Control</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/production/jobs/new" className="px-4 py-2 bg-[#1C1917] text-white text-[10px] tracking-widest uppercase hover:bg-[#2D2520] transition-colors">
              + New Job
            </Link>
            <Link href="/admin" className="text-[10px] text-[#8B7355] tracking-widest uppercase hover:text-[#1C1917] transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Sub Nav */}
      <div className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex gap-0 overflow-x-auto">
            {[
              { href: '/production', label: 'Dashboard', exact: true },
              { href: '/production/jobs', label: 'Production Jobs' },
              { href: '/production/diamonds', label: 'Diamonds' },
              { href: '/production/qc', label: 'QC' },
              { href: '/production/shipping', label: 'Shipping' },
              { href: '/production/reports', label: 'Reports' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="px-5 py-3 text-[10px] tracking-widest uppercase text-[#8B7355] hover:text-[#1C1917] border-b-2 border-transparent hover:border-[#C9A96E] transition-all whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8">

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-[#1C1917] mb-1">Production Control Center</h1>
          <p className="text-[#6B6B6B] text-sm">Manage the complete jewellery production lifecycle.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Total Jobs" value={stats.total} />
          <StatsCard label="Active" value={stats.active} sub="In production" />
          <StatsCard label="Delayed" value={stats.delayed} sub="Require attention" />
          <StatsCard label="Delivered" value={stats.completed} sub="Completed" />
        </div>

        {/* Stage Distribution */}
        <div className="bg-white border border-[#E8E4DC] p-6 mb-8">
          <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-4">Jobs by Stage</p>
          <div className="flex flex-wrap gap-2">
            {JOURNEY_STAGES.filter(s => (stats.byStage[s] || 0) > 0).map(stage => (
              <button
                key={stage}
                onClick={() => setStageFilter(stageFilter === stage ? 'all' : stage)}
                className={`flex items-center gap-2 px-3 py-1.5 border text-[10px] transition-all ${
                  stageFilter === stage
                    ? 'bg-[#1C1917] text-white border-[#1C1917]'
                    : 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC] hover:border-[#C9A96E]/60'
                }`}
              >
                <span>{STAGE_META[stage]?.label || stage}</span>
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center ${
                  stageFilter === stage ? 'bg-white text-[#1C1917]' : 'bg-[#E8E4DC] text-[#6B6B6B]'
                }`}>
                  {stats.byStage[stage] || 0}
                </span>
              </button>
            ))}
            {Object.keys(stats.byStage).length === 0 && (
              <p className="text-[11px] text-[#8B7355]">No active jobs</p>
            )}
          </div>
        </div>

        {/* View Toggle + Filters */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex border border-[#E8E4DC]">
              {(['kanban', 'list'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 text-[10px] tracking-widest uppercase transition-colors ${
                    view === v ? 'bg-[#1C1917] text-white' : 'bg-white text-[#8B7355] hover:text-[#1C1917]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-[#E8E4DC] bg-white text-[11px] text-[#1C1917] px-3 py-2 focus:outline-none focus:border-[#C9A96E]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="delayed">Delayed</option>
              <option value="on_hold">On Hold</option>
              <option value="rework">Rework</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <p className="text-[11px] text-[#8B7355]">{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Kanban View */}
        {view === 'kanban' && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {STAGE_GROUPS.map(group => (
                <KanbanColumn key={group.label} label={group.label} jobs={filteredJobs} stages={group.stages} />
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="bg-white border border-[#E8E4DC]">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[#E8E4DC]">
                  {['Job #', 'Product', 'Customer', 'Metal / Diamond', 'Stage', 'Status', 'Est. Delivery', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] text-[#8B7355] tracking-widest uppercase font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[#8B7355]">No jobs found</td>
                  </tr>
                ) : (
                  filteredJobs.map(job => (
                    <tr key={job.id} className="border-b border-[#F0EDE6] hover:bg-[#FAFAF8] transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-[#1C1917]">{job.job_number}</span>
                        {job.is_demo && <span className="ml-1 text-[8px] text-amber-600">DEMO</span>}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="text-[#1C1917] truncate">{job.product_name}</p>
                        {job.sku && <p className="text-[#8B7355] text-[10px]">{job.sku}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[#1C1917]">{job.customer_name}</p>
                        <p className="text-[#8B7355] text-[10px]">{job.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-[#1C1917] truncate">{job.metal || '—'}</p>
                        <p className="text-[#8B7355] text-[10px] truncate">{job.diamond_spec || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StageBadge stage={job.current_stage} status={job.current_status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] px-2 py-0.5 border ${
                          job.current_status === 'delayed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          job.current_status === 'active'? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]'
                        }`}>
                          {job.current_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6B6B6B]">{formatDate(job.estimated_delivery)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/production/jobs/${job.id}`} className="text-[#C9A96E] hover:text-[#8B6914] transition-colors">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
