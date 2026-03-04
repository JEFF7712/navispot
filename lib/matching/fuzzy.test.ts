import { describe, expect, it } from "vitest";

import {
  calculateDurationSimilarity,
  findBestMatch,
  normalizeArtistName,
  normalizeTitle,
} from "@/lib/matching/fuzzy";
import { NavidromeSong } from "@/types/navidrome";
import { SpotifyTrack } from "@/types/spotify";

function createSpotifyTrack(overrides: Partial<SpotifyTrack> = {}): SpotifyTrack {
  return {
    id: "spotify-1",
    name: "Midnight City",
    artists: [{ id: "artist-1", name: "M83" }],
    album: { id: "album-1", name: "Hurry Up, We're Dreaming", release_date: "2011-10-18" },
    duration_ms: 244000,
    external_ids: {},
    external_urls: { spotify: "https://open.spotify.com/track/spotify-1" },
    ...overrides,
  };
}

function createNavidromeSong(overrides: Partial<NavidromeSong> = {}): NavidromeSong {
  return {
    id: "nav-1",
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up We're Dreaming",
    duration: 244,
    ...overrides,
  };
}

describe("fuzzy matcher helpers", () => {
  it("normalizes artist names and strips collaboration tokens", () => {
    expect(normalizeArtistName("Artist feat. Guest & Friend")).toBe(
      "artist guest friend",
    );
  });

  it("normalizes title and strips live indicators", () => {
    expect(normalizeTitle("My Song (Live)")).toBe("my song");
  });

  it("keeps high similarity for very small duration deltas", () => {
    const similarity = calculateDurationSimilarity(180000, 181);
    expect(similarity).toBeGreaterThanOrEqual(0.9);
  });

  it("marks ambiguous matches when top results are close", () => {
    const spotifyTrack = createSpotifyTrack();
    const candidates: NavidromeSong[] = [
      createNavidromeSong({ id: "first", title: "Midnight City" }),
      createNavidromeSong({ id: "second", title: "Midnight City" }),
    ];

    const result = findBestMatch(spotifyTrack, candidates, 0.75);

    expect(result.bestMatch).toBeDefined();
    expect(result.matches.length).toBeGreaterThan(1);
    expect(result.hasAmbiguous).toBe(true);
  });
});
