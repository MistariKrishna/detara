-- ============================================================
-- DETARA PRODUCTION LIFECYCLE & TRACEABILITY PLATFORM
-- Migration: 20260822090000_detara_production_lifecycle.sql
-- ============================================================

-- ============================================================
-- SECTION 1: ENUM TYPES
-- ============================================================

DROP TYPE IF EXISTS public.production_stage CASCADE;
CREATE TYPE public.production_stage AS ENUM (
  'order_confirmed',
  'payment_verified',
  'production_planned',
  'diamond_sourcing',
  'diamond_received',
  'cad_design',
  'cad_approved',
  'wax_model',
  'casting',
  'filing_pre_polish',
  'diamond_setting',
  'final_polish',
  'quality_control',
  'certification',
  'final_photography',
  'packaging',
  'ready_to_ship',
  'shipped',
  'in_transit',
  'delivered',
  'on_hold',
  'delayed',
  'rework',
  'cancelled',
  'returned'
);

DROP TYPE IF EXISTS public.production_job_status CASCADE;
CREATE TYPE public.production_job_status AS ENUM (
  'active', 'on_hold', 'delayed', 'rework', 'completed', 'cancelled'
);

DROP TYPE IF EXISTS public.diamond_status CASCADE;
CREATE TYPE public.diamond_status AS ENUM (
  'requirement_created', 'supplier_search', 'supplier_selected',
  'purchase_order', 'purchased', 'in_transit', 'received',
  'certificate_verified', 'approved', 'assigned', 'set', 'qc_approved'
);

DROP TYPE IF EXISTS public.cad_status CASCADE;
CREATE TYPE public.cad_status AS ENUM (
  'required', 'designer_assigned', 'in_progress', 'version_created',
  'internal_review', 'customer_approval_required', 'approved'
);

DROP TYPE IF EXISTS public.qc_status CASCADE;
CREATE TYPE public.qc_status AS ENUM (
  'pending', 'in_progress', 'passed', 'failed', 'rework_required'
);

DROP TYPE IF EXISTS public.shipment_status CASCADE;
CREATE TYPE public.shipment_status AS ENUM (
  'ready_to_ship', 'label_created', 'picked_up', 'in_transit',
  'customs', 'out_for_delivery', 'delivered', 'exception'
);

DROP TYPE IF EXISTS public.staff_role CASCADE;
CREATE TYPE public.staff_role AS ENUM (
  'super_admin', 'customer_support', 'production_manager', 'diamond_manager',
  'cad_designer', 'manufacturing_staff', 'qc_manager', 'fulfilment_staff',
  'finance', 'customer'
);

DROP TYPE IF EXISTS public.document_type CASCADE;
CREATE TYPE public.document_type AS ENUM (
  'invoice', 'diamond_certificate', 'jewellery_certificate', 'warranty',
  'care_guide', 'hallmark_document', 'cad_file', 'qc_photo',
  'production_photo', 'supplier_invoice', 'purchase_order', 'other'
);

DROP TYPE IF EXISTS public.notification_type CASCADE;
CREATE TYPE public.notification_type AS ENUM (
  'order_confirmed', 'payment_confirmed', 'production_started',
  'diamond_selected', 'diamond_verified', 'cad_ready', 'cad_approved',
  'manufacturing_started', 'casting_completed', 'diamond_setting_started',
  'qc_passed', 'certification_completed', 'packaging_completed',
  'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered',
  'delay', 'customer_approval_required', 'general'
);

-- ============================================================
-- SECTION 2: CORE TABLES
-- ============================================================

-- Staff / Internal Users
CREATE TABLE IF NOT EXISTS public.production_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role public.staff_role NOT NULL DEFAULT 'manufacturing_staff',
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Production Jobs (core entity linking orders to production)
CREATE TABLE IF NOT EXISTS public.production_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
  order_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  product_name TEXT,
  sku TEXT,
  metal TEXT,
  diamond_spec TEXT,
  ring_size TEXT,
  quantity INTEGER DEFAULT 1,
  order_value NUMERIC(12,2),
  production_type TEXT DEFAULT 'made_to_order',
  manager_id UUID REFERENCES public.production_staff(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  current_stage public.production_stage DEFAULT 'order_confirmed',
  current_status public.production_job_status DEFAULT 'active',
  current_location TEXT,
  current_city TEXT,
  current_country TEXT DEFAULT 'India',
  current_department TEXT,
  target_completion DATE,
  estimated_dispatch DATE,
  estimated_delivery DATE,
  actual_completion DATE,
  actual_delivery DATE,
  internal_notes TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Production Stage History (timeline events)
CREATE TABLE IF NOT EXISTS public.production_stage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  stage public.production_stage NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  location TEXT,
  city TEXT,
  country TEXT,
  department TEXT,
  customer_message TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES public.production_staff(id) ON DELETE SET NULL,
  customer_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Location Events
CREATE TABLE IF NOT EXISTS public.location_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  city TEXT,
  country TEXT DEFAULT 'India',
  department TEXT,
  stage public.production_stage,
  arrival_at TIMESTAMPTZ,
  departure_at TIMESTAMPTZ,
  status TEXT DEFAULT 'current',
  notes TEXT,
  created_by UUID REFERENCES public.production_staff(id) ON DELETE SET NULL,
  customer_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Diamond Suppliers (internal only)
CREATE TABLE IF NOT EXISTS public.diamond_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  country TEXT,
  specialization TEXT,
  rating NUMERIC(3,1),
  is_active BOOLEAN DEFAULT true,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Diamond Inventory
CREATE TABLE IF NOT EXISTS public.diamonds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stone_id TEXT NOT NULL UNIQUE,
  certificate_number TEXT,
  diamond_type TEXT DEFAULT 'natural' CHECK (diamond_type IN ('natural','lab_grown')),
  shape TEXT,
  carat NUMERIC(6,3),
  colour TEXT,
  clarity TEXT,
  cut TEXT,
  measurements TEXT,
  supplier_id UUID REFERENCES public.diamond_suppliers(id) ON DELETE SET NULL,
  purchase_cost NUMERIC(12,2),
  purchase_date DATE,
  certificate_file_url TEXT,
  diamond_status public.diamond_status DEFAULT 'received',
  assigned_job_id UUID REFERENCES public.production_jobs(id) ON DELETE SET NULL,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CAD Jobs
CREATE TABLE IF NOT EXISTS public.cad_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  designer_id UUID REFERENCES public.production_staff(id) ON DELETE SET NULL,
  cad_status public.cad_status DEFAULT 'required',
  current_version INTEGER DEFAULT 0,
  cad_file_url TEXT,
  render_url TEXT,
  customer_approval_required BOOLEAN DEFAULT false,
  customer_approved_at TIMESTAMPTZ,
  approved_by TEXT,
  internal_notes TEXT,
  revision_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Manufacturing Jobs
CREATE TABLE IF NOT EXISTS public.manufacturing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  assigned_staff_id UUID REFERENCES public.production_staff(id) ON DELETE SET NULL,
  metal TEXT,
  metal_weight NUMERIC(8,3),
  job_status TEXT DEFAULT 'pending' CHECK (job_status IN ('pending','in_progress','completed','failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- QC Inspections
CREATE TABLE IF NOT EXISTS public.qc_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES public.production_staff(id) ON DELETE SET NULL,
  qc_status public.qc_status DEFAULT 'pending',
  checklist JSONB DEFAULT '{}',
  failure_notes TEXT,
  customer_message TEXT,
  inspected_at TIMESTAMPTZ,
  passed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rework Jobs
CREATE TABLE IF NOT EXISTS public.rework_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  qc_inspection_id UUID REFERENCES public.qc_inspections(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  assigned_staff_id UUID REFERENCES public.production_staff(id) ON DELETE SET NULL,
  rework_status TEXT DEFAULT 'pending' CHECK (rework_status IN ('pending','in_progress','completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Certificates
CREATE TABLE IF NOT EXISTS public.jewellery_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  diamond_id UUID REFERENCES public.diamonds(id) ON DELETE SET NULL,
  certificate_type TEXT,
  certificate_number TEXT,
  issuer TEXT,
  file_url TEXT,
  issued_date DATE,
  verified_at TIMESTAMPTZ,
  cert_status TEXT DEFAULT 'required' CHECK (cert_status IN ('required','submitted','processing','received','verified','completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Packaging Jobs
CREATE TABLE IF NOT EXISTS public.packaging_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES public.production_staff(id) ON DELETE SET NULL,
  packaging_status TEXT DEFAULT 'not_started' CHECK (packaging_status IN ('not_started','in_progress','completed','qc_passed')),
  includes_jewellery BOOLEAN DEFAULT true,
  includes_box BOOLEAN DEFAULT true,
  includes_certificate BOOLEAN DEFAULT true,
  includes_warranty BOOLEAN DEFAULT true,
  includes_care_guide BOOLEAN DEFAULT true,
  includes_invoice BOOLEAN DEFAULT true,
  final_inspection_passed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Shipments
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  courier TEXT,
  shipping_method TEXT,
  tracking_number TEXT,
  awb_number TEXT,
  destination_address TEXT,
  destination_city TEXT,
  destination_country TEXT,
  ship_date DATE,
  estimated_delivery DATE,
  actual_delivery DATE,
  shipment_status public.shipment_status DEFAULT 'ready_to_ship',
  tracking_events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Production Documents
CREATE TABLE IF NOT EXISTS public.production_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  document_type public.document_type NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  customer_visible BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES public.production_staff(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer Notifications
CREATE TABLE IF NOT EXISTS public.production_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  customer_email TEXT,
  notification_type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  job_id UUID REFERENCES public.production_jobs(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  ticket_status TEXT DEFAULT 'open' CHECK (ticket_status IN ('open','in_progress','resolved','closed')),
  assigned_agent_id UUID REFERENCES public.production_staff(id) ON DELETE SET NULL,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Production Audit Log
CREATE TABLE IF NOT EXISTS public.production_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.production_staff(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  previous_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 3: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_production_jobs_order_id ON public.production_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_stage ON public.production_jobs(current_stage);
CREATE INDEX IF NOT EXISTS idx_production_jobs_status ON public.production_jobs(current_status);
CREATE INDEX IF NOT EXISTS idx_production_jobs_customer_email ON public.production_jobs(customer_email);
CREATE INDEX IF NOT EXISTS idx_stage_events_job_id ON public.production_stage_events(job_id);
CREATE INDEX IF NOT EXISTS idx_location_events_job_id ON public.location_events(job_id);
CREATE INDEX IF NOT EXISTS idx_diamonds_stone_id ON public.diamonds(stone_id);
CREATE INDEX IF NOT EXISTS idx_diamonds_assigned_job ON public.diamonds(assigned_job_id);
CREATE INDEX IF NOT EXISTS idx_cad_jobs_job_id ON public.cad_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_qc_inspections_job_id ON public.qc_inspections(job_id);
CREATE INDEX IF NOT EXISTS idx_shipments_job_id ON public.shipments(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_email ON public.production_notifications(customer_email);
CREATE INDEX IF NOT EXISTS idx_notifications_job_id ON public.production_notifications(job_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_email ON public.support_tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_production_audit_entity ON public.production_audit_logs(entity_type, entity_id);

-- ============================================================
-- SECTION 4: HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_production_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.production_staff ps
  WHERE ps.user_id = auth.uid() AND ps.is_active = true
)
$$;

CREATE OR REPLACE FUNCTION public.get_staff_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT ps.role::TEXT FROM public.production_staff ps
WHERE ps.user_id = auth.uid() AND ps.is_active = true
LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_production_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.production_staff ps
  WHERE ps.user_id = auth.uid()
    AND ps.is_active = true
    AND ps.role IN ('super_admin','production_manager')
)
$$;

-- ============================================================
-- SECTION 5: RLS
-- ============================================================

ALTER TABLE public.production_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_stage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cad_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rework_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewellery_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_audit_logs ENABLE ROW LEVEL SECURITY;

-- Production staff: full access for staff, customers see nothing
DROP POLICY IF EXISTS "staff_manage_production_staff" ON public.production_staff;
CREATE POLICY "staff_manage_production_staff" ON public.production_staff
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

-- Production jobs: staff full access, customers see their own (by email)
DROP POLICY IF EXISTS "staff_manage_production_jobs" ON public.production_jobs;
CREATE POLICY "staff_manage_production_jobs" ON public.production_jobs
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

DROP POLICY IF EXISTS "customers_view_own_jobs" ON public.production_jobs;
CREATE POLICY "customers_view_own_jobs" ON public.production_jobs
FOR SELECT TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1));

-- Stage events: staff full, customers see visible ones for their jobs
DROP POLICY IF EXISTS "staff_manage_stage_events" ON public.production_stage_events;
CREATE POLICY "staff_manage_stage_events" ON public.production_stage_events
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

DROP POLICY IF EXISTS "customers_view_stage_events" ON public.production_stage_events;
CREATE POLICY "customers_view_stage_events" ON public.production_stage_events
FOR SELECT TO authenticated
USING (
  customer_visible = true AND
  EXISTS (
    SELECT 1 FROM public.production_jobs pj
    WHERE pj.id = job_id
    AND pj.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
  )
);

-- Location events: same pattern
DROP POLICY IF EXISTS "staff_manage_location_events" ON public.location_events;
CREATE POLICY "staff_manage_location_events" ON public.location_events
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

DROP POLICY IF EXISTS "customers_view_location_events" ON public.location_events;
CREATE POLICY "customers_view_location_events" ON public.location_events
FOR SELECT TO authenticated
USING (
  customer_visible = true AND
  EXISTS (
    SELECT 1 FROM public.production_jobs pj
    WHERE pj.id = job_id
    AND pj.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
  )
);

-- Diamond suppliers: internal only
DROP POLICY IF EXISTS "staff_manage_diamond_suppliers" ON public.diamond_suppliers;
CREATE POLICY "staff_manage_diamond_suppliers" ON public.diamond_suppliers
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

-- Diamonds: internal only
DROP POLICY IF EXISTS "staff_manage_diamonds" ON public.diamonds;
CREATE POLICY "staff_manage_diamonds" ON public.diamonds
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

-- CAD jobs: staff full
DROP POLICY IF EXISTS "staff_manage_cad_jobs" ON public.cad_jobs;
CREATE POLICY "staff_manage_cad_jobs" ON public.cad_jobs
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

-- Manufacturing jobs: staff full
DROP POLICY IF EXISTS "staff_manage_manufacturing_jobs" ON public.manufacturing_jobs;
CREATE POLICY "staff_manage_manufacturing_jobs" ON public.manufacturing_jobs
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

-- QC: staff full
DROP POLICY IF EXISTS "staff_manage_qc_inspections" ON public.qc_inspections;
CREATE POLICY "staff_manage_qc_inspections" ON public.qc_inspections
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

-- Rework: staff full
DROP POLICY IF EXISTS "staff_manage_rework_jobs" ON public.rework_jobs;
CREATE POLICY "staff_manage_rework_jobs" ON public.rework_jobs
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

-- Certificates: staff full, customers see their own
DROP POLICY IF EXISTS "staff_manage_certificates" ON public.jewellery_certificates;
CREATE POLICY "staff_manage_certificates" ON public.jewellery_certificates
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

DROP POLICY IF EXISTS "customers_view_certificates" ON public.jewellery_certificates;
CREATE POLICY "customers_view_certificates" ON public.jewellery_certificates
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.production_jobs pj
    WHERE pj.id = job_id
    AND pj.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
  )
);

-- Packaging: staff full
DROP POLICY IF EXISTS "staff_manage_packaging" ON public.packaging_jobs;
CREATE POLICY "staff_manage_packaging" ON public.packaging_jobs
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

-- Shipments: staff full, customers see their own
DROP POLICY IF EXISTS "staff_manage_shipments" ON public.shipments;
CREATE POLICY "staff_manage_shipments" ON public.shipments
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

DROP POLICY IF EXISTS "customers_view_shipments" ON public.shipments;
CREATE POLICY "customers_view_shipments" ON public.shipments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.production_jobs pj
    WHERE pj.id = job_id
    AND pj.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
  )
);

-- Documents: staff full, customers see visible ones
DROP POLICY IF EXISTS "staff_manage_documents" ON public.production_documents;
CREATE POLICY "staff_manage_documents" ON public.production_documents
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

DROP POLICY IF EXISTS "customers_view_documents" ON public.production_documents;
CREATE POLICY "customers_view_documents" ON public.production_documents
FOR SELECT TO authenticated
USING (
  customer_visible = true AND
  EXISTS (
    SELECT 1 FROM public.production_jobs pj
    WHERE pj.id = job_id
    AND pj.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
  )
);

-- Notifications: staff full, customers see their own
DROP POLICY IF EXISTS "staff_manage_notifications" ON public.production_notifications;
CREATE POLICY "staff_manage_notifications" ON public.production_notifications
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

DROP POLICY IF EXISTS "customers_view_notifications" ON public.production_notifications;
CREATE POLICY "customers_view_notifications" ON public.production_notifications
FOR SELECT TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "customers_update_notifications" ON public.production_notifications;
CREATE POLICY "customers_update_notifications" ON public.production_notifications
FOR UPDATE TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
WITH CHECK (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1));

-- Support tickets: staff full, customers see their own
DROP POLICY IF EXISTS "staff_manage_support_tickets" ON public.support_tickets;
CREATE POLICY "staff_manage_support_tickets" ON public.support_tickets
FOR ALL TO authenticated USING (public.is_production_staff()) WITH CHECK (public.is_production_staff());

DROP POLICY IF EXISTS "customers_manage_support_tickets" ON public.support_tickets;
CREATE POLICY "customers_manage_support_tickets" ON public.support_tickets
FOR ALL TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1))
WITH CHECK (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1));

-- Audit logs: staff read only, no delete for non-admins
DROP POLICY IF EXISTS "staff_view_audit_logs" ON public.production_audit_logs;
CREATE POLICY "staff_view_audit_logs" ON public.production_audit_logs
FOR SELECT TO authenticated USING (public.is_production_staff());

DROP POLICY IF EXISTS "staff_insert_audit_logs" ON public.production_audit_logs;
CREATE POLICY "staff_insert_audit_logs" ON public.production_audit_logs
FOR INSERT TO authenticated WITH CHECK (public.is_production_staff());

-- ============================================================
-- SECTION 6: UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_production_jobs ON public.production_jobs;
CREATE TRIGGER set_updated_at_production_jobs
  BEFORE UPDATE ON public.production_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_diamonds ON public.diamonds;
CREATE TRIGGER set_updated_at_diamonds
  BEFORE UPDATE ON public.diamonds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_cad_jobs ON public.cad_jobs;
CREATE TRIGGER set_updated_at_cad_jobs
  BEFORE UPDATE ON public.cad_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_qc_inspections ON public.qc_inspections;
CREATE TRIGGER set_updated_at_qc_inspections
  BEFORE UPDATE ON public.qc_inspections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_shipments ON public.shipments;
CREATE TRIGGER set_updated_at_shipments
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- SECTION 7: DEMO / SEED DATA
-- ============================================================

DO $$
DECLARE
  v_staff1 UUID := gen_random_uuid();
  v_staff2 UUID := gen_random_uuid();
  v_staff3 UUID := gen_random_uuid();
  v_supplier1 UUID := gen_random_uuid();
  v_supplier2 UUID := gen_random_uuid();
  v_job1 UUID := gen_random_uuid();
  v_job2 UUID := gen_random_uuid();
  v_job3 UUID := gen_random_uuid();
  v_diamond1 UUID := gen_random_uuid();
  v_diamond2 UUID := gen_random_uuid();
  v_diamond3 UUID := gen_random_uuid();
  v_existing_order UUID;
BEGIN

  -- Demo staff
  INSERT INTO public.production_staff (id, full_name, email, role, department, is_active)
  VALUES
    (v_staff1, 'Arjun Mehta', 'arjun.mehta@detara.store', 'production_manager', 'Production', true),
    (v_staff2, 'Priya Sharma', 'priya.sharma@detara.store', 'cad_designer', 'Design', true),
    (v_staff3, 'Rahul Verma', 'rahul.verma@detara.store', 'qc_manager', 'Quality Control', true)
  ON CONFLICT (email) DO NOTHING;

  -- Demo diamond suppliers (internal only)
  INSERT INTO public.diamond_suppliers (id, name, contact_name, email, city, country, specialization, rating, is_demo)
  VALUES
    (v_supplier1, 'Surat Diamond House', 'Kiran Patel', 'kiran@suratdiamond.com', 'Surat', 'India', 'Round Brilliant, Princess', 4.8, true),
    (v_supplier2, 'Mumbai Gem Traders', 'Anil Shah', 'anil@mumbaigemtraders.com', 'Mumbai', 'India', 'Oval, Cushion, Emerald', 4.6, true)
  ON CONFLICT DO NOTHING;

  -- Get an existing order if available
  SELECT id INTO v_existing_order FROM public.orders LIMIT 1;

  -- Demo Production Job 1 — Diamond Setting stage
  INSERT INTO public.production_jobs (
    id, job_number, order_id, order_number, customer_name, customer_email,
    product_name, sku, metal, diamond_spec, ring_size, quantity, order_value,
    current_stage, current_status, current_location, current_city, current_country,
    current_department, target_completion, estimated_dispatch, estimated_delivery,
    internal_notes, is_demo
  ) VALUES (
    v_job1, 'DPJ-2026-0001', v_existing_order, 'DT-2026-00001',
    'Ananya Krishnan', 'demo.customer@detara.store',
    'Solitaire Diamond Ring', 'DTR-SOL-001', '18K White Gold',
    '1.02ct F VS1 Round Brilliant GIA', 'US 6', 1, 285000,
    'diamond_setting', 'active',
    'DETARA Atelier, Mumbai', 'Mumbai', 'India', 'Setting Department',
    (CURRENT_DATE + INTERVAL '12 days')::DATE,
    (CURRENT_DATE + INTERVAL '14 days')::DATE,
    (CURRENT_DATE + INTERVAL '18 days')::DATE,
    '[DEMO] Customer is VIP. Handle with priority.', true
  ) ON CONFLICT (job_number) DO NOTHING;

  -- Demo Production Job 2 — CAD stage
  INSERT INTO public.production_jobs (
    id, job_number, order_number, customer_name, customer_email,
    product_name, sku, metal, diamond_spec, ring_size, quantity, order_value,
    current_stage, current_status, current_location, current_city, current_country,
    current_department, target_completion, estimated_dispatch, estimated_delivery,
    is_demo
  ) VALUES (
    v_job2, 'DPJ-2026-0002', 'DT-2026-00002',
    'Rohan Kapoor', 'rohan.kapoor@example.com',
    'Three-Stone Engagement Ring', 'DTR-3ST-002', '22K Yellow Gold',
    '0.75ct E VVS2 Oval + 2x 0.25ct Side Stones', 'US 7', 1, 195000,
    'cad_design', 'active',
    'DETARA Design Studio', 'Mumbai', 'India', 'CAD Department',
    (CURRENT_DATE + INTERVAL '25 days')::DATE,
    (CURRENT_DATE + INTERVAL '27 days')::DATE,
    (CURRENT_DATE + INTERVAL '32 days')::DATE,
    true
  ) ON CONFLICT (job_number) DO NOTHING;

  -- Demo Production Job 3 — QC stage
  INSERT INTO public.production_jobs (
    id, job_number, order_number, customer_name, customer_email,
    product_name, sku, metal, diamond_spec, quantity, order_value,
    current_stage, current_status, current_location, current_city, current_country,
    current_department, target_completion, estimated_dispatch, estimated_delivery,
    is_demo
  ) VALUES (
    v_job3, 'DPJ-2026-0003', 'DT-2026-00003',
    'Meera Nair', 'meera.nair@example.com',
    'Diamond Tennis Bracelet', 'DTB-TEN-003', '18K White Gold',
    '3.50ct Total Weight, F-G VS1-VS2 Round Brilliant', 1, 520000,
    'quality_control', 'active',
    'DETARA QC Lab, Mumbai', 'Mumbai', 'India', 'Quality Control',
    (CURRENT_DATE + INTERVAL '5 days')::DATE,
    (CURRENT_DATE + INTERVAL '7 days')::DATE,
    (CURRENT_DATE + INTERVAL '10 days')::DATE,
    true
  ) ON CONFLICT (job_number) DO NOTHING;

  -- Stage events for Job 1
  INSERT INTO public.production_stage_events (job_id, stage, status, completed_at, location, city, department, customer_message, customer_visible)
  VALUES
    (v_job1, 'order_confirmed', 'completed', now() - INTERVAL '30 days', 'DETARA HQ', 'Mumbai', 'Customer Service', 'Your order has been confirmed. We are delighted to begin crafting your jewellery.', true),
    (v_job1, 'payment_verified', 'completed', now() - INTERVAL '29 days', 'DETARA HQ', 'Mumbai', 'Finance', 'Your payment has been verified. Your jewellery journey begins now.', true),
    (v_job1, 'production_planned', 'completed', now() - INTERVAL '28 days', 'DETARA Atelier', 'Mumbai', 'Production', 'Your jewellery has been scheduled for production by our master craftsmen.', true),
    (v_job1, 'diamond_sourcing', 'completed', now() - INTERVAL '25 days', 'DETARA Atelier', 'Mumbai', 'Diamond Department', 'We are carefully selecting the perfect diamond for your jewellery.', true),
    (v_job1, 'diamond_received', 'completed', now() - INTERVAL '20 days', 'DETARA Atelier', 'Mumbai', 'Diamond Department', 'Your diamond has been received and verified by our gemologists.', true),
    (v_job1, 'cad_design', 'completed', now() - INTERVAL '18 days', 'DETARA Design Studio', 'Mumbai', 'CAD Department', 'Our designers are creating the precise digital blueprint of your jewellery.', true),
    (v_job1, 'cad_approved', 'completed', now() - INTERVAL '15 days', 'DETARA Design Studio', 'Mumbai', 'CAD Department', 'The design has been approved and is ready for crafting.', true),
    (v_job1, 'wax_model', 'completed', now() - INTERVAL '12 days', 'DETARA Atelier', 'Mumbai', 'Manufacturing', 'A precise wax model of your jewellery has been created.', true),
    (v_job1, 'casting', 'completed', now() - INTERVAL '10 days', 'DETARA Atelier', 'Mumbai', 'Manufacturing', 'Your jewellery is being cast in precious metal by our master craftsmen.', true),
    (v_job1, 'filing_pre_polish', 'completed', now() - INTERVAL '7 days', 'DETARA Atelier', 'Mumbai', 'Manufacturing', 'Your jewellery is being refined and prepared for diamond setting.', true),
    (v_job1, 'diamond_setting', 'in_progress', now() - INTERVAL '2 days', 'DETARA Atelier', 'Mumbai', 'Setting Department', 'Our master setter is carefully placing your diamond with precision.', true)
  ON CONFLICT DO NOTHING;

  -- Stage events for Job 2
  INSERT INTO public.production_stage_events (job_id, stage, status, completed_at, location, city, department, customer_message, customer_visible)
  VALUES
    (v_job2, 'order_confirmed', 'completed', now() - INTERVAL '10 days', 'DETARA HQ', 'Mumbai', 'Customer Service', 'Your order has been confirmed.', true),
    (v_job2, 'payment_verified', 'completed', now() - INTERVAL '9 days', 'DETARA HQ', 'Mumbai', 'Finance', 'Payment verified. Your journey begins.', true),
    (v_job2, 'production_planned', 'completed', now() - INTERVAL '8 days', 'DETARA Atelier', 'Mumbai', 'Production', 'Production scheduled.', true),
    (v_job2, 'diamond_sourcing', 'completed', now() - INTERVAL '6 days', 'DETARA Atelier', 'Mumbai', 'Diamond Department', 'Diamond selection in progress.', true),
    (v_job2, 'diamond_received', 'completed', now() - INTERVAL '3 days', 'DETARA Atelier', 'Mumbai', 'Diamond Department', 'Diamonds received and verified.', true),
    (v_job2, 'cad_design', 'in_progress', now() - INTERVAL '1 day', 'DETARA Design Studio', 'Mumbai', 'CAD Department', 'Our designers are creating your bespoke design.', true)
  ON CONFLICT DO NOTHING;

  -- Stage events for Job 3
  INSERT INTO public.production_stage_events (job_id, stage, status, completed_at, location, city, department, customer_message, customer_visible)
  VALUES
    (v_job3, 'order_confirmed', 'completed', now() - INTERVAL '45 days', 'DETARA HQ', 'Mumbai', 'Customer Service', 'Order confirmed.', true),
    (v_job3, 'payment_verified', 'completed', now() - INTERVAL '44 days', 'DETARA HQ', 'Mumbai', 'Finance', 'Payment verified.', true),
    (v_job3, 'production_planned', 'completed', now() - INTERVAL '43 days', 'DETARA Atelier', 'Mumbai', 'Production', 'Production scheduled.', true),
    (v_job3, 'diamond_sourcing', 'completed', now() - INTERVAL '40 days', 'DETARA Atelier', 'Mumbai', 'Diamond Department', 'Diamonds selected.', true),
    (v_job3, 'diamond_received', 'completed', now() - INTERVAL '35 days', 'DETARA Atelier', 'Mumbai', 'Diamond Department', 'Diamonds verified.', true),
    (v_job3, 'cad_design', 'completed', now() - INTERVAL '32 days', 'DETARA Design Studio', 'Mumbai', 'CAD Department', 'Design completed.', true),
    (v_job3, 'cad_approved', 'completed', now() - INTERVAL '30 days', 'DETARA Design Studio', 'Mumbai', 'CAD Department', 'Design approved.', true),
    (v_job3, 'wax_model', 'completed', now() - INTERVAL '27 days', 'DETARA Atelier', 'Mumbai', 'Manufacturing', 'Wax model completed.', true),
    (v_job3, 'casting', 'completed', now() - INTERVAL '24 days', 'DETARA Atelier', 'Mumbai', 'Manufacturing', 'Casting completed.', true),
    (v_job3, 'filing_pre_polish', 'completed', now() - INTERVAL '20 days', 'DETARA Atelier', 'Mumbai', 'Manufacturing', 'Pre-polish completed.', true),
    (v_job3, 'diamond_setting', 'completed', now() - INTERVAL '15 days', 'DETARA Atelier', 'Mumbai', 'Setting Department', 'Diamond setting completed.', true),
    (v_job3, 'final_polish', 'completed', now() - INTERVAL '12 days', 'DETARA Atelier', 'Mumbai', 'Manufacturing', 'Final polish completed.', true),
    (v_job3, 'quality_control', 'in_progress', now() - INTERVAL '2 days', 'DETARA QC Lab', 'Mumbai', 'Quality Control', 'Your jewellery is undergoing our rigorous quality inspection.', true)
  ON CONFLICT DO NOTHING;

  -- Location events for Job 1
  INSERT INTO public.location_events (job_id, location_name, city, country, department, stage, arrival_at, status, customer_visible)
  VALUES
    (v_job1, 'DETARA HQ', 'Mumbai', 'India', 'Customer Service', 'order_confirmed', now() - INTERVAL '30 days', 'departed', true),
    (v_job1, 'DETARA Design Studio', 'Mumbai', 'India', 'CAD Department', 'cad_design', now() - INTERVAL '18 days', 'departed', true),
    (v_job1, 'DETARA Atelier', 'Mumbai', 'India', 'Setting Department', 'diamond_setting', now() - INTERVAL '2 days', 'current', true)
  ON CONFLICT DO NOTHING;

  -- Demo diamonds
  INSERT INTO public.diamonds (id, stone_id, certificate_number, diamond_type, shape, carat, colour, clarity, cut, measurements, supplier_id, diamond_status, assigned_job_id, is_demo)
  VALUES
    (v_diamond1, 'DIA-2026-0001', 'GIA-7461829304', 'natural', 'Round Brilliant', 1.02, 'F', 'VS1', 'Excellent', '6.42-6.45 x 3.98mm', v_supplier1, 'set', v_job1, true),
    (v_diamond2, 'DIA-2026-0002', 'GIA-8293041567', 'natural', 'Oval', 0.75, 'E', 'VVS2', 'Excellent', '7.82 x 5.61 x 3.52mm', v_supplier2, 'approved', v_job2, true),
    (v_diamond3, 'DIA-2026-0003', 'IGI-2026-TEN-001', 'natural', 'Round Brilliant', 3.50, 'F-G', 'VS1-VS2', 'Very Good', 'Multiple stones', v_supplier1, 'set', v_job3, true)
  ON CONFLICT (stone_id) DO NOTHING;

  -- CAD jobs
  INSERT INTO public.cad_jobs (job_id, designer_id, cad_status, current_version, customer_approval_required)
  VALUES
    (v_job1, v_staff2, 'approved', 2, false),
    (v_job2, v_staff2, 'in_progress', 1, true),
    (v_job3, v_staff2, 'approved', 1, false)
  ON CONFLICT DO NOTHING;

  -- QC inspection for Job 3
  INSERT INTO public.qc_inspections (job_id, inspector_id, qc_status, checklist, inspected_at)
  VALUES (
    v_job3, v_staff3, 'in_progress',
    '{"metal_purity": "pending", "dimensions": "passed", "diamond_count": "passed", "certificates": "passed", "surface_finish": "pending", "prong_security": "pending", "symmetry": "pending", "cad_match": "passed"}',
    now() - INTERVAL '2 days'
  ) ON CONFLICT DO NOTHING;

  -- Notifications for demo customer
  INSERT INTO public.production_notifications (job_id, customer_email, notification_type, title, message, is_read, sent_at)
  VALUES
    (v_job1, 'demo.customer@detara.store', 'order_confirmed', 'Order Confirmed', 'Your order DPJ-2026-0001 has been confirmed. We are honoured to craft your jewellery.', true, now() - INTERVAL '30 days'),
    (v_job1, 'demo.customer@detara.store', 'payment_confirmed', 'Payment Verified', 'Your payment has been verified. Your jewellery journey has officially begun.', true, now() - INTERVAL '29 days'),
    (v_job1, 'demo.customer@detara.store', 'diamond_verified', 'Diamond Selected & Verified', 'Your diamond has been carefully selected and verified by our gemologists.', true, now() - INTERVAL '20 days'),
    (v_job1, 'demo.customer@detara.store', 'cad_approved', 'Design Approved', 'The design blueprint for your jewellery has been approved and crafting has begun.', true, now() - INTERVAL '15 days'),
    (v_job1, 'demo.customer@detara.store', 'diamond_setting_started', 'Diamond Setting Underway', 'Our master setter has begun the delicate process of setting your diamond.', false, now() - INTERVAL '2 days')
  ON CONFLICT DO NOTHING;

  -- Support ticket
  INSERT INTO public.support_tickets (ticket_number, customer_email, customer_name, job_id, subject, priority, ticket_status, messages)
  VALUES (
    'TKT-2026-0001', 'demo.customer@detara.store', 'Ananya Krishnan', v_job1,
    'Query about estimated delivery date', 'normal', 'resolved',
    '[{"from": "customer", "message": "Could you please confirm the estimated delivery date for my ring?", "timestamp": "2026-08-10T10:00:00Z"}, {"from": "agent", "message": "Your ring is currently in the diamond setting stage and is on track for delivery by the estimated date. We will notify you as soon as it is ready to ship.", "timestamp": "2026-08-10T14:30:00Z"}]'
  ) ON CONFLICT (ticket_number) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Demo data insertion error: %', SQLERRM;
END $$;
