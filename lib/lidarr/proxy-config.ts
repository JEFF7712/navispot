const LIDARR_PROXY_FLAG = 'true';

export function shouldUseLidarrProxy(): boolean {
  return process.env.NEXT_PUBLIC_LIDARR_PROXY === LIDARR_PROXY_FLAG;
}

export function getLidarrProxyBaseUrl(): string | null {
  const internalUrl = process.env.LIDARR_INTERNAL_URL;
  if (!internalUrl) {
    return null;
  }

  return internalUrl.replace(/\/+$/, '');
}

export function buildLidarrProxyTarget(baseUrl: string, endpoint: string): string {
  if (!endpoint.startsWith('/')) {
    throw new Error('Proxy endpoint must start with "/"');
  }

  return `${baseUrl.replace(/\/+$/, '')}${endpoint}`;
}
