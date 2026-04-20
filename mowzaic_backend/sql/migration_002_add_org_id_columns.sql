-- Migration 002: Add nullable org_id columns to tenant-scoped tables
-- Phase 1B: All columns nullable for backward compatibility

-- Users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS org_id uuid
  REFERENCES public.organizations(id);

-- Properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS org_id uuid
  REFERENCES public.organizations(id);

-- Bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS org_id uuid
  REFERENCES public.organizations(id);

-- Estimates
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS org_id uuid
  REFERENCES public.organizations(id);

-- Subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS org_id uuid
  REFERENCES public.organizations(id);

-- Messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS org_id uuid
  REFERENCES public.organizations(id);

-- User Properties
ALTER TABLE public.user_properties ADD COLUMN IF NOT EXISTS org_id uuid
  REFERENCES public.organizations(id);

-- Events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS org_id uuid
  REFERENCES public.organizations(id);

-- Indexes for org_id on all tables
CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(org_id);
CREATE INDEX IF NOT EXISTS idx_properties_org_id ON public.properties(org_id);
CREATE INDEX IF NOT EXISTS idx_bookings_org_id ON public.bookings(org_id);
CREATE INDEX IF NOT EXISTS idx_estimates_org_id ON public.estimates(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON public.messages(org_id);
CREATE INDEX IF NOT EXISTS idx_user_properties_org_id ON public.user_properties(org_id);
CREATE INDEX IF NOT EXISTS idx_events_org_id ON public.events(org_id);
