-- Supabase schema for devices and activity logs
-- Run this in your Supabase project's SQL editor or via psql/pg

-- Enable pgcrypto if you want gen_random_uuid()
-- create extension if not exists pgcrypto;

-- Devices table (no RLS restrictions by default)
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  device_id text not null,
  info jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Activity logs table: free-form logs for visits and events
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb null,
  ip text null,
  user_agent text null,
  created_at timestamptz default now()
);

-- Optional indexes to help with queries
create index if not exists idx_activity_logs_event_type on public.activity_logs (event_type);
create index if not exists idx_devices_user_id on public.devices (user_id);
