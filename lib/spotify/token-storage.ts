import { SpotifyToken } from '@/types';

export const isTokenExpired = (token: SpotifyToken): boolean => {
  const bufferMs = 60 * 1000;
  return Date.now() + bufferMs >= token.expiresAt;
};
