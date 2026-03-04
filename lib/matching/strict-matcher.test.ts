import { describe, expect, it, vi } from "vitest";

import { NavidromeApiClient } from "@/lib/navidrome/client";
import {
  filterStrictMatches,
  matchByStrict,
  normalizeString,
} from "@/lib/matching/strict-matcher";
import { NavidromeNativeSong } from "@/types/navidrome";
import { SpotifyTrack } from "@/types/spotify";

function createSpotifyTrack(overrides: Partial<SpotifyTrack> = {}): SpotifyTrack {
  return {
    id: "track-1",
    name: "Song Title",
    artists: [{ id: "artist-1", name: "Artist Name" }],
    album: { id: "album-1", name: "Album", release_date: "2024-01-01" },
    duration_ms: 180000,
    external_ids: {},
    external_urls: { spotify: "https://open.spotify.com/track/track-1" },
    ...overrides,
  };
}

function createNativeSong(overrides: Partial<NavidromeNativeSong> = {}): NavidromeNativeSong {
  return {
    id: "song-1",
    title: "Song Title",
    artist: "Artist Name",
    artistId: "artist-1",
    album: "Album",
    albumId: "album-1",
    duration: 180,
    ...overrides,
  };
}

describe("strict matcher", () => {
  it("normalizes punctuation and spacing", () => {
    expect(normalizeString("  Hello,   World!!! ")).toBe("hello world");
  });

  it("filters strict matches with normalized artist and title", () => {
    const songs = [
      createNativeSong({ id: "match", title: "Song Title", artist: "Artist Name" }),
      createNativeSong({ id: "miss", title: "Different", artist: "Artist Name" }),
    ];

    const matches = filterStrictMatches(
      songs,
      normalizeString("Artist Name"),
      normalizeString("Song Title"),
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe("match");
  });

  it("returns matched when strict search finds an exact hit", async () => {
    const searchByTitle = vi
      .fn()
      .mockResolvedValue([createNativeSong({ id: "song-match" })]);
    const client = { searchByTitle } as unknown as NavidromeApiClient;

    const result = await matchByStrict(client, createSpotifyTrack());

    expect(searchByTitle).toHaveBeenCalledWith("Song Title", 100);
    expect(result.status).toBe("matched");
    expect(result.matchStrategy).toBe("strict");
    expect(result.navidromeSong?.id).toBe("song-match");
  });

  it("returns unmatched when search throws", async () => {
    const client = {
      searchByTitle: vi.fn().mockRejectedValue(new Error("boom")),
    } as unknown as NavidromeApiClient;

    const result = await matchByStrict(client, createSpotifyTrack());

    expect(result.status).toBe("unmatched");
    expect(result.matchScore).toBe(0);
  });
});
