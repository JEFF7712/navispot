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
  const normalizedCsvText = csvText.replace(/^\uFEFF/, "")
  const lines = normalizedCsvText.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.replace(/^\uFEFF/, "").trim().toLowerCase(),
  )

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
    const artistNames = artistStr
      ? artistStr.split(/,\s*/).map((name) => name.trim()).filter(Boolean)
      : []
    const artists =
      artistNames.length > 0
        ? artistNames.map((artistName, idx) => ({
            id: `csv-artist-${i}-${idx}`,
            name: artistName,
          }))
        : [{ id: `csv-artist-${i}-0`, name: "Unknown" }]

    const albumName = albumCol !== -1 ? values[albumCol]?.trim() || "" : ""
    const durationMs =
      durationCol !== -1 ? parseDurationMs(values[durationCol]) : 0
    const isrc = isrcCol !== -1 ? values[isrcCol]?.trim() || undefined : undefined

    const spotifyUri = uriCol !== -1 ? values[uriCol] : undefined
    const spotifyId = extractSpotifyTrackId(spotifyUri, `csv-${i}`)

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

function parseDurationMs(rawValue: string | undefined): number {
  if (!rawValue) return 0

  const value = rawValue.trim()
  if (!value) return 0

  if (/^\d+$/.test(value)) {
    return Number.parseInt(value, 10) || 0
  }

  const parts = value.split(":").map((part) => Number.parseInt(part, 10))
  if (parts.some((part) => Number.isNaN(part))) {
    return 0
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    return (minutes * 60 + seconds) * 1000
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return (hours * 3600 + minutes * 60 + seconds) * 1000
  }

  return 0
}

function extractSpotifyTrackId(uriValue: string | undefined, fallbackId: string): string {
  if (!uriValue) return fallbackId

  const uri = uriValue.trim()
  if (!uri) return fallbackId

  const uriMatch = uri.match(/spotify:track:([a-zA-Z0-9]+)/i)
  if (uriMatch?.[1]) {
    return uriMatch[1]
  }

  const urlMatch = uri.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/i)
  if (urlMatch?.[1]) {
    return urlMatch[1]
  }

  if (/^[a-zA-Z0-9]{22}$/.test(uri)) {
    return uri
  }

  return fallbackId
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
