import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { signSpotifyTokenCookie, verifySpotifyTokenCookie } from './spotify-cookie';
import type { SpotifyToken } from '@/types/spotify-auth';

describe('spotify-cookie helpers', () => {
  beforeEach(() => {
    process.env.SPOTIFY_TOKEN_COOKIE_SECRET = 'test-cookie-secret';
  });

  afterEach(() => {
    delete process.env.SPOTIFY_TOKEN_COOKIE_SECRET;
  });

  const token: SpotifyToken = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: Date.now() + 10000,
    tokenType: 'Bearer',
    scope: 'user-read-private',
  };

  it('signs and verifies a token', () => {
    const cookieValue = signSpotifyTokenCookie(token);
    const parsed = verifySpotifyTokenCookie(cookieValue);
    expect(parsed).toEqual(token);
  });

  it('throws when the signature is invalid', () => {
    const cookieValue = signSpotifyTokenCookie(token);
    const [payload, signature] = cookieValue.split('.');
    const tamperedPayload = payload.slice(0, -1) + (payload.slice(-1) === 'a' ? 'b' : 'a');
    expect(() => verifySpotifyTokenCookie(`${tamperedPayload}.${signature}`)).toThrow('Invalid spotify token signature');
  });
});
