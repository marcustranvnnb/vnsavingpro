-- VnSavingPro v1.12.0.0 — Collaborative Household Planning (Couples & Families)
-- Enables users to invite a partner or family member into a shared savings plan via 8-char invite code.

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
