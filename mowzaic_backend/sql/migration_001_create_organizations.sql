-- Migration 001: Create organizations table
-- Phase 1A: Zero application changes, zero risk

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  domain text UNIQUE,
  logo_url text,
  primary_color text DEFAULT '#22c55e',
  primary_color_dark text DEFAULT '#14532d',
  background_color text DEFAULT '#f0fdf4',
  headline text DEFAULT 'mow delivered, just like that',
  tagline text,
  footer_text text,
  stripe_account_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_domain ON public.organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
