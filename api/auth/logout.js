import { createClient } from '@supabase/supabase-js';
import { parse, serialize } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const cookies = parse(req.headers.cookie || '');
    const refreshToken = cookies['sb-refresh-token'];

    // Even if no token, we want to clear the cookie
    const clearCookie = serialize('sb-refresh-token', '', {
        httpOnly: true,
        secure: process.env.MODE !== 'development',
        sameSite: 'strict',
        maxAge: -1,
        path: '/',
    });

    res.setHeader('Set-Cookie', clearCookie);

    if (refreshToken) {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        // Best effort sign out, though we mainly care about clearing the cookie
        await supabase.auth.signOut();
    }

    return res.status(200).json({ message: 'Logged out successfully' });
}
