-- ============================================================================
-- VnSavingPro v2.0.0.0 — Wealth Management Platform Migration
-- Adds 4 user roles/journeys, Household Spaces lifecycle (Couple switching &
-- Couple->Family upgrades), Community-Voted Plan Templates + Clones,
-- Verified Experts metadata, Steward Mandates, and fx/salary history support.
-- ============================================================================

-- 1. Extend public.profiles with v2.0 roles & verification/community badges
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

-- 2. Extend calculation_history tool allowlist for FX & Salary 2026 runs
ALTER TABLE public.calculation_history
  DROP CONSTRAINT IF EXISTS calculation_history_tool_check;
ALTER TABLE public.calculation_history
  ADD CONSTRAINT calculation_history_tool_check
  CHECK (tool IN ('plan', 'calculator', 'ladder', 'career', 'inflation', 'fx', 'salary'));

-- 3. Household Spaces Lifecycle (Individual / Couple / Family, switching & upgrades)
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

-- 4. Community Plan Templates & Votes (Individuals & Experts earn Community-Voted Planner badge)
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

-- 5. Steward Mandates (Financial Manager / Quản trị tài chính cho Cá nhân, Cặp đôi & Gia đình)
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
