-- ============================================
-- Migration: Add provider_clients table
-- Tracks which customers a provider has added to their personal roster.
-- Allows providers to "add" existing Mowzaic customers they already service.
-- ============================================

CREATE TABLE IF NOT EXISTS public.provider_clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_clients_provider_id
  ON public.provider_clients(provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_clients_customer_id
  ON public.provider_clients(customer_id);

-- ============================================
-- Row-Level Security
-- ============================================
ALTER TABLE public.provider_clients ENABLE ROW LEVEL SECURITY;

-- Providers can view their own client roster
CREATE POLICY "Providers can view own clients"
  ON public.provider_clients FOR SELECT
  USING (auth.uid() = provider_id);

-- Providers can add clients to their roster
CREATE POLICY "Providers can add clients"
  ON public.provider_clients FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- Providers can remove clients from their roster
CREATE POLICY "Providers can remove clients"
  ON public.provider_clients FOR DELETE
  USING (auth.uid() = provider_id);
