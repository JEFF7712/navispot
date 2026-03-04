import { SpotifyTrack } from '@/types/spotify';

export interface TrackExportStatus {
  spotifyTrackId: string;
  navidromeSongId?: string;
  status: 'matched' | 'ambiguous' | 'unmatched';
  matchStrategy: 'isrc' | 'fuzzy' | 'strict' | 'none';
  matchScore: number;
  matchedAt: string;
}

export interface PlaylistExportData {
  spotifyPlaylistId: string;
  spotifySnapshotId: string;
  playlistName: string;
  navidromePlaylistId?: string;
  exportedAt: string;
  trackCount: number;
  tracks: Record<string, TrackExportStatus>;
  statistics: {
    total: number;
    matched: number;
    unmatched: number;
    ambiguous: number;
  };
}

export interface DiffResult {
  newTracks: SpotifyTrack[];
  unchangedTracks: Array<{
    spotifyTrack: SpotifyTrack;
    cachedStatus: TrackExportStatus;
  }>;
  removedTracks: string[];
}

const STORAGE_KEY_PREFIX = 'navispot-playlist-export-';
const DEFAULT_MAX_AGE_DAYS = 90;
const VALID_MATCH_STATUSES: ReadonlySet<TrackExportStatus['status']> = new Set([
  'matched',
  'ambiguous',
  'unmatched',
]);
const VALID_MATCH_STRATEGIES: ReadonlySet<TrackExportStatus['matchStrategy']> =
  new Set(['isrc', 'fuzzy', 'strict', 'none']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
}

function isTrackExportStatus(value: unknown): value is TrackExportStatus {
  if (!isRecord(value)) {
    return false;
  }

  const status = value.status;
  const matchStrategy = value.matchStrategy;

  return (
    typeof value.spotifyTrackId === 'string' &&
    (value.navidromeSongId === undefined || typeof value.navidromeSongId === 'string') &&
    typeof status === 'string' &&
    VALID_MATCH_STATUSES.has(status as TrackExportStatus['status']) &&
    typeof matchStrategy === 'string' &&
    VALID_MATCH_STRATEGIES.has(matchStrategy as TrackExportStatus['matchStrategy']) &&
    typeof value.matchScore === 'number' &&
    Number.isFinite(value.matchScore) &&
    isValidDateString(value.matchedAt)
  );
}

function isPlaylistExportStatistics(
  value: unknown,
): value is PlaylistExportData['statistics'] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.total === 'number' &&
    Number.isFinite(value.total) &&
    value.total >= 0 &&
    typeof value.matched === 'number' &&
    Number.isFinite(value.matched) &&
    value.matched >= 0 &&
    typeof value.unmatched === 'number' &&
    Number.isFinite(value.unmatched) &&
    value.unmatched >= 0 &&
    typeof value.ambiguous === 'number' &&
    Number.isFinite(value.ambiguous) &&
    value.ambiguous >= 0
  );
}

export function isPlaylistExportData(value: unknown): value is PlaylistExportData {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.spotifyPlaylistId !== 'string' ||
    typeof value.spotifySnapshotId !== 'string' ||
    typeof value.playlistName !== 'string' ||
    (value.navidromePlaylistId !== undefined &&
      typeof value.navidromePlaylistId !== 'string') ||
    !isValidDateString(value.exportedAt) ||
    typeof value.trackCount !== 'number' ||
    !Number.isFinite(value.trackCount) ||
    value.trackCount < 0 ||
    !isRecord(value.tracks) ||
    !isPlaylistExportStatistics(value.statistics)
  ) {
    return false;
  }

  for (const trackStatus of Object.values(value.tracks)) {
    if (!isTrackExportStatus(trackStatus)) {
      return false;
    }
  }

  return true;
}

function parsePlaylistExportData(value: string): PlaylistExportData | undefined {
  try {
    const parsed = JSON.parse(value);
    return isPlaylistExportData(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function getStorageKey(playlistId: string): string {
  return `${STORAGE_KEY_PREFIX}${playlistId}`;
}

/**
 * Saves playlist export data to localStorage.
 * @param playlistId - The Spotify playlist ID
 * @param data - The playlist export data to save
 */
export function savePlaylistExportData(playlistId: string, data: PlaylistExportData): void {
  try {
    const key = getStorageKey(playlistId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save playlist export data:', error);
  }
}

/**
 * Loads playlist export data from localStorage.
 * @param playlistId - The Spotify playlist ID
 * @returns The cached playlist export data, or null if not found or on error
 */
export function loadPlaylistExportData(playlistId: string): PlaylistExportData | undefined {
  try {
    const key = getStorageKey(playlistId);
    const data = localStorage.getItem(key);
    if (!data) {
      return undefined;
    }

    const parsed = parsePlaylistExportData(data);
    if (!parsed) {
      localStorage.removeItem(key);
      return undefined;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load playlist export data:', error);
    return undefined;
  }
}

/**
 * Deletes playlist export data from localStorage.
 * @param playlistId - The Spotify playlist ID
 */
export function deletePlaylistExportData(playlistId: string): void {
  try {
    const key = getStorageKey(playlistId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to delete playlist export data:', error);
  }
}

/**
 * Gets all saved playlist export data from localStorage.
 * @returns A Map of playlist IDs to their export data
 */
export function getAllExportData(): Map<string, PlaylistExportData> {
  const result = new Map<string, PlaylistExportData>();
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = parsePlaylistExportData(data);
          if (parsed) {
            const playlistId = key.slice(STORAGE_KEY_PREFIX.length);
            result.set(playlistId, parsed);
          } else {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to get all export data:', error);
  }
  return result;
}

/**
 * Checks if a playlist is up to date with the current snapshot.
 * @param data - The cached playlist export data
 * @param currentSnapshotId - The current Spotify playlist snapshot ID
 * @returns True if the snapshot IDs match, false otherwise
 */
export function isPlaylistUpToDate(data: PlaylistExportData, currentSnapshotId: string): boolean {
  return data.spotifySnapshotId === currentSnapshotId;
}

/**
 * Calculates the differential export between current tracks and cached data.
 * @param currentTracks - The current list of Spotify tracks
 * @param cachedData - The cached playlist export data
 * @returns An object containing new, unchanged, and removed tracks
 */
export function calculateDiff(currentTracks: SpotifyTrack[], cachedData: PlaylistExportData): DiffResult {
  const newTracks: SpotifyTrack[] = [];
  const unchangedTracks: DiffResult['unchangedTracks'] = [];
  const removedTracks: string[] = [];

  const currentTrackIds = new Set(currentTracks.map(t => t.id));
  const cachedTrackIds = new Set(Object.keys(cachedData.tracks));

  currentTracks.forEach(track => {
    const cachedStatus = cachedData.tracks[track.id];
    if (cachedStatus) {
      unchangedTracks.push({ spotifyTrack: track, cachedStatus });
    } else {
      newTracks.push(track);
    }
  });

  cachedTrackIds.forEach(trackId => {
    if (!currentTrackIds.has(trackId)) {
      removedTracks.push(trackId);
    }
  });

  return { newTracks, unchangedTracks, removedTracks };
}

/**
 * Removes expired cache entries from localStorage.
 * @param maxAgeDays - Maximum age in days (defaults to 90)
 */
export function clearExpiredCache(maxAgeDays: number = DEFAULT_MAX_AGE_DAYS): void {
  const maxAge = maxAgeDays;
  const cutoffTime = Date.now() - maxAge * 24 * 60 * 60 * 1000;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = parsePlaylistExportData(data);
          if (!parsed) {
            keysToRemove.push(key);
            continue;
          }

          const exportedAt = new Date(parsed.exportedAt).getTime();
          if (exportedAt < cutoffTime) {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear expired cache:', error);
  }
}
