-- ==============================================================================
-- MIGRATION: 20260925120000_user_ai_providers
-- Purpose  : Bring-Your-Own-Key (BYOK) AI provider credential storage
-- ==============================================================================
--
-- SECURITY MODEL
-- ──────────────
-- This table stores AI provider API keys that users supply for their own
-- accounts (Gemini, OpenAI, Anthropic, Grok).
--
-- KEY SECURITY GUARANTEES:
--   • API keys are NEVER stored in plaintext.
--     The `encrypted_api_key` column contains the result of AES-256-GCM
--     encryption performed server-side (in the Supabase Edge Function)
--     before the row is written to the database.
--
--   • `key_hint` stores ONLY the last 4 characters of the original key
--     (e.g. "…k9Zx"). This is the only thing that is ever safe to surface
--     in the frontend UI. It is never sufficient to reconstruct the key.
--
--   • Row ownership is enforced at the Edge Function level. Clerk JWTs are
--     verified there; the calling user_id is extracted from the verified
--     token and injected into every query. Supabase RLS policies are
--     intentionally open (USING (true)) to match the rest of this project's
--     pattern — they are not the primary trust boundary.
--
-- AUTHOR    : AnswersBro / Lexon IT Solutions
-- DATE      : 2026-09-25
-- ==============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. HELPER: reusable set_updated_at() trigger function
--    (created once; safe to re-run because of CREATE OR REPLACE)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLE: user_ai_providers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_ai_providers (
  -- Primary key
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner — Clerk user ID (text, e.g. user_2...)
  user_id             text        NOT NULL,

  -- Which AI provider this credential is for.
  provider            text        NOT NULL
                                  CHECK (provider IN ('gemini', 'openai', 'anthropic', 'grok')),

  -- AES-256-GCM ciphertext produced by the Edge Function.
  -- Format: base64(iv || authTag || ciphertext)  — exact scheme is an
  -- implementation detail of the encryption utility; never decode client-side.
  encrypted_api_key   text        NOT NULL,

  -- Last 4 characters of the original plaintext key, safe to show in UI.
  -- Example: for key "sk-ant-api03-…XyZw" the hint is "XyZw".
  key_hint            text        NOT NULL,

  -- The specific model the user has selected for this provider
  -- (e.g. "gemini-1.5-pro", "gpt-4o", "claude-3-5-sonnet-20241022").
  -- Defaults to empty string so the application can apply its own fallback.
  selected_model      text        NOT NULL DEFAULT '',

  -- At most one provider per user can be the default; enforced by the
  -- trg_enforce_single_default trigger below.
  is_default          boolean     NOT NULL DEFAULT false,

  -- Reflects the last known connectivity state of this key.
  -- Updated by the Edge Function after each validation attempt.
  connection_status   text        NOT NULL DEFAULT 'unknown'
                                  CHECK (connection_status IN ('connected', 'failed', 'unknown')),

  -- Timestamps
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  last_validated_at   timestamptz               -- NULL = never validated
);

-- Human-readable table comment
COMMENT ON TABLE public.user_ai_providers IS
  'Stores per-user AI provider credentials. '
  'API keys are AES-256-GCM encrypted server-side before insert; '
  'only key_hint (last 4 chars) is safe to render in the frontend.';

-- Column-level comments for maintainability
COMMENT ON COLUMN public.user_ai_providers.encrypted_api_key IS
  'AES-256-GCM ciphertext of the user''s API key. '
  'Encryption and decryption are performed exclusively inside Edge Functions. '
  'Never expose or transmit this value to the frontend.';

COMMENT ON COLUMN public.user_ai_providers.key_hint IS
  'Last 4 characters of the original plaintext key. '
  'Safe to display in the UI as a confirmation indicator (e.g. "…k9Zx"). '
  'Cannot be used to reconstruct the key.';

COMMENT ON COLUMN public.user_ai_providers.selected_model IS
  'The model identifier the user has chosen for this provider, '
  'e.g. "gemini-1.5-pro", "gpt-4o", "claude-3-5-sonnet-20241022".';

COMMENT ON COLUMN public.user_ai_providers.is_default IS
  'Only one row per user_id may have is_default = true. '
  'The trg_enforce_single_default trigger resets all other rows to false '
  'whenever a new default is set.';

COMMENT ON COLUMN public.user_ai_providers.connection_status IS
  'Last known connectivity state: connected | failed | unknown. '
  'Written by the Edge Function after a key validation round-trip.';

COMMENT ON COLUMN public.user_ai_providers.last_validated_at IS
  'Timestamp of the most recent successful or failed validation attempt. '
  'NULL means the key has never been validated.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. UNIQUE CONSTRAINT: one credential per (user, provider)
--    e.g. a user cannot register two separate Gemini keys simultaneously.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS user_ai_providers_user_provider_idx
  ON public.user_ai_providers (user_id, provider);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INDEX: fast lookup of all providers for a given user
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS user_ai_providers_user_id_idx
  ON public.user_ai_providers (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGER: auto-update updated_at on every row change
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_user_ai_providers_updated_at ON public.user_ai_providers;

CREATE TRIGGER trg_user_ai_providers_updated_at
  BEFORE UPDATE ON public.user_ai_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FUNCTION + TRIGGER: enforce at most one is_default = true per user
--
--    Business rule:
--      When a row is inserted or updated with is_default = true, all other
--      rows belonging to the same user_id are atomically set to false.
--      This ensures the frontend always has exactly one (or zero) defaults.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_single_ai_provider_default()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when the incoming row is being set as default.
  IF NEW.is_default = true THEN
    UPDATE public.user_ai_providers
    SET    is_default = false,
           updated_at = now()
    WHERE  user_id  = NEW.user_id
      AND  id      <> NEW.id          -- leave the new row untouched
      AND  is_default = true;          -- only touch rows that need changing
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_single_ai_provider_default() IS
  'Fires AFTER INSERT OR UPDATE on user_ai_providers. '
  'When a row is set as is_default = true it resets all sibling rows '
  'for the same user_id to is_default = false so only one default exists.';

DROP TRIGGER IF EXISTS trg_enforce_single_default ON public.user_ai_providers;

CREATE TRIGGER trg_enforce_single_default
  AFTER INSERT OR UPDATE OF is_default
  ON public.user_ai_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_ai_provider_default();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
--
--    Ownership is verified inside the Edge Function (Clerk JWT → user_id).
--    Supabase RLS is intentionally open to match the project-wide pattern
--    used in profiles, admin_allowlist, materials, etc.
--    See: backend/apply_to_supabase.sql for the established convention.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_ai_providers ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies (idempotent re-run safety)
DROP POLICY IF EXISTS "ai_providers select all" ON public.user_ai_providers;
DROP POLICY IF EXISTS "ai_providers insert all" ON public.user_ai_providers;
DROP POLICY IF EXISTS "ai_providers update all" ON public.user_ai_providers;
DROP POLICY IF EXISTS "ai_providers delete all" ON public.user_ai_providers;

CREATE POLICY "ai_providers select all"
  ON public.user_ai_providers
  FOR SELECT
  USING (true);

CREATE POLICY "ai_providers insert all"
  ON public.user_ai_providers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "ai_providers update all"
  ON public.user_ai_providers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "ai_providers delete all"
  ON public.user_ai_providers
  FOR DELETE
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. GRANTS
--    Supabase uses the anon role for unauthenticated Postgrest requests and
--    the authenticated role for bearer-token requests. Both are needed because
--    Clerk tokens arrive as custom JWTs (not native Supabase JWTs), so
--    Postgrest may still resolve to anon.
-- ─────────────────────────────────────────────────────────────────────────────
GRANT ALL ON public.user_ai_providers TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. REALTIME (optional, enable only if the frontend subscribes to changes)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_publication_tables
    WHERE  pubname    = 'supabase_realtime'
      AND  schemaname = 'public'
      AND  tablename  = 'user_ai_providers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_ai_providers;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- supabase_realtime publication may not exist in all environments; safe to skip.
    NULL;
END $$;

COMMIT;

-- ==============================================================================
-- VERIFICATION QUERIES (run manually after applying to confirm correctness)
-- ==============================================================================
-- SELECT table_name, row_security
--   FROM information_schema.tables
--  WHERE table_schema = 'public' AND table_name = 'user_ai_providers';
--
-- SELECT policyname, cmd, qual, with_check
--   FROM pg_policies
--  WHERE schemaname = 'public' AND tablename = 'user_ai_providers';
--
-- SELECT indexname, indexdef
--   FROM pg_indexes
--  WHERE schemaname = 'public' AND tablename = 'user_ai_providers';
--
-- SELECT trigger_name, event_manipulation, action_timing
--   FROM information_schema.triggers
--  WHERE event_object_schema = 'public'
--    AND event_object_table  = 'user_ai_providers';
