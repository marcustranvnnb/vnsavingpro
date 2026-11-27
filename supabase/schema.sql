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

REVOKE ALL ON TABLE public.user_feedback FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.user_feedback TO service_role;

REVOKE ALL ON TABLE public.saved_plans FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.saved_plans TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.saved_plans TO service_role;

DROP POLICY IF EXISTS "Allow public read bank rate snapshots" ON public.bank_rate_snapshots;
CREATE POLICY "Allow public read bank rate snapshots"
  ON public.bank_rate_snapshots
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow anon insert user feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Allow public read saved plans by code" ON public.saved_plans;
DROP POLICY IF EXISTS "Allow anon insert or update saved plans" ON public.saved_plans;
DROP POLICY IF EXISTS "Allow anon update saved plans" ON public.saved_plans;

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

-- ============================================================================
-- 5. Free-Tier Quota Guardian & Alert Deduplication Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usage_quotas (
  metric_key TEXT NOT NULL,
  period_key TEXT NOT NULL,
  used_value BIGINT NOT NULL DEFAULT 0,
  limit_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (metric_key, period_key)
);

ALTER TABLE public.usage_quotas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.usage_quotas FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.usage_quotas TO service_role;

CREATE POLICY "Service role full access usage quotas"
  ON public.usage_quotas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.quota_alerts_log (
  metric_key TEXT NOT NULL,
  period_key TEXT NOT NULL,
  threshold_pct SMALLINT NOT NULL CHECK (threshold_pct IN (80, 90, 95, 100)),
  used_value BIGINT NOT NULL DEFAULT 0,
  limit_value BIGINT NOT NULL DEFAULT 0,
  sent_to TEXT NOT NULL DEFAULT '',
  email_status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (metric_key, period_key, threshold_pct)
);

ALTER TABLE public.quota_alerts_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.quota_alerts_log FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.quota_alerts_log TO service_role;

CREATE POLICY "Service role full access quota alerts log"
  ON public.quota_alerts_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.increment_quota_counter(
  p_metric_key TEXT,
  p_period_key TEXT,
  p_delta BIGINT DEFAULT 1,
  p_limit_value BIGINT DEFAULT 0
)
RETURNS TABLE (used_value BIGINT, limit_value BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.usage_quotas AS uq (metric_key, period_key, used_value, limit_value, updated_at)
  VALUES (p_metric_key, p_period_key, GREATEST(0, COALESCE(p_delta, 0)), COALESCE(p_limit_value, 0), NOW())
  ON CONFLICT (metric_key, period_key) DO UPDATE
    SET used_value = uq.used_value + GREATEST(0, COALESCE(p_delta, 0)),
        limit_value = CASE WHEN COALESCE(p_limit_value, 0) > 0 THEN p_limit_value ELSE uq.limit_value END,
        updated_at = NOW()
  RETURNING uq.used_value, uq.limit_value;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_quota_counter(TEXT, TEXT, BIGINT, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_quota_counter(TEXT, TEXT, BIGINT, BIGINT) TO service_role;

CREATE OR REPLACE FUNCTION public.get_free_tier_usage_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_db_bytes BIGINT;
  v_total_users BIGINT;
  v_mau BIGINT;
  v_month_key TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM');
  v_day_key TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  v_quotas JSONB;
BEGIN
  SELECT pg_database_size(current_database()) INTO v_db_bytes;
  SELECT count(*) INTO v_total_users FROM auth.users;
  SELECT count(DISTINCT id) INTO v_mau
  FROM auth.users
  WHERE COALESCE(last_sign_in_at, created_at) >= date_trunc('month', NOW() AT TIME ZONE 'UTC');

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'metric_key', q.metric_key,
        'period_key', q.period_key,
        'used_value', q.used_value,
        'limit_value', q.limit_value,
        'updated_at', q.updated_at
      )
    ),
    '[]'::jsonb
  )
  INTO v_quotas
  FROM public.usage_quotas q
  WHERE q.period_key IN (v_month_key, v_day_key);

  RETURN jsonb_build_object(
    'db_bytes', v_db_bytes,
    'db_mb', ROUND((v_db_bytes / (1024.0 * 1024.0))::numeric, 2),
    'total_users', v_total_users,
    'mau_current_month', v_mau,
    'month_key', v_month_key,
    'day_key', v_day_key,
    'quotas', v_quotas
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_free_tier_usage_snapshot() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_free_tier_usage_snapshot() TO service_role;

-- Household Profile Mode preference
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_household_mode TEXT NOT NULL DEFAULT 'INDIVIDUAL'
  CHECK (default_household_mode IN ('INDIVIDUAL', 'COUPLE', 'FAMILY'));

-- Calculation & planning run history per authenticated user
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

-- Collaborative Household Planning (Couples & Families, v1.12.0.0)
CREATE TABLE IF NOT EXISTS public.household_collaborations (
  id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  invite_code TEXT NOT NULL UNIQUE CHECK (invite_code ~ '^[A-Z0-9]{6,10}$'),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_display_name TEXT NOT NULL DEFAULT '',
  member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_display_name TEXT NOT NULL DEFAULT '',
  invited_email TEXT NOT NULL DEFAULT '',
  household_mode TEXT NOT NULL DEFAULT 'COUPLE'
    CHECK (household_mode IN ('COUPLE', 'FAMILY')),
  role TEXT NOT NULL DEFAULT 'partner'
    CHECK (role IN ('partner', 'family_member', 'viewer')),
  title TEXT NOT NULL DEFAULT 'Kế hoạch tài chính chung',
  share_code TEXT NOT NULL DEFAULT '',
  plan_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_household_collab_owner
  ON public.household_collaborations(owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_household_collab_member
  ON public.household_collaborations(member_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_household_collab_code
  ON public.household_collaborations(invite_code);

ALTER TABLE public.household_collaborations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.household_collaborations FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.household_collaborations TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.household_collaborations TO service_role;

DROP POLICY IF EXISTS "Owner or member can view household collaborations"
  ON public.household_collaborations;
CREATE POLICY "Owner or member can view household collaborations"
  ON public.household_collaborations
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = owner_user_id OR (select auth.uid()) = member_user_id);

DROP POLICY IF EXISTS "Owner can insert household collaborations"
  ON public.household_collaborations;
CREATE POLICY "Owner can insert household collaborations"
  ON public.household_collaborations
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "Owner or member can update household collaborations"
  ON public.household_collaborations;
CREATE POLICY "Owner or member can update household collaborations"
  ON public.household_collaborations
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_user_id OR (select auth.uid()) = member_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id OR (select auth.uid()) = member_user_id);

DROP POLICY IF EXISTS "Owner can delete household collaborations"
  ON public.household_collaborations;
CREATE POLICY "Owner can delete household collaborations"
  ON public.household_collaborations
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "Service role full access household collaborations"
  ON public.household_collaborations;
CREATE POLICY "Service role full access household collaborations"
  ON public.household_collaborations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 7. VnSavingPro v2.0.0.0 — Wealth Platform Roles, Spaces, Community & Stewards
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_role TEXT NOT NULL DEFAULT 'INDIVIDUAL';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_role_check
  CHECK (account_role IN ('INDIVIDUAL', 'EXPERT', 'COMMUNITY_PLANNER', 'STEWARD'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified_expert BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS expert_verification_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS expert_credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_community_voted_planner BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS community_planner_score NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS community_total_votes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS community_total_clones INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS steward_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_expert_verification_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_expert_verification_status_check
  CHECK (expert_verification_status IN ('none', 'pending', 'verified', 'rejected'));

ALTER TABLE public.calculation_history
  DROP CONSTRAINT IF EXISTS calculation_history_tool_check;
ALTER TABLE public.calculation_history
  ADD CONSTRAINT calculation_history_tool_check
  CHECK (tool IN ('plan', 'calculator', 'ladder', 'career', 'inflation', 'fx', 'salary'));

CREATE TABLE IF NOT EXISTS public.household_spaces (
  id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  household_mode TEXT NOT NULL DEFAULT 'INDIVIDUAL'
    CHECK (household_mode IN ('INDIVIDUAL', 'COUPLE', 'FAMILY')),
  title TEXT NOT NULL DEFAULT 'Không gian tài chính của tôi',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'upgraded')),
  previous_space_id TEXT,
  upgraded_from_mode TEXT NOT NULL DEFAULT '',
  dependents_count SMALLINT NOT NULL DEFAULT 0 CHECK (dependents_count BETWEEN 0 AND 12),
  invite_code TEXT NOT NULL DEFAULT '',
  plan_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  archived_at TIMESTAMPTZ,
  upgraded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_household_spaces_owner
  ON public.household_spaces(owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_household_spaces_partner
  ON public.household_spaces(partner_user_id, created_at DESC);

ALTER TABLE public.household_spaces ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.household_spaces FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.household_spaces TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.household_spaces TO service_role;

DROP POLICY IF EXISTS "Owner or partner can view household spaces" ON public.household_spaces;
CREATE POLICY "Owner or partner can view household spaces"
  ON public.household_spaces
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = owner_user_id OR (select auth.uid()) = partner_user_id);

DROP POLICY IF EXISTS "Owner can insert household spaces" ON public.household_spaces;
CREATE POLICY "Owner can insert household spaces"
  ON public.household_spaces
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "Owner or partner can update household spaces" ON public.household_spaces;
CREATE POLICY "Owner or partner can update household spaces"
  ON public.household_spaces
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_user_id OR (select auth.uid()) = partner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id OR (select auth.uid()) = partner_user_id);

DROP POLICY IF EXISTS "Owner can delete household spaces" ON public.household_spaces;
CREATE POLICY "Owner can delete household spaces"
  ON public.household_spaces
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "Service role full access household spaces" ON public.household_spaces;
CREATE POLICY "Service role full access household spaces"
  ON public.household_spaces
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.community_plan_templates (
  id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  author_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Thành viên VnSavingPro',
  author_role TEXT NOT NULL DEFAULT 'INDIVIDUAL'
    CHECK (author_role IN ('INDIVIDUAL', 'EXPERT', 'COMMUNITY_PLANNER', 'STEWARD')),
  author_is_expert BOOLEAN NOT NULL DEFAULT FALSE,
  author_is_community_voted BOOLEAN NOT NULL DEFAULT FALSE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  household_mode TEXT NOT NULL DEFAULT 'INDIVIDUAL'
    CHECK (household_mode IN ('INDIVIDUAL', 'COUPLE', 'FAMILY')),
  proof_notes TEXT NOT NULL DEFAULT '',
  proof_verified BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  plan_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  realism_score NUMERIC(4,2) NOT NULL DEFAULT 0,
  votes_count INTEGER NOT NULL DEFAULT 0,
  clone_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'hidden')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_templates_status_score
  ON public.community_plan_templates(status, realism_score DESC, clone_count DESC);

CREATE INDEX IF NOT EXISTS idx_community_templates_author
  ON public.community_plan_templates(author_user_id, created_at DESC);

ALTER TABLE public.community_plan_templates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.community_plan_templates FROM PUBLIC;
GRANT SELECT ON TABLE public.community_plan_templates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.community_plan_templates TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.community_plan_templates TO service_role;

DROP POLICY IF EXISTS "Public read published community templates" ON public.community_plan_templates;
CREATE POLICY "Public read published community templates"
  ON public.community_plan_templates
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR (select auth.uid()) = author_user_id);

DROP POLICY IF EXISTS "Author can insert community templates" ON public.community_plan_templates;
CREATE POLICY "Author can insert community templates"
  ON public.community_plan_templates
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = author_user_id);

DROP POLICY IF EXISTS "Author can update own community templates" ON public.community_plan_templates;
CREATE POLICY "Author can update own community templates"
  ON public.community_plan_templates
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = author_user_id)
  WITH CHECK ((select auth.uid()) = author_user_id);

DROP POLICY IF EXISTS "Author can delete own community templates" ON public.community_plan_templates;
CREATE POLICY "Author can delete own community templates"
  ON public.community_plan_templates
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = author_user_id);

DROP POLICY IF EXISTS "Service role full access community templates" ON public.community_plan_templates;
CREATE POLICY "Service role full access community templates"
  ON public.community_plan_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.community_template_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL REFERENCES public.community_plan_templates(id) ON DELETE CASCADE,
  voter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  realism_rating SMALLINT NOT NULL CHECK (realism_rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, voter_user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_template_votes_tpl
  ON public.community_template_votes(template_id);

ALTER TABLE public.community_template_votes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.community_template_votes FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.community_template_votes TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.community_template_votes TO service_role;

DROP POLICY IF EXISTS "Users can view community template votes" ON public.community_template_votes;
CREATE POLICY "Users can view community template votes"
  ON public.community_template_votes
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can vote once per template" ON public.community_template_votes;
CREATE POLICY "Users can vote once per template"
  ON public.community_template_votes
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = voter_user_id);

DROP POLICY IF EXISTS "Users can update own template vote" ON public.community_template_votes;
CREATE POLICY "Users can update own template vote"
  ON public.community_template_votes
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = voter_user_id)
  WITH CHECK ((select auth.uid()) = voter_user_id);

DROP POLICY IF EXISTS "Service role full access community template votes" ON public.community_template_votes;
CREATE POLICY "Service role full access community template votes"
  ON public.community_template_votes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.steward_mandates (
  id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  mandate_code TEXT NOT NULL UNIQUE CHECK (mandate_code ~ '^[A-Z0-9]{6,12}$'),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_display_name TEXT NOT NULL DEFAULT '',
  steward_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  steward_display_name TEXT NOT NULL DEFAULT '',
  steward_email TEXT NOT NULL DEFAULT '',
  household_space_id TEXT NOT NULL DEFAULT '',
  household_mode TEXT NOT NULL DEFAULT 'INDIVIDUAL'
    CHECK (household_mode IN ('INDIVIDUAL', 'COUPLE', 'FAMILY')),
  title TEXT NOT NULL DEFAULT 'Ủy quyền quản trị tài chính',
  scope TEXT NOT NULL DEFAULT 'budget_co_manage'
    CHECK (scope IN ('read_only', 'budget_co_manage', 'full_steward')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'revoked')),
  snapshot_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_steward_mandates_owner
  ON public.steward_mandates(owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_steward_mandates_steward
  ON public.steward_mandates(steward_user_id, created_at DESC);

ALTER TABLE public.steward_mandates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.steward_mandates FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.steward_mandates TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.steward_mandates TO service_role;

DROP POLICY IF EXISTS "Owner or steward can view mandates" ON public.steward_mandates;
CREATE POLICY "Owner or steward can view mandates"
  ON public.steward_mandates
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = owner_user_id OR (select auth.uid()) = steward_user_id);

DROP POLICY IF EXISTS "Owner can insert steward mandates" ON public.steward_mandates;
CREATE POLICY "Owner can insert steward mandates"
  ON public.steward_mandates
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "Owner or steward can update mandates" ON public.steward_mandates;
CREATE POLICY "Owner or steward can update mandates"
  ON public.steward_mandates
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_user_id OR (select auth.uid()) = steward_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id OR (select auth.uid()) = steward_user_id);

DROP POLICY IF EXISTS "Owner can delete steward mandates" ON public.steward_mandates;
CREATE POLICY "Owner can delete steward mandates"
  ON public.steward_mandates
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_user_id);

DROP POLICY IF EXISTS "Service role full access steward mandates" ON public.steward_mandates;
CREATE POLICY "Service role full access steward mandates"
  ON public.steward_mandates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================================
-- 8. Zero Direct Client DB Access Lockout (v2.7.1.0)
-- Forces all database & schema access exclusively through Vercel Serverless APIs
-- while leaving Supabase Auth (/auth/v1/*) fully functional.
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
  pol RECORD;
  tables TEXT[] := ARRAY[
    'bank_rate_snapshots',
    'user_feedback',
    'saved_plans',
    'profiles',
    'usage_quotas',
    'quota_alerts_log',
    'calculation_history',
    'household_collaborations',
    'household_spaces',
    'community_plan_templates',
    'community_template_votes',
    'steward_mandates'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tbl);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);',
      tbl
    );
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE USAGE ON SCHEMA public FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
