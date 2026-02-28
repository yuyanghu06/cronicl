import { env } from '../lib/env';

const AUTHORIZATION_ENDPOINT = 'https://railway.com/oauth/authorize';
const TOKEN_ENDPOINT = 'https://railway.com/oauth/token';
const USERINFO_ENDPOINT = 'https://railway.com/oauth/userinfo';

export interface RailwayUserInfo {
  sub: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export function buildAuthorizationURL(state: string): string {
  if (!env.RAILWAY_OAUTH_CLIENT_ID || !env.RAILWAY_OAUTH_CALLBACK_URL) {
    throw new Error('Railway OAuth not configured');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.RAILWAY_OAUTH_CLIENT_ID,
    redirect_uri: env.RAILWAY_OAUTH_CALLBACK_URL,
    state,
    scope: 'openid profile email',
  });

  return `${AUTHORIZATION_ENDPOINT}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ access_token: string; id_token: string }> {
  if (
    !env.RAILWAY_OAUTH_CLIENT_ID ||
    !env.RAILWAY_OAUTH_CLIENT_SECRET ||
    !env.RAILWAY_OAUTH_CALLBACK_URL
  ) {
    throw new Error('Railway OAuth not configured');
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.RAILWAY_OAUTH_CALLBACK_URL,
      client_id: env.RAILWAY_OAUTH_CLIENT_ID,
      client_secret: env.RAILWAY_OAUTH_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    id_token: data.id_token,
  };
}

export async function getUserInfo(
  accessToken: string
): Promise<RailwayUserInfo> {
  const response = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`UserInfo request failed: ${error}`);
  }

  const data = await response.json();
  return {
    sub: data.sub,
    email: data.email,
    name: data.name ?? null,
    avatar_url: data.picture ?? data.avatar_url ?? null,
  };
}
