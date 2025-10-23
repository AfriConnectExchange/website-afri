-- REMOVED: Supabase migration cleared.
BEGIN;

-- 1) user_sessions: add hashed token columns and revoked_at, make raw token columns nullable
ALTER TABLE IF EXISTS public.user_sessions
  ADD COLUMN IF NOT EXISTS session_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

-- Drop NOT NULL constraint on raw token columns so code doesn't fail if they are left NULL
ALTER TABLE IF EXISTS public.user_sessions
  ALTER COLUMN session_token DROP NOT NULL,
  ALTER COLUMN refresh_token DROP NOT NULL;

-- 2) device_info: add fingerprint_hash and last_authenticated_at
ALTER TABLE IF EXISTS public.device_info
  ADD COLUMN IF NOT EXISTS fingerprint_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_authenticated_at TIMESTAMP WITH TIME ZONE;

-- 3) Add password_reset_tokens table for custom reset flows
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4) Enable RLS on user_sessions and device_info and create safe policies
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.device_info ENABLE ROW LEVEL SECURITY;

-- Remove policies if they exist so we can recreate them safely
DROP POLICY IF EXISTS user_sessions_select_own ON public.user_sessions;
DROP POLICY IF EXISTS user_sessions_update_own ON public.user_sessions;
DROP POLICY IF EXISTS user_sessions_insert_self ON public.user_sessions;
DROP POLICY IF EXISTS device_info_select_own ON public.device_info;
DROP POLICY IF EXISTS device_info_update_own ON public.device_info;
DROP POLICY IF EXISTS device_info_insert_self ON public.device_info;

-- Allow owners OR admins to select their own sessions
CREATE POLICY user_sessions_select_own ON public.user_sessions
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND 'admin' = ANY(u.roles)
    )
  );

-- Allow owners OR admins to update their own sessions
CREATE POLICY user_sessions_update_own ON public.user_sessions
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND 'admin' = ANY(u.roles)
    )
  );

-- Allow inserts only when auth.uid() matches the session's user_id (server endpoints running as user)
CREATE POLICY user_sessions_insert_self ON public.user_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Device info policies (owners and admins)
CREATE POLICY device_info_select_own ON public.device_info
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND 'admin' = ANY(u.roles)
    )
  );

CREATE POLICY device_info_update_own ON public.device_info
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND 'admin' = ANY(u.roles)
    )
  );

CREATE POLICY device_info_insert_self ON public.device_info
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- 5) Replace log_activity function with a sanitized version that strips secrets from logs
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_action VARCHAR(100);
  v_changes JSONB;
  v_old JSONB;
  v_new JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := TG_TABLE_NAME || '_created';
    v_old := NULL;
    v_new := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := TG_TABLE_NAME || '_updated';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := TG_TABLE_NAME || '_deleted';
    v_old := to_jsonb(OLD);
    v_new := NULL;
  END IF;

  -- Redact sensitive keys if present
  IF v_old IS NOT NULL THEN
    v_old := v_old - 'password_hash' - 'session_token' - 'refresh_token' - 'access_token' - 'provider_response' - 'provider_token' - 'token' - 'secret';
  END IF;
  IF v_new IS NOT NULL THEN
    v_new := v_new - 'password_hash' - 'session_token' - 'refresh_token' - 'access_token' - 'provider_response' - 'provider_token' - 'token' - 'secret';
  END IF;

  v_changes := jsonb_build_object(
    'old', v_old,
    'new', v_new
  );

  INSERT INTO public.activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE( (CASE WHEN NEW IS NOT NULL AND (NEW ? 'user_id') THEN (NEW->>'user_id')::uuid WHEN OLD IS NOT NULL AND (OLD ? 'user_id') THEN (OLD->>'user_id')::uuid ELSE NULL END),
              (CASE WHEN NEW IS NOT NULL AND (NEW ? 'id') THEN (NEW->>'id')::uuid WHEN OLD IS NOT NULL AND (OLD ? 'id') THEN (OLD->>'id')::uuid ELSE NULL END)
    ),
    v_action,
    TG_TABLE_NAME,
    COALESCE( (CASE WHEN NEW IS NOT NULL AND (NEW ? 'id') THEN (NEW->>'id')::uuid WHEN OLD IS NOT NULL AND (OLD ? 'id') THEN (OLD->>'id')::uuid ELSE NULL END), NULL),
    v_changes,
    NULL,
    NULL
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: SECURITY DEFINER ensures the function can insert into activity_logs even under RLS, but only createServerAdminClient or migrations should create it.

COMMIT;

-- End of migration
