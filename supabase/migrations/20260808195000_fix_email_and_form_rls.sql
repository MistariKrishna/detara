-- Fix RLS policies for public form submissions
-- Ensures anon users can insert into contact_messages, concierge_leads, newsletter_subscribers
-- Orders and concierge leads use service role key from API routes (bypasses RLS)
-- This migration adds explicit anon INSERT policies for tables that need them

-- ─── contact_messages: allow anon inserts ────────────────────────────────────
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact_messages" ON public.contact_messages;
CREATE POLICY "anon_insert_contact_messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_contact_messages" ON public.contact_messages;
CREATE POLICY "admin_read_contact_messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (true);

-- ─── newsletter_subscribers: allow anon inserts ───────────────────────────────
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_newsletter_subscribers" ON public.newsletter_subscribers;
CREATE POLICY "anon_insert_newsletter_subscribers"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_newsletter_subscribers" ON public.newsletter_subscribers;
CREATE POLICY "admin_read_newsletter_subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (true);

-- ─── concierge_leads: allow anon inserts (service role also bypasses RLS) ────
ALTER TABLE public.concierge_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_concierge_leads" ON public.concierge_leads;
CREATE POLICY "anon_insert_concierge_leads"
ON public.concierge_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_concierge_leads" ON public.concierge_leads;
CREATE POLICY "admin_read_concierge_leads"
ON public.concierge_leads
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "admin_update_concierge_leads" ON public.concierge_leads;
CREATE POLICY "admin_update_concierge_leads"
ON public.concierge_leads
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ─── orders: service role handles inserts from API, but allow authenticated reads ─
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
CREATE POLICY "anon_insert_orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "admin_manage_orders" ON public.orders;
CREATE POLICY "admin_manage_orders"
ON public.orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ─── email_logs: allow service role writes, admin reads ──────────────────────
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_email_logs" ON public.email_logs;
CREATE POLICY "admin_read_email_logs"
ON public.email_logs
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "service_insert_email_logs" ON public.email_logs;
CREATE POLICY "service_insert_email_logs"
ON public.email_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
