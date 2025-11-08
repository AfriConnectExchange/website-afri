-- Supabase/Postgres schema for authentication + sessions + profiles
-- Run this with psql or apply via Supabase SQL editor.

-- Enable uuid generation (pgcrypto or uuid-ossp depending on your Postgres setup).
-- For Supabase projects `gen_random_uuid()` is available from the pgcrypto extension.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table: canonical user record referenced by application data
CREATE TABLE IF NOT EXISTS auth_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text,
  full_name text,
  avatar_url text,
  roles text[] DEFAULT ARRAY['buyer']::text[],
  status text DEFAULT 'active',
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  email_verified boolean DEFAULT false,
  phone_verified boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Authentication providers (external accounts: google, facebook, etc.)
CREATE TABLE IF NOT EXISTS auth_providers (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth_users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  raw_profile jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);

-- Sessions for tracking devices and heartbeats (application-level sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth_users(id) ON DELETE CASCADE,
  device_id text,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  last_heartbeat timestamptz DEFAULT now(),
  revoked boolean DEFAULT false
);

-- Indexes to speed up lookups
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users (lower(email));
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);

-- Optionally: table to record one-time OTP attempts or phone verification records
CREATE TABLE IF NOT EXISTS phone_otps (
  id bigserial PRIMARY KEY,
  phone text NOT NULL,
  code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false
);

-- Simple audit table for login attempts / lockouts
CREATE TABLE IF NOT EXISTS login_attempts (
  id bigserial PRIMARY KEY,
  email text,
  ip_address text,
  action text,
  success boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Example view joining supabase auth users (if you want to mirror supabase_user metadata)
-- Note: Supabase already stores auth.users in a managed schema; this schema is intended
-- for your application-level user profile storage if you want it separate from Supabase's auth.users table.
