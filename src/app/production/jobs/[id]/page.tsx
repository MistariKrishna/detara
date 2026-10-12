'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  productionService,
  ProductionJob,
  StageEvent,
  LocationEvent,
  QCInspection,
  STAGE_META,
  JOURNEY_STAGES,
} from '@/lib/supabase/productionService';

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E8E4DC] p-6 mb-6">
      <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-5">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-1">{label}</p>
      <p className={`text-sm text-[#1C1917] ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );
}

export default function ProductionJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<ProductionJob | null>(null);
  const [stageEvents, setStageEvents] = useState<StageEvent[]>([]);
  const [locationEvents, setLocationEvents] = useState<LocationEvent[]>([]);
  const [qcInspection, setQcInspection] = useState<QCInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newStage, setNewStage] = useState('');
  const [stageNote, setStageNote] = useState('');
  const [stageMsg, setStageMsg] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

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
    if (!authChecked || !jobId) return;
    const load = async () => {
      setLoading(true);
      const [jobData, eventsData, locData, qcData] = await Promise.all([
        productionService.getJobById(jobId),
        productionService.getAllStageEvents(jobId),
        productionService.getLocationEvents(jobId, false),
        productionService.getQCInspection(jobId),
      ]);
      setJob(jobData);
      setStageEvents(eventsData);
      setLocationEvents(locData);
      setQcInspection(qcData);
      if (jobData) setNewStage(jobData.current_stage);
      setLoading(false);
    };
    load();
  }, [authChecked, jobId]);

  const handleAdvanceStage = async () => {
    if (!job || !newStage || newStage === job.current_stage) return;
    setSaving(true);
    const supabase = createClient();
    // Update job stage
    await supabase.from('production_jobs').update({
      current_stage: newStage,
      updated_at: new Date().toISOString(),
    }).eq('id', job.id);
    // Create stage event
    await supabase.from('production_stage_events').insert({
      job_id: job.id,
      stage: newStage,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      customer_message: stageMsg || STAGE_META[newStage]?.customerLabel || newStage.replace(/_/g, ' '),
      internal_notes: stageNote,
      customer_visible: true,
    });
    // Refresh
    const [updatedJob, updatedEvents] = await Promise.all([
      productionService.getJobById(job.id),
      productionService.getAllStageEvents(job.id),
    ]);
    setJob(updatedJob);
    setStageEvents(updatedEvents);
    setStageNote('');
    setStageMsg('');
    setSaveSuccess('Stage updated successfully.');
    setTimeout(() => setSaveSuccess(''), 3000);
    setSaving(false);
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-6 h-6 border border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-2xl text-[#1C1917] mb-4">Job Not Found</p>
          <Link href="/production" className="text-[#C9A96E] text-[11px] tracking-widest uppercase">← Back</Link>
        </div>
      </div>
    );
  }

  const currentIdx = JOURNEY_STAGES.indexOf(job.current_stage);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Top Nav */}
      <div className="bg-white border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-[#8B7355] tracking-widest uppercase">
            <Link href="/production" className="hover:text-[#1C1917] transition-colors">Production</Link>
            <span>→</span>
            <span className="text-[#1C1917]">{job.job_number}</span>
          </div>
          <div className="flex items-center gap-3">
            {job.is_demo && (
              <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-[9px] text-amber-700 tracking-widest uppercase">
                Demo
              </span>
            )}
            <Link href="/production" className="text-[10px] text-[#8B7355] hover:text-[#1C1917] transition-colors">
              ← All Jobs
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: Main Details */}
          <div className="lg:col-span-2 space-y-0">

            {/* Header */}
            <div className="bg-white border border-[#E8E4DC] p-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-1">{job.job_number}</p>
                  <h1 className="font-serif text-2xl text-[#1C1917] mb-1">{job.product_name}</h1>
                  {job.sku && <p className="text-[11px] text-[#8B7355]">SKU: {job.sku}</p>}
                </div>
                <div className="text-right">
                  {job.order_value && (
                    <p className="font-serif text-xl text-[#1C1917]">£{job.order_value.toLocaleString('en-GB')}</p>
                  )}
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] border tracking-widest uppercase ${
                    job.current_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    job.current_status === 'delayed'? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]'
                  }`}>
                    {job.current_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <Section title="Order & Product Details">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Order Number" value={job.order_number} />
                <Field label="Production Job" value={job.job_number} />
                <Field label="Customer" value={job.customer_name} />
                <Field label="Customer Email" value={job.customer_email} />
                <Field label="Metal" value={job.metal} />
                <Field label="Diamond Spec" value={job.diamond_spec} />
                <Field label="Ring Size" value={job.ring_size} />
                <Field label="Quantity" value={job.quantity?.toString()} />
                <Field label="Production Type" value={job.production_type} />
              </div>
            </Section>

            {/* Current Location */}
            <Section title="Current Location">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <Field label="Location" value={job.current_location} />
                <Field label="Department" value={job.current_department} />
                <Field label="City" value={job.current_city} />
                <Field label="Country" value={job.current_country} />
                <Field label="Current Stage" value={STAGE_META[job.current_stage]?.label || job.current_stage} />
              </div>
              {locationEvents.length > 0 && (
                <div>
                  <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-3">Location History</p>
                  <div className="space-y-2">
                    {locationEvents.map(loc => (
                      <div key={loc.id} className="flex gap-4 text-[11px] py-2 border-b border-[#F0EDE6] last:border-0">
                        <span className={`shrink-0 px-2 py-0.5 text-[9px] border ${
                          loc.status === 'current' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]'
                        }`}>{loc.status}</span>
                        <span className="text-[#1C1917] font-medium">{loc.location_name}</span>
                        <span className="text-[#6B6B6B]">{loc.department}</span>
                        <span className="text-[#8B7355]">{formatDate(loc.arrival_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Stage History */}
            <Section title="Production Stage History">
              <div className="space-y-3">
                {stageEvents.length === 0 ? (
                  <p className="text-[11px] text-[#8B7355]">No stage events recorded yet.</p>
                ) : (
                  stageEvents.map(ev => (
                    <div key={ev.id} className="flex gap-4 py-3 border-b border-[#F0EDE6] last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        ev.status === 'completed' ? 'bg-[#1C1917]' :
                        ev.status === 'in_progress' ? 'bg-[#C9A96E]' : 'bg-[#E8E4DC]'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-medium text-[#1C1917]">
                              {STAGE_META[ev.stage]?.label || ev.stage.replace(/_/g, ' ')}
                            </p>
                            {ev.customer_message && (
                              <p className="text-[10px] text-[#6B6B6B] mt-0.5 italic">"{ev.customer_message}"</p>
                            )}
                            {ev.internal_notes && (
                              <p className="text-[10px] text-[#8B7355] mt-0.5">Internal: {ev.internal_notes}</p>
                            )}
                            {ev.city && (
                              <p className="text-[10px] text-[#8B7355] mt-0.5">
                                {[ev.department, ev.city].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-[9px] px-1.5 py-0.5 border ${
                              ev.status === 'completed' ? 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]' :
                              ev.status === 'in_progress'? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]'
                            }`}>{ev.status}</span>
                            <p className="text-[10px] text-[#8B7355] mt-1">{formatDateTime(ev.completed_at || ev.started_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Section>

            {/* QC Inspection */}
            {qcInspection && (
              <Section title="QC Inspection">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 text-[10px] border tracking-widest uppercase ${
                    qcInspection.qc_status === 'passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    qcInspection.qc_status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                    qcInspection.qc_status === 'rework_required'? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]'
                  }`}>
                    {qcInspection.qc_status.replace(/_/g, ' ')}
                  </span>
                  {qcInspection.inspected_at && (
                    <span className="text-[11px] text-[#8B7355]">Inspected: {formatDate(qcInspection.inspected_at)}</span>
                  )}
                </div>
                {qcInspection.checklist && Object.keys(qcInspection.checklist).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(qcInspection.checklist).map(([key, val]) => (
                      <div key={key} className={`flex items-center gap-2 px-3 py-2 border text-[10px] ${
                        val === 'passed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        val === 'failed'? 'bg-red-50 border-red-200 text-red-700' : 'bg-[#FAFAF8] border-[#E8E4DC] text-[#6B6B6B]'
                      }`}>
                        <span>{val === 'passed' ? '✓' : val === 'failed' ? '✕' : '○'}</span>
                        <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                )}
                {qcInspection.failure_notes && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200">
                    <p className="text-[10px] text-red-700 font-medium mb-1">Internal Failure Notes (Not visible to customer)</p>
                    <p className="text-[11px] text-red-600">{qcInspection.failure_notes}</p>
                  </div>
                )}
              </Section>
            )}
          </div>

          {/* Right: Actions + Timeline */}
          <div className="space-y-6">

            {/* Advance Stage */}
            <div className="bg-white border border-[#E8E4DC] p-6">
              <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-4">Advance Stage</p>
              <div className="mb-3">
                <p className="text-[9px] text-[#8B7355] uppercase tracking-widest mb-1">Current Stage</p>
                <p className="text-sm text-[#1C1917] font-medium">{STAGE_META[job.current_stage]?.label || job.current_stage}</p>
              </div>
              <div className="mb-3">
                <label className="text-[9px] text-[#8B7355] uppercase tracking-widest block mb-1">New Stage</label>
                <select
                  value={newStage}
                  onChange={e => setNewStage(e.target.value)}
                  className="w-full border border-[#E8E4DC] bg-white text-[11px] text-[#1C1917] px-3 py-2 focus:outline-none focus:border-[#C9A96E]"
                >
                  {JOURNEY_STAGES.map(s => (
                    <option key={s} value={s}>{STAGE_META[s]?.label || s}</option>
                  ))}
                  <option value="on_hold">On Hold</option>
                  <option value="delayed">Delayed</option>
                  <option value="rework">Rework</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="text-[9px] text-[#8B7355] uppercase tracking-widest block mb-1">Customer Message</label>
                <textarea
                  value={stageMsg}
                  onChange={e => setStageMsg(e.target.value)}
                  placeholder="Message shown to customer..."
                  rows={2}
                  className="w-full border border-[#E8E4DC] text-[11px] text-[#1C1917] px-3 py-2 focus:outline-none focus:border-[#C9A96E] resize-none"
                />
              </div>
              <div className="mb-4">
                <label className="text-[9px] text-[#8B7355] uppercase tracking-widest block mb-1">Internal Notes</label>
                <textarea
                  value={stageNote}
                  onChange={e => setStageNote(e.target.value)}
                  placeholder="Internal notes (not visible to customer)..."
                  rows={2}
                  className="w-full border border-[#E8E4DC] text-[11px] text-[#1C1917] px-3 py-2 focus:outline-none focus:border-[#C9A96E] resize-none"
                />
              </div>
              {saveSuccess && (
                <p className="text-[10px] text-emerald-700 mb-3">{saveSuccess}</p>
              )}
              <button
                onClick={handleAdvanceStage}
                disabled={saving || newStage === job.current_stage}
                className="w-full py-2.5 bg-[#1C1917] text-white text-[10px] tracking-widest uppercase hover:bg-[#2D2520] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Update Stage'}
              </button>
            </div>

            {/* Key Dates */}
            <div className="bg-white border border-[#E8E4DC] p-6">
              <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-4">Key Dates</p>
              <div className="space-y-3">
                {[
                  { label: 'Order Created', value: formatDate(job.created_at) },
                  { label: 'Target Completion', value: formatDate(job.target_completion) },
                  { label: 'Est. Dispatch', value: formatDate(job.estimated_dispatch) },
                  { label: 'Est. Delivery', value: formatDate(job.estimated_delivery) },
                  { label: 'Actual Completion', value: formatDate(job.actual_completion) },
                  { label: 'Actual Delivery', value: formatDate(job.actual_delivery) },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-[11px]">
                    <span className="text-[#8B7355]">{item.label}</span>
                    <span className="text-[#1C1917]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white border border-[#E8E4DC] p-6">
              <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-4">Quick Actions</p>
              <div className="space-y-2">
                {[
                  { href: `/production/diamonds`, label: 'Diamond Inventory' },
                  { href: `/production/qc`, label: 'QC Dashboard' },
                  { href: `/production/shipping`, label: 'Shipping' },
                  { href: `/production`, label: '← All Jobs' },
                ].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 border border-[#E8E4DC] text-[10px] text-[#8B7355] tracking-widest uppercase hover:border-[#C9A96E]/60 hover:text-[#1C1917] transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
