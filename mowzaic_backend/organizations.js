import express from 'express';
import { supabaseAdmin } from './db.js';
import logger from './logger.js';
import { asyncHandler } from './utils.js';

const router = express.Router();

// In-memory cache for org branding (5-minute TTL)
const orgCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedOrg(key) {
  const entry = orgCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    orgCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedOrg(key, data) {
  orgCache.set(key, { data, timestamp: Date.now() });
}

// GET /organizations/by-domain?domain=joselawns.com
// Public endpoint — no auth required
router.get('/by-domain', asyncHandler(async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
    return res.status(400).json({ error: 'domain query parameter is required' });
  }

  // Check cache first
  const cached = getCachedOrg(domain);
  if (cached) {
    return res.json(cached);
  }

  // Try exact domain match first, then try without www prefix
  const domains = [domain];
  if (domain.startsWith('www.')) {
    domains.push(domain.replace('www.', ''));
  } else {
    domains.push(`www.${domain}`);
  }

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('id, name, slug, domain, logo_url, primary_color, primary_color_dark, background_color, headline, tagline, footer_text')
    .in('domain', domains)
    .limit(1)
    .single();

  if (error || !data) {
    logger.warn(`Org not found for domain: ${domain}`);
    return res.status(404).json({ error: 'Organization not found for this domain' });
  }

  setCachedOrg(domain, data);
  res.json(data);
}));

// GET /organizations/:id
// Public endpoint — fetch org by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cached = getCachedOrg(`id:${id}`);
  if (cached) {
    return res.json(cached);
  }

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('id, name, slug, domain, logo_url, primary_color, primary_color_dark, background_color, headline, tagline, footer_text')
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  setCachedOrg(`id:${id}`, data);
  res.json(data);
}));

export default router;
