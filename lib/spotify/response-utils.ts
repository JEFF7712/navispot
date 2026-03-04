export async function parseSpotifyErrorMessage(response: Response): Promise<string> {
  const status = response.status;
  const message = `Spotify API error: ${status}`;

  try {
    const text = await response.text();
    if (!text) {
      return message;
    }

    const trimmed = text.trim();
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed) as { error?: { message?: string } };
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    }

    return `${message} - ${trimmed.slice(0, 100)}`;
  } catch {
    return message;
  }
}

export function getRetryAfterSeconds(
  response: Response,
  options?: { defaultDelaySec?: number; maxDelaySec?: number }
): number {
  const defaultDelay = options?.defaultDelaySec ?? 5;
  const maxDelay = options?.maxDelaySec ?? 60;

  const header = response.headers.get('Retry-After');
  const parsed = header ? Number.parseInt(header, 10) : NaN;
  if (!header || Number.isNaN(parsed) || parsed <= 0) {
    return defaultDelay;
  }

  return Math.min(parsed, maxDelay);
}
