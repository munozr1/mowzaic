import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { status, address, city, state, postal, phone, privacyAgreement, marketingConsent } = req.body;

    if (!status || !address) {
        return res.status(400).json({ error: 'Missing required tracking fields' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Use service role key if available for writing to events without RLS issues, 
    // or standard key if RLS allows authenticated users to write (assuming this is public/anon for landing page)
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    );

    try {
        const { error } = await supabase
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
                        phone: phone || 'not_provided', // Ensure phone is captured
                        privacy_agreement: privacyAgreement,
                        marketing_consent: marketingConsent,
                        ip_address: ip
                    },
                    source: 'landing_page_validation'
                }
            ]);

        if (error) {
            console.error('Supabase logging error:', error);
            // Don't fail the request if logging fails, but log it server-side
            return res.status(500).json({ error: 'Failed to log demand' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Track demand error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
