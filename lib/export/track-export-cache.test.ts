import { describe, expect, it } from "vitest";

import {
  calculateDiff,
  isPlaylistExportData,
  PlaylistExportData,
} from "@/lib/export/track-export-cache";
import { SpotifyTrack } from "@/types/spotify";

function createSpotifyTrack(id: string): SpotifyTrack {
  return {
    id,
    name: `Track ${id}`,
    artists: [{ id: `artist-${id}`, name: `Artist ${id}` }],
    album: { id: `album-${id}`, name: `Album ${id}`, release_date: "2024-01-01" },
    duration_ms: 180000,
    external_ids: {},
    external_urls: { spotify: `https://open.spotify.com/track/${id}` },
  };
}

function createCache(overrides: Partial<PlaylistExportData> = {}): PlaylistExportData {
  return {
    spotifyPlaylistId: "playlist-1",
    spotifySnapshotId: "snapshot-1",
    playlistName: "Playlist",
    navidromePlaylistId: "nav-playlist-1",
    exportedAt: new Date().toISOString(),
    trackCount: 2,
    tracks: {
      "track-1": {
        spotifyTrackId: "track-1",
        navidromeSongId: "song-1",
        status: "matched",
        matchStrategy: "isrc",
        matchScore: 1,
        matchedAt: new Date().toISOString(),
      },
      "track-2": {
        spotifyTrackId: "track-2",
        status: "unmatched",
        matchStrategy: "none",
        matchScore: 0,
        matchedAt: new Date().toISOString(),
      },
    },
    statistics: {
      total: 2,
      matched: 1,
      unmatched: 1,
      ambiguous: 0,
    },
    ...overrides,
  };
}

describe("track export cache", () => {
  it("validates well-formed cached playlist data", () => {
    const cache = createCache();
    expect(isPlaylistExportData(cache)).toBe(true);
  });

  it("rejects malformed cached playlist data", () => {
    const malformed = {
      ...createCache(),
      tracks: {
        "track-1": {
          spotifyTrackId: "track-1",
          status: "bad-status",
        },
      },
    };

    expect(isPlaylistExportData(malformed)).toBe(false);
  });

  it("calculates new, unchanged, and removed tracks", () => {
    const currentTracks = [
      createSpotifyTrack("track-1"),
      createSpotifyTrack("track-3"),
    ];

    const diff = calculateDiff(currentTracks, createCache());

    expect(diff.unchangedTracks).toHaveLength(1);
    expect(diff.unchangedTracks[0].spotifyTrack.id).toBe("track-1");
    expect(diff.newTracks.map((track) => track.id)).toEqual(["track-3"]);
    expect(diff.removedTracks).toEqual(["track-2"]);
  });
});
