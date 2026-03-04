import { NextRequest, NextResponse } from 'next/server';

import {
  buildLidarrProxyTarget,
  getLidarrProxyBaseUrl,
} from '@/lib/lidarr/proxy-config';

interface LidarrProxyPayload {
  endpoint: string;
  method?: string;
  body?: string;
  apiKey?: string;
}

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as LidarrProxyPayload;
    const baseUrl = getLidarrProxyBaseUrl();

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Lidarr proxy is not configured. Set LIDARR_INTERNAL_URL.' },
        { status: 500 },
      );
    }

    if (!payload.apiKey) {
      return NextResponse.json({ error: 'Missing Lidarr API key' }, { status: 400 });
    }

    const method = (payload.method || 'GET').toUpperCase();
    if (!ALLOWED_METHODS.has(method)) {
      return NextResponse.json({ error: 'Unsupported method' }, { status: 400 });
    }

    const targetUrl = buildLidarrProxyTarget(baseUrl, payload.endpoint);
    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers: {
        'X-Api-Key': payload.apiKey,
        ...(payload.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: payload.body,
      cache: 'no-store',
    });

    const responseBody = await upstreamResponse.text();
    const contentType =
      upstreamResponse.headers.get('content-type') || 'application/json';

    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      headers: {
        'content-type': contentType,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to proxy request to Lidarr' },
      { status: 500 },
    );
  }
}
