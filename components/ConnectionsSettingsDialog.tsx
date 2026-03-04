"use client"

import { SpotifyConnectButton } from "@/components/spotify-connect-button"
import { NavidromeCredentialsForm } from "@/components/navidrome-credentials-form"
import { LidarrCredentialsForm } from "@/components/lidarr-credentials-form"

interface ConnectionsSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ConnectionsSettingsDialog({
  isOpen,
  onClose,
}: ConnectionsSettingsDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Connections
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l18 18"
              />
            </svg>
          </button>
        </div>
        <div className="max-h-[calc(90vh-64px)] overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                Spotify
              </h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Connect your Spotify account to access your playlists
            </p>
            <SpotifyConnectButton />
          </div>

          <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
            <NavidromeCredentialsForm allowEditWhenConnected />
          </div>

          <div>
            <LidarrCredentialsForm allowEditWhenConnected />
          </div>
        </div>
      </div>
    </div>
  )
}
