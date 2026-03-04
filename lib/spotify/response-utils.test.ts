import { describe, it, expect } from 'vitest';
import { getRetryAfterSeconds, parseSpotifyErrorMessage } from './response-utils';

describe('response-utils', () => {
  it('extracts JSON error messages', async () => {
    const response = new Response(JSON.stringify({ error: { message: 'all good' } }), { status: 502 });
    await expect(parseSpotifyErrorMessage(response)).resolves.toBe('all good');
  });

  it('falls back to trimmed text when JSON message is missing', async () => {
    const response = new Response('Service unavailable', { status: 503 });
    await expect(parseSpotifyErrorMessage(response)).resolves.toBe('Spotify API error: 503 - Service unavailable');
  });

  it('returns the default message when body is empty', async () => {
    const response = new Response(null, { status: 404 });
    await expect(parseSpotifyErrorMessage(response)).resolves.toBe('Spotify API error: 404');
  });

  it('uses default delay when Retry-After is missing or invalid', () => {
    const response = new Response(null, { status: 429 });
    expect(getRetryAfterSeconds(response)).toBe(5);
    const invalid = new Response(null, { status: 429, headers: { 'Retry-After': 'abc' } });
    expect(getRetryAfterSeconds(invalid)).toBe(5);
  });

  it('returns the header value clamped to max', () => {
    const response = new Response(null, { status: 429, headers: { 'Retry-After': '12' } });
    expect(getRetryAfterSeconds(response)).toBe(12);

    const farFuture = new Response(null, { status: 429, headers: { 'Retry-After': '120' } });
    expect(getRetryAfterSeconds(farFuture)).toBe(60);
  });
});
