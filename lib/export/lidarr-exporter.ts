import { LidarrApiClient } from "@/lib/lidarr/client"

export interface LidarrSyncProgress {
  current: number
  total: number
  currentArtist?: string
}

export interface LidarrSyncError {
  artistName: string
  reason: string
}

export interface LidarrSyncResult {
  added: number
  skipped: number
  failed: number
  errors: LidarrSyncError[]
}

export interface LidarrExporterOptions {
  signal?: AbortSignal
  onProgress?: (progress: LidarrSyncProgress) => void | Promise<void>
}

export function createLidarrExporter(client: LidarrApiClient) {
  return new LidarrExporter(client)
}

export class LidarrExporter {
  constructor(private client: LidarrApiClient) {}

  async syncArtists(
    artistNames: Iterable<string>,
    options: LidarrExporterOptions = {}
  ): Promise<LidarrSyncResult> {
    const { signal, onProgress } = options
    const names = [...new Set(artistNames)].filter((n) => n.trim().length > 0)
    const result: LidarrSyncResult = { added: 0, skipped: 0, failed: 0, errors: [] }

    if (names.length === 0) {
      return result
    }

    const checkAbort = () => {
      if (signal?.aborted) {
        throw new DOMException("Lidarr sync was cancelled", "AbortError")
      }
    }

    try {
      const existingArtists = await this.client.getExistingArtists()
      const existingNames = new Set(existingArtists.map((a) => a.artistName.toLowerCase()))

      const rootFolders = await this.client.getRootFolders()
      const qualityProfiles = await this.client.getQualityProfiles()
      const metadataProfiles = await this.client.getMetadataProfiles()

      if (rootFolders.length === 0 || qualityProfiles.length === 0 || metadataProfiles.length === 0) {
        return result
      }

      const rootFolder = rootFolders[0].path
      const qualityProfileId = qualityProfiles[0].id
      const metadataProfileId = metadataProfiles[0].id

      let current = 0
      for (const name of names) {
        checkAbort()
        if (existingNames.has(name.toLowerCase())) {
          result.skipped++
          current++
          if (onProgress) {
            await onProgress({ current, total: names.length, currentArtist: name })
          }
          continue
        }

        try {
          const results = await this.client.lookupArtist(name, signal)
          if (results.length > 0) {
            await this.client.addArtist(
              {
                foreignArtistId: results[0].foreignArtistId,
                artistName: results[0].artistName,
                qualityProfileId,
                metadataProfileId,
                rootFolderPath: rootFolder,
                monitored: true,
                addOptions: { searchForMissingAlbums: true },
              },
              signal
            )
            existingNames.add(results[0].artistName.toLowerCase())
            result.added++
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            throw err
          }
          result.failed++
          result.errors.push({
            artistName: name,
            reason: err instanceof Error ? err.message : String(err),
          })
        }

        current++
        if (onProgress) {
          await onProgress({ current, total: names.length, currentArtist: name })
        }
      }

      return result
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw err
      }
      throw err
    }
  }
}
