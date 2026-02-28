import { Hono } from 'hono';

const auth = new Hono();

// Demo mode - all auth endpoints are no-ops
auth.get('/login', (c) => c.json({ message: 'Demo mode - no login required' }));
auth.get('/callback', (c) => c.json({ message: 'Demo mode - no login required' }));
auth.post('/refresh', (c) => c.json({ accessToken: 'demo-token' }));
auth.post('/logout', (c) => c.json({ success: true }));

export default auth;
