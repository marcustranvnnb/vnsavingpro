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
