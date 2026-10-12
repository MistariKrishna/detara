'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import {
  productionService,
  ProductionJob,
  StageEvent,
  LocationEvent,
  Shipment,
  STAGE_META,
  JOURNEY_STAGES,
  NEXT_STAGE_MESSAGE,
} from '@/lib/supabase/productionService';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// ── WHERE IS MY JEWELLERY ────────────────────────────────────

function WhereIsMyJewellery({ job, location }: { job: ProductionJob; location: LocationEvent | null }) {
  const meta = STAGE_META[job.current_stage];
  const customerLabel = meta?.customerLabel || job.current_stage.replace(/_/g, ' ');
  const isException = ['on_hold', 'delayed', 'rework', 'cancelled', 'returned'].includes(job.current_stage);

  return (
    <div className="border border-[#C9A96E]/40 bg-white p-8 mb-8">
      <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-6">Where Is My Jewellery?</p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Current Stage */}
        <div className="md:col-span-1">
          <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-2">Current Stage</p>
          <p className={`font-serif text-xl mb-1 ${isException ? 'text-amber-800' : 'text-[#1C1917]'}`}>
            {customerLabel}
          </p>
          <div className={`inline-block px-2 py-0.5 text-[9px] tracking-widest uppercase border ${
            job.current_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            job.current_status === 'delayed'? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[#FAFAF8] text-[#6B6B6B] border-[#E8E4DC]'
          }`}>
            {job.current_status}
          </div>
        </div>

        {/* Current Location */}
        <div className="md:col-span-1">
          <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-2">Current Location</p>
          <p className="font-serif text-xl text-[#1C1917] mb-1">
            {job.current_location || 'DETARA Atelier'}
          </p>
          <p className="text-[11px] text-[#6B6B6B]">
            {[job.current_department, job.current_city, job.current_country].filter(Boolean).join(' · ')}
          </p>
          {location?.arrival_at && (
            <p className="text-[10px] text-[#8B7355] mt-1">Arrived {formatDate(location.arrival_at)}</p>
          )}
        </div>

        {/* Estimated Delivery */}
        <div className="md:col-span-1">
          <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-2">Estimated Delivery</p>
          <p className="font-serif text-xl text-[#1C1917] mb-1">{formatDate(job.estimated_delivery)}</p>
          {job.estimated_dispatch && (
            <p className="text-[11px] text-[#6B6B6B]">Est. Dispatch: {formatDate(job.estimated_dispatch)}</p>
          )}
          {job.target_completion && (
            <p className="text-[11px] text-[#6B6B6B]">Est. Completion: {formatDate(job.target_completion)}</p>
          )}
        </div>
      </div>

      {/* What is happening now */}
      <div className="mt-6 pt-6 border-t border-[#F0EDE6] grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-2">What Is Happening Now?</p>
          <p className="text-sm text-[#1C1917] leading-relaxed">
            {STAGE_META[job.current_stage]?.customerLabel
              ? `Your jewellery is currently in the ${STAGE_META[job.current_stage].customerLabel.toLowerCase()} stage at our ${job.current_department || 'atelier'} in ${job.current_city || 'Mumbai'}.`
              : 'Your jewellery is being carefully crafted by our master artisans.'}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-2">What Happens Next?</p>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            {NEXT_STAGE_MESSAGE[job.current_stage] || 'Your jewellery will continue through our meticulous crafting process.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── THE DETARA JOURNEY TIMELINE ──────────────────────────────

function JourneyTimeline({ job, stageEvents }: { job: ProductionJob; stageEvents: StageEvent[] }) {
  const completedStages = new Set(stageEvents.filter(e => e.status === 'completed').map(e => e.stage));
  const inProgressStages = new Set(stageEvents.filter(e => e.status === 'in_progress').map(e => e.stage));
  const currentIdx = JOURNEY_STAGES.indexOf(job.current_stage);

  const getEventForStage = (stage: string) => stageEvents.find(e => e.stage === stage);

  return (
    <div className="bg-white border border-[#E8E4DC] p-8 mb-8">
      <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-8">The DETARA Journey</p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-[#E8E4DC]" />

        <div className="space-y-0">
          {JOURNEY_STAGES.map((stage, idx) => {
            const meta = STAGE_META[stage];
            const event = getEventForStage(stage);
            const isCompleted = completedStages.has(stage) || idx < currentIdx;
            const isCurrent = stage === job.current_stage || inProgressStages.has(stage);
            const isFuture = !isCompleted && !isCurrent;

            return (
              <div key={stage} className={`relative flex gap-6 pb-6 ${isFuture ? 'opacity-40' : ''}`}>
                {/* Node */}
                <div className="relative z-10 shrink-0">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] transition-all ${
                    isCompleted
                      ? 'bg-[#1C1917] border-[#1C1917] text-white'
                      : isCurrent
                      ? 'bg-[#C9A96E] border-[#C9A96E] text-white animate-pulse'
                      : 'bg-white border-[#E8E4DC] text-[#8B7355]'
                  }`}>
                    {isCompleted ? '✓' : meta?.icon || '○'}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-sm font-medium ${isCurrent ? 'text-[#8B6914]' : isCompleted ? 'text-[#1C1917]' : 'text-[#8B7355]'}`}>
                        {meta?.customerLabel || stage.replace(/_/g, ' ')}
                      </p>
                      {event?.customer_message && (
                        <p className="text-[11px] text-[#6B6B6B] mt-1 leading-relaxed max-w-md">
                          {event.customer_message}
                        </p>
                      )}
                      {event?.city && (
                        <p className="text-[10px] text-[#8B7355] mt-1">
                          {[event.department, event.city, event.country].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {event?.completed_at && (
                        <p className="text-[10px] text-[#8B7355]">{formatDate(event.completed_at)}</p>
                      )}
                      {isCurrent && !event?.completed_at && (
                        <span className="text-[9px] text-[#C9A96E] tracking-widest uppercase">In Progress</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── ORDER DETAILS ────────────────────────────────────────────

function OrderDetails({ job }: { job: ProductionJob }) {
  return (
    <div className="bg-white border border-[#E8E4DC] p-8 mb-8">
      <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-6">Order Details</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {[
          { label: 'Order Number', value: job.order_number || job.job_number },
          { label: 'Production Job', value: job.job_number },
          { label: 'Product', value: job.product_name },
          { label: 'SKU', value: job.sku },
          { label: 'Metal', value: job.metal },
          { label: 'Diamond', value: job.diamond_spec },
          { label: 'Size', value: job.ring_size },
          { label: 'Quantity', value: job.quantity?.toString() },
          { label: 'Order Value', value: job.order_value ? `£${job.order_value.toLocaleString('en-GB')}` : null },
        ].filter(item => item.value).map(item => (
          <div key={item.label}>
            <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-1">{item.label}</p>
            <p className="text-sm text-[#1C1917]">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SHIPPING INFO ────────────────────────────────────────────

function ShippingInfo({ shipment }: { shipment: Shipment | null }) {
  if (!shipment) return null;
  return (
    <div className="bg-white border border-[#E8E4DC] p-8 mb-8">
      <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-6">Shipping Information</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-6">
        {[
          { label: 'Courier', value: shipment.courier },
          { label: 'Tracking Number', value: shipment.tracking_number },
          { label: 'Status', value: shipment.shipment_status?.replace(/_/g, ' ') },
          { label: 'Ship Date', value: formatDate(shipment.ship_date) },
          { label: 'Est. Delivery', value: formatDate(shipment.estimated_delivery) },
          { label: 'Destination', value: [shipment.destination_city, shipment.destination_country].filter(Boolean).join(', ') },
        ].filter(item => item.value && item.value !== '—').map(item => (
          <div key={item.label}>
            <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-1">{item.label}</p>
            <p className="text-sm text-[#1C1917]">{item.value}</p>
          </div>
        ))}
      </div>
      {shipment.tracking_events && shipment.tracking_events.length > 0 && (
        <div>
          <p className="text-[9px] text-[#8B7355] tracking-widest uppercase mb-3">Tracking Events</p>
          <div className="space-y-2">
            {shipment.tracking_events.map((ev, i) => (
              <div key={i} className="flex gap-4 text-[11px] py-2 border-b border-[#F0EDE6] last:border-0">
                <span className="text-[#8B7355] shrink-0">{formatDateTime(ev.timestamp)}</span>
                <span className="text-[#1C1917]">{ev.status}</span>
                <span className="text-[#6B6B6B]">{ev.location}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────

export default function JourneyPage() {
  const params = useParams();
  const jobId = params?.id as string;
  const { user, loading: authLoading } = useAuth();

  const [job, setJob] = useState<ProductionJob | null>(null);
  const [stageEvents, setStageEvents] = useState<StageEvent[]>([]);
  const [locationEvents, setLocationEvents] = useState<LocationEvent[]>([]);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      setLoading(true);
      const [jobData, eventsData, locData, shipData] = await Promise.all([
        productionService.getJobById(jobId),
        productionService.getStageEvents(jobId),
        productionService.getLocationEvents(jobId),
        productionService.getShipment(jobId),
      ]);
      if (!jobData) { setError('Order not found.'); setLoading(false); return; }
      // Security: ensure customer can only see their own job
      if (user?.email && jobData.customer_email !== user.email) {
        setError('You do not have access to this order.');
        setLoading(false);
        return;
      }
      setJob(jobData);
      setStageEvents(eventsData);
      setLocationEvents(locData);
      setShipment(shipData);
      setLoading(false);
    };
    if (!authLoading) load();
  }, [jobId, user?.email, authLoading]);

  const currentLocation = locationEvents.find(l => l.status === 'current') || locationEvents[0] || null;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-6 h-6 border border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <p className="font-serif text-3xl text-[#1C1917] mb-4">Sign In Required</p>
          <Link href="/login" className="inline-block px-8 py-3 bg-[#1C1917] text-white text-[11px] tracking-widest uppercase">
            Sign In
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <Header />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <p className="font-serif text-3xl text-[#1C1917] mb-4">{error || 'Order Not Found'}</p>
          <Link href="/portal" className="inline-block px-8 py-3 bg-[#1C1917] text-white text-[11px] tracking-widest uppercase">
            Back to Portal
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header />

      {/* Header */}
      <div className="bg-white border-b border-[#E8E4DC]">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 text-[10px] text-[#8B7355] tracking-widest uppercase mb-4">
            <Link href="/portal" className="hover:text-[#1C1917] transition-colors">Portal</Link>
            <span>→</span>
            <span>Journey</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] text-[#8B7355] tracking-widest uppercase mb-1">{job.job_number}</p>
              <h1 className="font-serif text-3xl md:text-4xl text-[#1C1917]">{job.product_name}</h1>
              {job.is_demo && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-amber-50 border border-amber-200 text-[9px] text-amber-700 tracking-widest uppercase">
                  Demo Order
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              {job.order_value && (
                <p className="font-serif text-2xl text-[#1C1917]">£{job.order_value.toLocaleString('en-GB')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Where is my jewellery */}
        <WhereIsMyJewellery job={job} location={currentLocation} />

        {/* The DETARA Journey */}
        <JourneyTimeline job={job} stageEvents={stageEvents} />

        {/* Order Details */}
        <OrderDetails job={job} />

        {/* Shipping */}
        <ShippingInfo shipment={shipment} />

        {/* Support CTA */}
        <div className="border border-[#E8E4DC] bg-white p-8 text-center">
          <p className="font-serif text-xl text-[#1C1917] mb-2">Have a Question?</p>
          <p className="text-[#6B6B6B] text-sm mb-6">Our concierge team is here to assist you with any queries about your order.</p>
          <Link
            href="/portal/support"
            className="inline-block px-8 py-3 bg-[#1C1917] text-white text-[11px] tracking-widest uppercase hover:bg-[#2D2520] transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
