import { NextRequest, NextResponse } from 'next/server';
import { verifySpotifyTokenCookie } from '@/lib/auth/spotify-cookie';

export async function GET(request: NextRequest) {
  const tokenCookie = request.cookies.get('spotify_token')?.value;

  if (!tokenCookie) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const decoded = verifySpotifyTokenCookie(tokenCookie);

    if (decoded.expiresAt <= Date.now()) {
      const response = NextResponse.json({ authenticated: false, error: 'expired' });
      response.cookies.delete('spotify_token');
      return response;
    }

    return NextResponse.json({
      authenticated: true,
      token: {
        ...decoded,
        refreshToken: '',
      },
    });
  } catch {
    const response = NextResponse.json({ authenticated: false, error: 'invalid_token' });
    response.cookies.delete('spotify_token');
    return response;
  }
}
