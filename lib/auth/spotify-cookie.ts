import crypto from 'node:crypto';
import { SpotifyToken } from '@/types/spotify-auth';

const COOKIE_SECRET_ENV = 'SPOTIFY_TOKEN_COOKIE_SECRET';

function getCookieSecret(): Buffer {
  const secret = process.env.SPOTIFY_TOKEN_COOKIE_SECRET;
  if (!secret) {
    throw new Error(`Missing ${COOKIE_SECRET_ENV}`);
  }
  return Buffer.from(secret, 'utf-8');
}

function createSignature(payload: string): string {
  return crypto
    .createHmac('sha256', getCookieSecret())
    .update(payload)
    .digest('base64url');
}

function encodePayload(token: SpotifyToken): string {
  return Buffer.from(JSON.stringify(token)).toString('base64url');
}

export function signSpotifyTokenCookie(token: SpotifyToken): string {
  const serialized = encodePayload(token);
  const signature = createSignature(serialized);
  return `${serialized}.${signature}`;
}

export function verifySpotifyTokenCookie(value: string): SpotifyToken {
  if (!value) {
    throw new Error('Missing spotify token cookie value');
  }

  const [payload, signature] = value.split('.');
  if (!payload || !signature) {
    throw new Error('Malformed spotify token cookie');
  }

  const expected = createSignature(payload);
  const signatureBuffer = Buffer.from(signature, 'base64url');
  const expectedBuffer = Buffer.from(expected, 'base64url');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid spotify token signature');
  }

  const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
  return JSON.parse(decoded) as SpotifyToken;
}
