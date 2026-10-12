-- Email logs table for DETARA transactional email tracking
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type text NOT NULL,
  recipient text NOT NULL,
  subject text,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_logs_type_idx ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS email_logs_status_idx ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON public.email_logs(created_at DESC);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs
CREATE POLICY "email_logs_admin_read" ON public.email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Service role can insert
CREATE POLICY "email_logs_service_insert" ON public.email_logs
  FOR INSERT WITH CHECK (true);
