import { createClient } from '@supabase/supabase-js';
import { serialize } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { access_token, refresh_token } = req.body;

    if (!access_token || !refresh_token) {
        return res.status(400).json({ error: 'Tokens are required' });
    }

    // Verify the access token by getting the user
    const supabase = createClient(
        // eslint-disable-next-line no-undef
        process.env.SUPABASE_URL,
        // eslint-disable-next-line no-undef
        process.env.SUPABASE_ANON_KEY
    );

    const { data: { user }, error } = await supabase.auth.getUser(access_token);

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid access token' });
    }

    // Set refresh token in HttpOnly cookie
    const cookie = serialize('sb-refresh-token', refresh_token, {
        httpOnly: true,
        // eslint-disable-next-line no-undef
        secure: process.env.MODE !== 'development', // Secure only in production
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ user });
}
