-- Create newsletter_subscribers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  source text DEFAULT 'footer',
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT newsletter_subscribers_email_key UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (subscribe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'newsletter_subscribers'
    AND policyname = 'allow_public_insert'
  ) THEN
    CREATE POLICY allow_public_insert ON public.newsletter_subscribers
      FOR INSERT TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;
