import { SpotifyTrack } from "@/types/spotify"

export interface CsvPlaylist {
  id: string
  name: string
  tracks: SpotifyTrack[]
}

/**
 * Parse an Exportify-format CSV into SpotifyTrack[].
 *
 * Expected columns (Exportify default):
 *   Spotify URI, Track Name, Artist Name(s), Album Name, Disc Number,
 *   Track Number, Track Duration (ms), Added By, Added At
 *
 * Optional columns: ISRC, Album Release Date
 *
 * Also supports simpler CSV with just: Track Name, Artist Name(s), Album Name
 */
export function parseCsvToTracks(csvText: string): SpotifyTrack[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase())

  // Map column names to indices
  const col = (names: string[]): number => {
    for (const name of names) {
      const idx = headers.indexOf(name.toLowerCase())
      if (idx !== -1) return idx
    }
    return -1
  }

  const nameCol = col(["track name", "name", "title", "song name", "song"])
  const artistCol = col(["artist name(s)", "artist", "artists", "artist name"])
  const albumCol = col(["album name", "album", "album title"])
  const durationCol = col(["track duration (ms)", "duration (ms)", "duration_ms", "duration"])
  const isrcCol = col(["isrc"])
  const uriCol = col(["spotify uri", "uri", "spotify id"])
  const releaseDateCol = col(["album release date", "release date", "release_date"])

  if (nameCol === -1) {
    throw new Error("CSV must have a 'Track Name' or 'Name' column")
  }

  const tracks: SpotifyTrack[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length <= nameCol) continue

    const name = values[nameCol]?.trim()
    if (!name) continue

    const artistStr = artistCol !== -1 ? values[artistCol]?.trim() || "" : ""
    const artists = artistStr
      ? artistStr.split(/,\s*/).map((a, idx) => ({
          id: `csv-artist-${i}-${idx}`,
          name: a.trim(),
        }))
      : [{ id: `csv-artist-${i}-0`, name: "Unknown" }]

    const albumName = albumCol !== -1 ? values[albumCol]?.trim() || "" : ""
    const durationMs = durationCol !== -1 ? parseInt(values[durationCol]) || 0 : 0
    const isrc = isrcCol !== -1 ? values[isrcCol]?.trim() || undefined : undefined

    // Extract Spotify ID from URI (spotify:track:XXXX) or use as-is
    let spotifyId = `csv-${i}`
    if (uriCol !== -1 && values[uriCol]) {
      const uri = values[uriCol].trim()
      const match = uri.match(/spotify:track:(\w+)/)
      if (match) spotifyId = match[1]
      else if (uri && !uri.includes(":")) spotifyId = uri
    }

    const releaseDate = releaseDateCol !== -1 ? values[releaseDateCol]?.trim() || "" : ""

    tracks.push({
      id: spotifyId,
      name,
      artists,
      album: {
        id: `csv-album-${i}`,
        name: albumName,
        release_date: releaseDate,
      },
      duration_ms: durationMs,
      external_ids: isrc ? { isrc } : {},
      external_urls: { spotify: "" },
    })
  }

  return tracks
}

/**
 * Extract playlist name from filename.
 * e.g. "My Playlist.csv" -> "My Playlist"
 */
export function playlistNameFromFilename(filename: string): string {
  return filename.replace(/\.csv$/i, "").trim() || "Imported Playlist"
}

/**
 * Parse a single CSV line handling quoted fields with commas.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
