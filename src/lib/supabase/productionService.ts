'use client';

import { createClient } from './client';

export interface ProductionJob {
  id: string;
  job_number: string;
  order_id: string | null;
  order_number: string | null;
  customer_name: string;
  customer_email: string;
  product_name: string;
  sku: string | null;
  metal: string | null;
  diamond_spec: string | null;
  ring_size: string | null;
  quantity: number;
  order_value: number | null;
  production_type: string;
  current_stage: string;
  current_status: string;
  current_location: string | null;
  current_city: string | null;
  current_country: string | null;
  current_department: string | null;
  target_completion: string | null;
  estimated_dispatch: string | null;
  estimated_delivery: string | null;
  actual_completion: string | null;
  actual_delivery: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface StageEvent {
  id: string;
  job_id: string;
  stage: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  department: string | null;
  customer_message: string | null;
  customer_visible: boolean;
  created_at: string;
}

export interface LocationEvent {
  id: string;
  job_id: string;
  location_name: string;
  city: string | null;
  country: string | null;
  department: string | null;
  stage: string | null;
  arrival_at: string | null;
  departure_at: string | null;
  status: string;
  notes: string | null;
  customer_visible: boolean;
  created_at: string;
}

export interface ProductionNotification {
  id: string;
  job_id: string;
  customer_email: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  sent_at: string | null;
  created_at: string;
}

export interface Diamond {
  id: string;
  stone_id: string;
  certificate_number: string | null;
  diamond_type: string;
  shape: string | null;
  carat: number | null;
  colour: string | null;
  clarity: string | null;
  cut: string | null;
  measurements: string | null;
  diamond_status: string;
  assigned_job_id: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface QCInspection {
  id: string;
  job_id: string;
  qc_status: string;
  checklist: Record<string, string>;
  failure_notes: string | null;
  customer_message: string | null;
  inspected_at: string | null;
  passed_at: string | null;
  created_at: string;
}

export interface Shipment {
  id: string;
  job_id: string;
  courier: string | null;
  shipping_method: string | null;
  tracking_number: string | null;
  destination_city: string | null;
  destination_country: string | null;
  ship_date: string | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  shipment_status: string;
  tracking_events: Array<{ timestamp: string; status: string; location: string }>;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  customer_email: string;
  customer_name: string | null;
  job_id: string | null;
  subject: string;
  priority: string;
  ticket_status: string;
  messages: Array<{ from: string; message: string; timestamp: string }>;
  created_at: string;
  updated_at: string;
}

// ── STAGE METADATA ──────────────────────────────────────────

export const STAGE_META: Record<string, { label: string; customerLabel: string; icon: string; phase: 'pre' | 'active' | 'post' }> = {
  order_confirmed:    { label: 'Order Confirmed',       customerLabel: 'Order Confirmed',           icon: '✓', phase: 'pre' },
  payment_verified:   { label: 'Payment Verified',      customerLabel: 'Payment Verified',          icon: '✓', phase: 'pre' },
  production_planned: { label: 'Production Planned',    customerLabel: 'Production Scheduled',      icon: '◈', phase: 'pre' },
  diamond_sourcing:   { label: 'Diamond Sourcing',      customerLabel: 'Diamond Selection',         icon: '◇', phase: 'active' },
  diamond_received:   { label: 'Diamond Received',      customerLabel: 'Diamond Verified',          icon: '◆', phase: 'active' },
  cad_design:         { label: 'CAD Design',            customerLabel: 'Design in Progress',        icon: '◉', phase: 'active' },
  cad_approved:       { label: 'CAD Approved',          customerLabel: 'Design Approved',           icon: '◉', phase: 'active' },
  wax_model:          { label: '3D / Wax Model',        customerLabel: 'Model Created',             icon: '◎', phase: 'active' },
  casting:            { label: 'Casting',               customerLabel: 'Being Crafted',             icon: '◌', phase: 'active' },
  filing_pre_polish:  { label: 'Filing & Pre-Polish',   customerLabel: 'Refinement',                icon: '◍', phase: 'active' },
  diamond_setting:    { label: 'Diamond Setting',       customerLabel: 'Diamond Being Set',         icon: '◆', phase: 'active' },
  final_polish:       { label: 'Final Polish',          customerLabel: 'Final Polish',              icon: '◇', phase: 'active' },
  quality_control:    { label: 'Quality Control',       customerLabel: 'Quality Inspection',        icon: '◎', phase: 'active' },
  certification:      { label: 'Certification',         customerLabel: 'Certification',             icon: '◈', phase: 'active' },
  final_photography:  { label: 'Final Photography',     customerLabel: 'Final Photography',         icon: '◉', phase: 'active' },
  packaging:          { label: 'Packaging',             customerLabel: 'Packaging',                 icon: '◻', phase: 'post' },
  ready_to_ship:      { label: 'Ready to Ship',         customerLabel: 'Ready to Ship',             icon: '◻', phase: 'post' },
  shipped:            { label: 'Shipped',               customerLabel: 'Shipped',                   icon: '→', phase: 'post' },
  in_transit:         { label: 'In Transit',            customerLabel: 'On Its Way to You',         icon: '→', phase: 'post' },
  delivered:          { label: 'Delivered',             customerLabel: 'Delivered',                 icon: '✓', phase: 'post' },
  on_hold:            { label: 'On Hold',               customerLabel: 'Temporarily Paused',        icon: '◌', phase: 'active' },
  delayed:            { label: 'Delayed',               customerLabel: 'Slight Delay',              icon: '◌', phase: 'active' },
  rework:             { label: 'Rework',                customerLabel: 'Additional Refinement',     icon: '◎', phase: 'active' },
  cancelled:          { label: 'Cancelled',             customerLabel: 'Cancelled',                 icon: '✕', phase: 'post' },
  returned:           { label: 'Returned',              customerLabel: 'Returned',                  icon: '←', phase: 'post' },
};

export const JOURNEY_STAGES = [
  'order_confirmed', 'payment_verified', 'production_planned',
  'diamond_sourcing', 'diamond_received', 'cad_design', 'cad_approved',
  'wax_model', 'casting', 'filing_pre_polish', 'diamond_setting',
  'final_polish', 'quality_control', 'certification', 'final_photography',
  'packaging', 'ready_to_ship', 'shipped', 'in_transit', 'delivered',
];

export const NEXT_STAGE_MESSAGE: Record<string, string> = {
  order_confirmed:    'Your payment will be verified and production will be scheduled.',
  payment_verified:   'Your production will be planned and diamond sourcing will begin.',
  production_planned: 'Our gemologists will begin selecting the perfect diamond for your jewellery.',
  diamond_sourcing:   'Your diamond will be received and verified by our gemologists.',
  diamond_received:   'Our designers will create the precise digital blueprint of your jewellery.',
  cad_design:         'The design will be reviewed and approved before crafting begins.',
  cad_approved:       'A precise wax model will be created to verify the design.',
  wax_model:          'Your jewellery will be cast in precious metal by our master craftsmen.',
  casting:            'Your jewellery will be refined, filed and prepared for diamond setting.',
  filing_pre_polish:  'Our master setter will carefully place your diamond with precision.',
  diamond_setting:    'Your jewellery will receive its final polish to achieve a brilliant finish.',
  final_polish:       'Your jewellery will undergo our rigorous multi-point quality inspection.',
  quality_control:    'Your jewellery will be certified and hallmarked.',
  certification:      'Final photographs will be taken to document your jewellery.',
  final_photography:  'Your jewellery will be carefully packaged in our signature presentation box.',
  packaging:          'Your jewellery will be dispatched via secure courier.',
  ready_to_ship:      'Your jewellery will be collected by our courier partner.',
  shipped:            'Your jewellery is on its way to you.',
  in_transit:         'Your jewellery will be delivered to your address.',
  delivered:          'Your jewellery has been delivered. We hope you love it.',
};

// ── SERVICE FUNCTIONS ────────────────────────────────────────

export const productionService = {

  async getCustomerJobs(email: string): Promise<ProductionJob[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('production_jobs')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });
    if (error) { console.error('getCustomerJobs:', error.message); return []; }
    return data || [];
  },

  async getJobById(id: string): Promise<ProductionJob | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('production_jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) { console.error('getJobById:', error.message); return null; }
    return data;
  },

  async getJobByNumber(jobNumber: string): Promise<ProductionJob | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('production_jobs')
      .select('*')
      .eq('job_number', jobNumber)
      .maybeSingle();
    if (error) { console.error('getJobByNumber:', error.message); return null; }
    return data;
  },

  async getStageEvents(jobId: string): Promise<StageEvent[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('production_stage_events')
      .select('*')
      .eq('job_id', jobId)
      .eq('customer_visible', true)
      .order('created_at', { ascending: true });
    if (error) { console.error('getStageEvents:', error.message); return []; }
    return data || [];
  },

  async getAllStageEvents(jobId: string): Promise<StageEvent[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('production_stage_events')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });
    if (error) { console.error('getAllStageEvents:', error.message); return []; }
    return data || [];
  },

  async getLocationEvents(jobId: string, customerOnly = true): Promise<LocationEvent[]> {
    const supabase = createClient();
    let query = supabase
      .from('location_events')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    if (customerOnly) query = query.eq('customer_visible', true);
    const { data, error } = await query;
    if (error) { console.error('getLocationEvents:', error.message); return []; }
    return data || [];
  },

  async getNotifications(email: string): Promise<ProductionNotification[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('production_notifications')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });
    if (error) { console.error('getNotifications:', error.message); return []; }
    return data || [];
  },

  async markNotificationRead(id: string): Promise<void> {
    const supabase = createClient();
    await supabase.from('production_notifications').update({ is_read: true }).eq('id', id);
  },

  async getShipment(jobId: string): Promise<Shipment | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('job_id', jobId)
      .maybeSingle();
    if (error) { console.error('getShipment:', error.message); return null; }
    return data;
  },

  async getDocuments(jobId: string, customerOnly = true): Promise<any[]> {
    const supabase = createClient();
    let query = supabase
      .from('production_documents')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    if (customerOnly) query = query.eq('customer_visible', true);
    const { data, error } = await query;
    if (error) { console.error('getDocuments:', error.message); return []; }
    return data || [];
  },

  async getSupportTickets(email: string): Promise<SupportTicket[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });
    if (error) { console.error('getSupportTickets:', error.message); return []; }
    return data || [];
  },

  // ── INTERNAL / STAFF ──────────────────────────────────────

  async getAllJobs(): Promise<ProductionJob[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('production_jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('getAllJobs:', error.message); return []; }
    return data || [];
  },

  async updateJobStage(jobId: string, stage: string, notes?: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('production_jobs')
      .update({ current_stage: stage, updated_at: new Date().toISOString() })
      .eq('id', jobId);
    if (error) { console.error('updateJobStage:', error.message); return false; }
    return true;
  },

  async updateJobStatus(jobId: string, status: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
      .from('production_jobs')
      .update({ current_status: status, updated_at: new Date().toISOString() })
      .eq('id', jobId);
    if (error) { console.error('updateJobStatus:', error.message); return false; }
    return true;
  },

  async getAllDiamonds(): Promise<Diamond[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('diamonds')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('getAllDiamonds:', error.message); return []; }
    return data || [];
  },

  async getQCInspection(jobId: string): Promise<QCInspection | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('qc_inspections')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) { console.error('getQCInspection:', error.message); return null; }
    return data;
  },

  async createStageEvent(event: Partial<StageEvent>): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('production_stage_events').insert(event);
    if (error) { console.error('createStageEvent:', error.message); return false; }
    return true;
  },

  async createLocationEvent(event: Partial<LocationEvent>): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('location_events').insert(event);
    if (error) { console.error('createLocationEvent:', error.message); return false; }
    return true;
  },

  async createProductionJob(job: Partial<ProductionJob>): Promise<ProductionJob | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('production_jobs')
      .insert(job)
      .select()
      .single();
    if (error) { console.error('createProductionJob:', error.message); return null; }
    return data;
  },

  async getProductionStats(): Promise<{
    total: number; active: number; delayed: number; completed: number;
    byStage: Record<string, number>;
  }> {
    const supabase = createClient();
    const { data, error } = await supabase.from('production_jobs').select('current_stage, current_status');
    if (error || !data) return { total: 0, active: 0, delayed: 0, completed: 0, byStage: {} };
    const byStage: Record<string, number> = {};
    let active = 0, delayed = 0, completed = 0;
    data.forEach(j => {
      byStage[j.current_stage] = (byStage[j.current_stage] || 0) + 1;
      if (j.current_status === 'active') active++;
      if (j.current_status === 'delayed') delayed++;
      if (j.current_stage === 'delivered') completed++;
    });
    return { total: data.length, active, delayed, completed, byStage };
  },
};
