import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { db } from '../db/client';
import { users, authEvents, oauthIdentities } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '../lib/env';
import { createSession, revokeSession } from '../services/token';
import { generateSecureToken, hashPassword, verifyPassword } from '../lib/hash';
import {
  buildAuthorizationURL,
  exchangeCodeForTokens,
  getUserInfo,
} from '../services/oauth';
import { authRateLimiter } from '../middleware/ratelimit';

const auth = new Hono();

auth.use('*', authRateLimiter);

const DEV_USER_ID = '00000000-0000-0000-0000-000000000000';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** SameSite policy: cross-site in production (different Railway subdomains), Lax in dev */
const sessionCookieSameSite = () => env.NODE_ENV === 'production' ? 'None' as const : 'Lax' as const;
const sessionCookieSecure = () => env.NODE_ENV === 'production';

function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string) {
  setCookie(c, 'session', token, {
    httpOnly: true,
    secure: sessionCookieSecure(),
    sameSite: sessionCookieSameSite(),
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

// Email+Password registration
auth.post('/register', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string; name?: string }>();
  const { email, password, name } = body;

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return c.json({ error: 'Invalid email address' }, 400);
  }
  if (!password || password.length < 8 || password.length > 128) {
    return c.json({ error: 'Password must be between 8 and 128 characters' }, 400);
  }
  if (name && (typeof name !== 'string' || name.length > 200)) {
    return c.json({ error: 'Name must be 200 characters or fewer' }, 400);
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  const passwordHashValue = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      name: name ?? null,
      passwordHash: passwordHashValue,
    })
    .returning();

  const sessionToken = await createSession(newUser.id);

  await db.insert(authEvents).values({
    userId: newUser.id,
    eventType: 'register',
    ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
    userAgent: c.req.header('user-agent'),
  });

  setSessionCookie(c, sessionToken);

  return c.json({ success: true });
});

// Email+Password login
auth.post('/login/email', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (!user || !user.passwordHash) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const sessionToken = await createSession(user.id);

  await db.insert(authEvents).values({
    userId: user.id,
    eventType: 'email_login',
    ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
    userAgent: c.req.header('user-agent'),
  });

  setSessionCookie(c, sessionToken);

  return c.json({ success: true });
});

// OAuth login — redirect to Railway (or dev bypass)
auth.get('/login', async (c) => {
  // Dev bypass: when OAuth is not configured in non-production, auto-login as dev user
  if (env.NODE_ENV !== 'production' && !env.RAILWAY_OAUTH_CLIENT_ID) {
    // Ensure dev user exists
    const existing = await db.query.users.findFirst({
      where: eq(users.id, DEV_USER_ID),
    });
    if (!existing) {
      await db.insert(users).values({
        id: DEV_USER_ID,
        email: 'dev@localhost',
        name: 'Dev User',
      });
    }

    const sessionToken = await createSession(DEV_USER_ID);

    await db.insert(authEvents).values({
      userId: DEV_USER_ID,
      eventType: 'oauth_login',
      ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
    });

    setCookie(c, 'session', sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return c.redirect(`${env.FRONTEND_URL}/auth/callback`);
  }

  try {
    const state = generateSecureToken();

    setCookie(c, 'oauth_state', state, {
      httpOnly: true,
      secure: sessionCookieSecure(),
      sameSite: 'Lax',
      maxAge: 60 * 10,
      path: '/',
    });

    const authUrl = buildAuthorizationURL(state);
    return c.redirect(authUrl);
  } catch (error) {
    console.error('OAuth login error:', error);
    return c.json({ error: 'OAuth not configured' }, 503);
  }
});

// OAuth callback — exchange code, find/create user, set session cookie
auth.get('/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const storedState = getCookie(c, 'oauth_state');

  deleteCookie(c, 'oauth_state');

  if (!code || !state || !storedState || state !== storedState) {
    return c.redirect(`${env.FRONTEND_URL}/auth/error?reason=invalid_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await getUserInfo(tokens.access_token);

    // Find existing OAuth identity
    const existingIdentity = await db.query.oauthIdentities.findFirst({
      where: and(
        eq(oauthIdentities.provider, 'railway'),
        eq(oauthIdentities.providerSub, userInfo.sub)
      ),
    });

    let userId: string;

    if (existingIdentity) {
      // Returning user — update profile
      userId = existingIdentity.userId;
      await db
        .update(users)
        .set({
          name: userInfo.name,
          avatarUrl: userInfo.avatar_url,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      // Check if user with this email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, userInfo.email),
      });

      if (existingUser) {
        // Link OAuth identity to existing user
        userId = existingUser.id;
        await db.insert(oauthIdentities).values({
          userId,
          provider: 'railway',
          providerSub: userInfo.sub,
        });
        await db
          .update(users)
          .set({
            name: userInfo.name ?? existingUser.name,
            avatarUrl: userInfo.avatar_url ?? existingUser.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else {
        // Create new user + link identity
        const [newUser] = await db
          .insert(users)
          .values({
            email: userInfo.email,
            name: userInfo.name,
            avatarUrl: userInfo.avatar_url,
          })
          .returning();

        userId = newUser.id;

        await db.insert(oauthIdentities).values({
          userId,
          provider: 'railway',
          providerSub: userInfo.sub,
        });
      }
    }

    const sessionToken = await createSession(userId);

    // Log login event
    await db.insert(authEvents).values({
      userId,
      eventType: 'oauth_login',
      ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
      userAgent: c.req.header('user-agent'),
    });

    setSessionCookie(c, sessionToken);

    return c.redirect(`${env.FRONTEND_URL}/auth/callback`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.redirect(`${env.FRONTEND_URL}/auth/error?reason=exchange_failed`);
  }
});

// Logout
auth.post('/logout', async (c) => {
  const sessionToken = getCookie(c, 'session');

  if (sessionToken) {
    await revokeSession(sessionToken);
  }

  deleteCookie(c, 'session', { path: '/' });

  return c.json({ success: true });
});

export default auth;
