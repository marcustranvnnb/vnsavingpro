-- ============================================================================
-- VnSavingPro v1.11.0.0 Migration: Calculation History + RLS Hardening + Index Cleanup
-- Idempotent migration script safe to run in Supabase SQL Editor.
-- ============================================================================

-- 1. Calculation & planning run history per authenticated user
CREATE TABLE IF NOT EXISTS public.calculation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL CHECK (tool IN ('plan', 'calculator', 'ladder', 'career', 'inflation')),
  title TEXT NOT NULL,
  household_mode TEXT NOT NULL DEFAULT 'INDIVIDUAL' CHECK (household_mode IN ('INDIVIDUAL', 'COUPLE', 'FAMILY')),
  summary TEXT NOT NULL DEFAULT '',
  metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_run_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calculation_history_user_created
  ON public.calculation_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calculation_history_user_tool_created
  ON public.calculation_history (user_id, tool, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_calculation_history_user_client_run
  ON public.calculation_history (user_id, client_run_id);

ALTER TABLE public.calculation_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.calculation_history FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.calculation_history TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.calculation_history TO service_role;

DROP POLICY IF EXISTS "Users can view own calculation history" ON public.calculation_history;
CREATE POLICY "Users can view own calculation history"
  ON public.calculation_history
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own calculation history" ON public.calculation_history;
CREATE POLICY "Users can insert own calculation history"
  ON public.calculation_history
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own calculation history" ON public.calculation_history;
CREATE POLICY "Users can update own calculation history"
  ON public.calculation_history
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own calculation history" ON public.calculation_history;
CREATE POLICY "Users can delete own calculation history"
  ON public.calculation_history
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role full access calculation history" ON public.calculation_history;
CREATE POLICY "Service role full access calculation history"
  ON public.calculation_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Harden RLS: Remove unauthenticated anon Data API access on saved_plans & user_feedback
-- Shared plans and anonymous feedback flow strictly through rate-limited /api/plans & /api/feedback (service_role).
DROP POLICY IF EXISTS "Allow public read saved plans by code" ON public.saved_plans;
DROP POLICY IF EXISTS "Allow anon insert or update saved plans" ON public.saved_plans;
DROP POLICY IF EXISTS "Allow anon update saved plans" ON public.saved_plans;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.saved_plans FROM anon;

DROP POLICY IF EXISTS "Allow anon insert user feedback" ON public.user_feedback;
REVOKE INSERT, SELECT, UPDATE, DELETE ON TABLE public.user_feedback FROM anon, authenticated;

-- 3. Drop unused redundant index reported by Supabase Performance Advisor
DROP INDEX IF EXISTS public.idx_bank_rate_snapshots_updated_date;
