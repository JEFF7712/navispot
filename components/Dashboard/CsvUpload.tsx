"use client"

import { useCallback, useRef } from "react"
import { parseCsvToTracks, playlistNameFromFilename, CsvPlaylist } from "@/lib/csv/parser"

interface CsvUploadProps {
  onPlaylistsImported: (playlists: CsvPlaylist[]) => void
  disabled?: boolean
}

export function CsvUpload({ onPlaylistsImported, disabled }: CsvUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      const imported: CsvPlaylist[] = []

      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith(".csv")) continue

        try {
          const text = await file.text()
          const tracks = parseCsvToTracks(text)
          if (tracks.length === 0) continue

          imported.push({
            id: `csv-${Date.now()}-${file.name}`,
            name: playlistNameFromFilename(file.name),
            tracks,
          })
        } catch (err) {
          console.error(`Failed to parse ${file.name}:`, err)
        }
      }

      if (imported.length > 0) {
        onPlaylistsImported(imported)
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [onPlaylistsImported],
  )

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Import playlists from Exportify CSV files"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Import CSV
      </button>
    </div>
  )
}
