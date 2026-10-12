-- Migration: Loyalty, Store Credit, and Account Enhancement Tables
-- Timestamp: 20260516120000

-- User profiles extension (add missing columns if not exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.user_profiles ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'birthday') THEN
    ALTER TABLE public.user_profiles ADD COLUMN birthday DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'ring_size_left') THEN
    ALTER TABLE public.user_profiles ADD COLUMN ring_size_left TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'ring_size_right') THEN
    ALTER TABLE public.user_profiles ADD COLUMN ring_size_right TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'diamond_shape_pref') THEN
    ALTER TABLE public.user_profiles ADD COLUMN diamond_shape_pref TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'diamond_origin_pref') THEN
    ALTER TABLE public.user_profiles ADD COLUMN diamond_origin_pref TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'notification_prefs') THEN
    ALTER TABLE public.user_profiles ADD COLUMN notification_prefs JSONB DEFAULT '{}';
  END IF;
END $$;

-- Loyalty accounts table
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'Silver' CHECK (tier IN ('Silver', 'Gold', 'Black', 'Privé')),
  total_points_earned INTEGER NOT NULL DEFAULT 0,
  member_since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  birthday_reward_claimed_year INTEGER,
  anniversary_reward_claimed_year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Loyalty transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'bonus', 'referral', 'birthday', 'anniversary')),
  description TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Store credit wallets table
CREATE TABLE IF NOT EXISTS public.store_credit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'NOK',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Store credit transactions table
CREATE TABLE IF NOT EXISTS public.store_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'promotional', 'loyalty', 'cashback', 'admin')),
  description TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for loyalty_accounts
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loyalty_accounts_user_select" ON public.loyalty_accounts;
CREATE POLICY "loyalty_accounts_user_select" ON public.loyalty_accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "loyalty_accounts_user_insert" ON public.loyalty_accounts;
CREATE POLICY "loyalty_accounts_user_insert" ON public.loyalty_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "loyalty_accounts_user_update" ON public.loyalty_accounts;
CREATE POLICY "loyalty_accounts_user_update" ON public.loyalty_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for loyalty_transactions
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loyalty_transactions_user_select" ON public.loyalty_transactions;
CREATE POLICY "loyalty_transactions_user_select" ON public.loyalty_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for store_credit_wallets
ALTER TABLE public.store_credit_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_credit_wallets_user_select" ON public.store_credit_wallets;
CREATE POLICY "store_credit_wallets_user_select" ON public.store_credit_wallets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "store_credit_wallets_user_insert" ON public.store_credit_wallets;
CREATE POLICY "store_credit_wallets_user_insert" ON public.store_credit_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for store_credit_transactions
ALTER TABLE public.store_credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_credit_transactions_user_select" ON public.store_credit_transactions;
CREATE POLICY "store_credit_transactions_user_select" ON public.store_credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_user_id ON public.loyalty_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_store_credit_wallets_user_id ON public.store_credit_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_store_credit_transactions_user_id ON public.store_credit_transactions(user_id);
