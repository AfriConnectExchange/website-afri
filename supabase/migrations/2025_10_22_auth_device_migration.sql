-- Migration: add auth/device columns and triggers
BEGIN;

-- Users: add metadata columns
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS signup_method VARCHAR(50) DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS signup_source VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_password_change_at TIMESTAMP WITH TIME ZONE;

-- user_sessions: add hashed token columns + revoked_at
ALTER TABLE IF EXISTS user_sessions
  ADD COLUMN IF NOT EXISTS session_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

-- device_info: add fingerprint and last_authenticated_at
ALTER TABLE IF EXISTS device_info
  ADD COLUMN IF NOT EXISTS fingerprint_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_authenticated_at TIMESTAMP WITH TIME ZONE;

-- user_onboarding_progress: add current_step
ALTER TABLE IF EXISTS user_onboarding_progress
  ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0;

-- Create trigger function to auto-create onboarding progress row
CREATE OR REPLACE FUNCTION ensure_onboarding_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a progress row if it doesn't exist for the user
  INSERT INTO user_onboarding_progress (user_id, walkthrough_completed, created_at, updated_at)
    VALUES (NEW.id, FALSE, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users table after insert
DROP TRIGGER IF EXISTS create_onboarding_progress ON users;
CREATE TRIGGER create_onboarding_progress
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION ensure_onboarding_progress();

COMMIT;
