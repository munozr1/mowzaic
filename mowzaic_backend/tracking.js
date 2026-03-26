import express from 'express';
import { supabaseAdmin } from './db.js';
import { asyncHandler } from './utils.js';
import logger from './logger.js';

const router = express.Router();

// Public endpoint — no auth required
router.post('/track-demand', asyncHandler(async (req, res) => {
  const { status, address, city, state, postal, phone, privacyAgreement, marketingConsent } = req.body;

  if (!status || !address) {
    return res.status(400).json({ error: 'Missing required tracking fields' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const { error } = await supabaseAdmin
    .from('events')
    .insert([
      {
        event_type: 'demand_tracking',
        metadata: {
          status,
          address,
          city,
          state,
          postal,
          phone: phone || 'not_provided',
          privacy_agreement: privacyAgreement,
          marketing_consent: marketingConsent,
          ip_address: ip
        },
        source: 'landing_page_validation'
      }
    ]);

  if (error) {
    logger.error('Track demand insert error:', error);
    return res.status(500).json({ error: 'Failed to log demand' });
  }

  res.status(200).json({ success: true });
}));

export default router;
