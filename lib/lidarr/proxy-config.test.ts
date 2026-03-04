import { afterEach, describe, expect, it } from 'vitest';

import {
  buildLidarrProxyTarget,
  getLidarrProxyBaseUrl,
  shouldUseLidarrProxy,
} from './proxy-config';

describe('lidarr proxy config', () => {
  afterEach(() => {
    delete process.env.LIDARR_INTERNAL_URL;
    delete process.env.NEXT_PUBLIC_LIDARR_PROXY;
  });

  it('returns null when no internal url is configured', () => {
    expect(getLidarrProxyBaseUrl()).toBeNull();
  });

  it('normalizes internal url by trimming trailing slash', () => {
    process.env.LIDARR_INTERNAL_URL = 'http://lidarr/';
    expect(getLidarrProxyBaseUrl()).toBe('http://lidarr');
  });

  it('builds target url from base and endpoint', () => {
    expect(buildLidarrProxyTarget('http://lidarr/', '/api/v1/system/status')).toBe(
      'http://lidarr/api/v1/system/status',
    );
  });

  it('rejects invalid endpoint path', () => {
    expect(() => buildLidarrProxyTarget('http://lidarr', 'api/v1/system/status')).toThrow(
      'Proxy endpoint must start with "/"',
    );
  });

  it('enables proxy only when env var is true', () => {
    process.env.NEXT_PUBLIC_LIDARR_PROXY = 'false';
    expect(shouldUseLidarrProxy()).toBe(false);

    process.env.NEXT_PUBLIC_LIDARR_PROXY = 'true';
    expect(shouldUseLidarrProxy()).toBe(true);
  });
});
