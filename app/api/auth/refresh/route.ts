import { NextRequest, NextResponse } from 'next/server';
import { SpotifyToken } from '@/types';
import { signSpotifyTokenCookie, verifySpotifyTokenCookie } from '@/lib/auth/spotify-cookie';

export async function POST(request: NextRequest) {
  try {
    const cookieValue = request.cookies.get('spotify_token')?.value;
    if (!cookieValue) {
      return NextResponse.json({ error: 'Missing session token' }, { status: 401 });
    }

    let currentToken: SpotifyToken;
    try {
      currentToken = verifySpotifyTokenCookie(cookieValue);
    } catch {
      const invalidResponse = NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
      invalidResponse.cookies.delete('spotify_token');
      return invalidResponse;
    }

    if (!currentToken.refreshToken) {
      return NextResponse.json({ error: 'Missing refresh token' }, { status: 401 });
    }

    const newToken = await refreshAccessToken(currentToken.refreshToken);
    
    if (!newToken) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
    }

    const updatedToken: SpotifyToken = {
      ...currentToken,
      accessToken: newToken.access_token,
      refreshToken: newToken.refresh_token ?? currentToken.refreshToken,
      expiresAt: Date.now() + newToken.expires_in * 1000,
      tokenType: newToken.token_type,
      scope: newToken.scope,
    };

    const response = NextResponse.json({
      access_token: newToken.access_token,
      token_type: newToken.token_type,
      expires_in: newToken.expires_in,
      scope: newToken.scope,
    });
    const signedToken = signSpotifyTokenCookie(updatedToken);
    response.cookies.set('spotify_token', signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
  }
}

interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenRefreshResponse | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
