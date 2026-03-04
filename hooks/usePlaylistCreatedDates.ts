import { useEffect, useState } from 'react';

import { spotifyClient } from '@/lib/spotify/client';
import type { SpotifyPlaylist } from '@/types/spotify';
import type { SpotifyToken } from '@/types/spotify-auth';

interface UsePlaylistCreatedDatesProps {
  isSpotifyAuthenticated: boolean;
  spotifyToken: SpotifyToken | null;
  playlists: SpotifyPlaylist[];
}

interface UsePlaylistCreatedDatesReturn {
  playlistCreatedDates: Map<string, string>;
  fetchingDates: boolean;
}

const CACHE_KEY = 'navispot-playlist-created-dates';

function loadCachedDates(): Map<string, string> {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return new Map();
    }
    const parsed = JSON.parse(cached) as Record<string, string>;
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function saveCachedDates(dates: Map<string, string>): void {
  try {
    const serialized: Record<string, string> = {};
    dates.forEach((value, key) => {
      serialized[key] = value;
    });
    localStorage.setItem(CACHE_KEY, JSON.stringify(serialized));
  } catch {
    // ignore storage failures
  }
}

export function usePlaylistCreatedDates({
  isSpotifyAuthenticated,
  spotifyToken,
  playlists,
}: UsePlaylistCreatedDatesProps): UsePlaylistCreatedDatesReturn {
  const [playlistCreatedDates, setPlaylistCreatedDates] = useState<
    Map<string, string>
  >(new Map());
  const [fetchingDates, setFetchingDates] = useState(false);

  useEffect(() => {
    if (!isSpotifyAuthenticated || !spotifyToken || playlists.length === 0) {
      return;
    }

    let cancelled = false;

    async function fetchDates() {
      const cachedDates = loadCachedDates();
      if (cachedDates.size > 0) {
        setPlaylistCreatedDates(cachedDates);
      }

      const missingIds = playlists
        .filter((playlist) => !cachedDates.has(playlist.id))
        .map((playlist) => playlist.id);

      if (missingIds.length === 0) {
        return;
      }

      setFetchingDates(true);
      try {
        if (!spotifyToken) {
          return;
        }
        spotifyClient.setToken(spotifyToken);

        for (let index = 0; index < missingIds.length; index++) {
          if (cancelled) break;

          const playlistId = missingIds[index];
          try {
            const createdDate = await spotifyClient.getPlaylistCreatedDate(
              playlistId,
            );
            if (!cancelled && createdDate) {
              setPlaylistCreatedDates((prev) => {
                const next = new Map(prev);
                next.set(playlistId, createdDate);

                if ((index + 1) % 10 === 0) {
                  saveCachedDates(next);
                }

                return next;
              });
            }
          } catch {
            // skip playlists that fail (deleted/access revoked)
          }
        }

        setPlaylistCreatedDates((prev) => {
          saveCachedDates(prev);
          return prev;
        });
      } catch (error) {
        console.warn('Failed to fetch playlist created dates:', error);
      } finally {
        if (!cancelled) {
          setFetchingDates(false);
        }
      }
    }

    fetchDates();

    return () => {
      cancelled = true;
    };
  }, [isSpotifyAuthenticated, spotifyToken, playlists]);

  return {
    playlistCreatedDates,
    fetchingDates,
  };
}
