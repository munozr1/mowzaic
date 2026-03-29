-- Migration 003: Create default Mowzaic org and backfill existing data
-- Phase 1C: Run after migrations 001 and 002

-- Create the default "Mowzaic" organization with a well-known UUID
INSERT INTO public.organizations (id, name, slug, domain, primary_color, primary_color_dark, background_color, headline, footer_text)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Mowzaic',
  'mowzaic',
  'mowzaic.com',
  '#22c55e',
  '#14532d',
  '#f0fdf4',
  'mow delivered, just like that',
  'Mowzaic'
)
ON CONFLICT (id) DO NOTHING;

-- Backfill all existing rows to the default org
UPDATE public.users SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.properties SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.bookings SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.estimates SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.subscriptions SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.messages SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.user_properties SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.events SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
