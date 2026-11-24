-- VnSavingPro v2.1.0.0 — Supabase Security & Performance Advisor Hardening
-- Safe & idempotent: resolves 0001_unindexed_foreign_keys on community_template_votes
-- and clears 0008_rls_enabled_no_policy on public.user_feedback.

CREATE INDEX IF NOT EXISTS idx_community_template_votes_voter
  ON public.community_template_votes (voter_user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_feedback'
      AND policyname = 'Service role full access user feedback'
  ) THEN
    CREATE POLICY "Service role full access user feedback"
      ON public.user_feedback
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
