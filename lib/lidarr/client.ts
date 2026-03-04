export interface LidarrCredentials {
  url: string
  apiKey: string
}

export interface LidarrArtistLookup {
  foreignArtistId: string
  artistName: string
  overview: string
  images: { url: string; coverType: string }[]
  monitored: boolean
}

export interface LidarrArtist {
  id: number
  foreignArtistId: string
  artistName: string
  monitored: boolean
  qualityProfileId: number
  metadataProfileId: number
  rootFolderPath: string
}

export interface LidarrRootFolder {
  id: number
  path: string
}

export interface LidarrQualityProfile {
  id: number
  name: string
}

export interface LidarrMetadataProfile {
  id: number
  name: string
}

export class LidarrApiClient {
  private baseUrl: string
  private apiKey: string

  constructor(url: string, apiKey: string) {
    this.baseUrl = url.replace(/\/+$/, "")
    this.apiKey = apiKey
  }

  async ping(): Promise<{ success: boolean; version?: string; error?: string }> {
    try {
      const res = await this._fetch("/api/v1/system/status")
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` }
      }
      const data = await res.json()
      return { success: true, version: data.version }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Connection failed",
      }
    }
  }

  async getRootFolders(): Promise<LidarrRootFolder[]> {
    const res = await this._fetch("/api/v1/rootfolder")
    if (!res.ok) throw new Error(`Failed to get root folders: ${res.status}`)
    return res.json()
  }

  async getQualityProfiles(): Promise<LidarrQualityProfile[]> {
    const res = await this._fetch("/api/v1/qualityprofile")
    if (!res.ok) throw new Error(`Failed to get quality profiles: ${res.status}`)
    return res.json()
  }

  async getMetadataProfiles(): Promise<LidarrMetadataProfile[]> {
    const res = await this._fetch("/api/v1/metadataprofile")
    if (!res.ok) throw new Error(`Failed to get metadata profiles: ${res.status}`)
    return res.json()
  }

  async getExistingArtists(): Promise<LidarrArtist[]> {
    const res = await this._fetch("/api/v1/artist")
    if (!res.ok) throw new Error(`Failed to get artists: ${res.status}`)
    return res.json()
  }

  async lookupArtist(term: string): Promise<LidarrArtistLookup[]> {
    const params = new URLSearchParams({ term })
    const res = await this._fetch(`/api/v1/artist/lookup?${params}`)
    if (!res.ok) throw new Error(`Artist lookup failed: ${res.status}`)
    return res.json()
  }

  async addArtist(artist: {
    foreignArtistId: string
    artistName: string
    qualityProfileId: number
    metadataProfileId: number
    rootFolderPath: string
    monitored: boolean
    addOptions: { searchForMissingAlbums: boolean }
  }): Promise<LidarrArtist> {
    const res = await this._fetch("/api/v1/artist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(artist),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Failed to add artist: ${res.status} - ${text}`)
    }
    return res.json()
  }

  private async _fetch(endpoint: string, options?: RequestInit): Promise<Response> {
    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "X-Api-Key": this.apiKey,
        ...options?.headers,
      },
    })
  }
}
