-- ============================================================================
-- VnSavingPro — Supabase Free Tier PostgreSQL Schema & RLS Policies
-- ============================================================================
-- Instructions:
-- 1. Open your Supabase project -> SQL Editor -> New Query
-- 2. Paste this entire file and click "Run"
-- 3. Add SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY to Vercel / .env.local
-- ============================================================================

-- 1. Daily Scraped Bank Rates Snapshots (TNEX, TIMO, LioBank, Cake + traditional banks)
CREATE TABLE IF NOT EXISTS public.bank_rate_snapshots (
  id BIGSERIAL PRIMARY KEY,
  updated_date TEXT NOT NULL,
  banks JSONB NOT NULL,
  sync_meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_rate_snapshots_created_at
  ON public.bank_rate_snapshots (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bank_rate_snapshots_updated_date
  ON public.bank_rate_snapshots (updated_date);

-- 2. Persistent User Feedback & NPS Ratings
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id TEXT PRIMARY KEY,
  tool TEXT NOT NULL DEFAULT 'general',
  tool_label TEXT NOT NULL DEFAULT 'Chung',
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT NOT NULL DEFAULT '',
  snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at
  ON public.user_feedback (created_at DESC);

-- 3. Optional Cloud-Synced Financial Plans & Share Codes
CREATE TABLE IF NOT EXISTS public.saved_plans (
  share_code TEXT PRIMARY KEY CHECK (char_length(share_code) BETWEEN 6 AND 12),
  title TEXT NOT NULL DEFAULT 'Kế hoạch tiết kiệm VnSavingPro',
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Row Level Security (RLS)
-- Note: Server endpoints (/api/*) use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS,
-- while these policies safely permit constrained anon reads/inserts if ever used.
-- ============================================================================

ALTER TABLE public.bank_rate_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_plans ENABLE ROW LEVEL SECURITY;

-- Explicit Data API role grants (required on newer Supabase projects with opt-in schema privileges)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON SEQUENCE public.bank_rate_snapshots_id_seq TO service_role;

GRANT SELECT ON TABLE public.bank_rate_snapshots TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.bank_rate_snapshots TO service_role;

GRANT INSERT ON TABLE public.user_feedback TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.user_feedback TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.saved_plans TO anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.saved_plans TO service_role;

DROP POLICY IF EXISTS "Allow public read bank rate snapshots" ON public.bank_rate_snapshots;
CREATE POLICY "Allow public read bank rate snapshots"
  ON public.bank_rate_snapshots
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon insert user feedback" ON public.user_feedback;
CREATE POLICY "Allow anon insert user feedback"
  ON public.user_feedback
  FOR INSERT
  TO anon
  WITH CHECK (rating BETWEEN 1 AND 5);

DROP POLICY IF EXISTS "Allow public read saved plans by code" ON public.saved_plans;
CREATE POLICY "Allow public read saved plans by code"
  ON public.saved_plans
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon insert or update saved plans" ON public.saved_plans;
CREATE POLICY "Allow anon insert or update saved plans"
  ON public.saved_plans
  FOR INSERT
  TO anon
  WITH CHECK (char_length(share_code) BETWEEN 6 AND 12);

DROP POLICY IF EXISTS "Allow anon update saved plans" ON public.saved_plans;
CREATE POLICY "Allow anon update saved plans"
  ON public.saved_plans
  FOR UPDATE
  TO anon
  USING (char_length(share_code) BETWEEN 6 AND 12)
  WITH CHECK (char_length(share_code) BETWEEN 6 AND 12);

-- ============================================================================
-- 4. User Profiles & Authenticated Plan Ownership (Auth v1.6)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  default_bank_id TEXT NOT NULL DEFAULT 'cake',
  preferred_goal_type TEXT NOT NULL DEFAULT 'PASSIVE_INCOME',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.profiles TO service_role;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.saved_plans
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_saved_plans_user_id
  ON public.saved_plans (user_id);

GRANT DELETE ON TABLE public.saved_plans TO authenticated;

CREATE POLICY "Authenticated users can read own saved plans"
  ON public.saved_plans
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id OR is_shared = true);

CREATE POLICY "Authenticated users can insert own saved plans"
  ON public.saved_plans
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can update own saved plans"
  ON public.saved_plans
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Authenticated users can delete own saved plans"
  ON public.saved_plans
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
