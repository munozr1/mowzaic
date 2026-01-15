import { createClient } from '@supabase/supabase-js';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const supabase = createClient(
            // eslint-disable-next-line no-undef
    process.env.SUPABASE_URL,
            // eslint-disable-next-line no-undef
    process.env.SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  const { session, user } = data;

  // Set refresh token in HttpOnly cookie
  const cookie = serialize('sb-refresh-token', session.refresh_token, {
    httpOnly: true,
            // eslint-disable-next-line no-undef
    secure: process.env.MODE !== 'development', // Secure only in production
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  res.setHeader('Set-Cookie', cookie);

  // Return access token and user data (NOT the refresh token)
  return res.status(200).json({
    user,
    access_token: session.access_token,
    expires_in: session.expires_in,
  });
}
