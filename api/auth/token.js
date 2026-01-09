import { createClient } from '@supabase/supabase-js';
import { parse, serialize } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const cookies = parse(req.headers.cookie || '');
    const refreshToken = cookies['sb-refresh-token'];

    if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token found' });
    }

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
    });

    if (error) {
        // Clear the invalid cookie
        res.setHeader('Set-Cookie', serialize('sb-refresh-token', '', {
            httpOnly: true,
            secure: process.env.VITE_MODE !== 'development',
            sameSite: 'strict',
            maxAge: -1,
            path: '/',
        }));
        return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const { session, user } = data;

    // Rotate refresh token
    const newCookie = serialize('sb-refresh-token', session.refresh_token, {
        httpOnly: true,
        secure: process.env.VITE_MODE !== 'development',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });

    res.setHeader('Set-Cookie', newCookie);

    return res.status(200).json({
        user,
        access_token: session.access_token,
        expires_in: session.expires_in,
    });
}
