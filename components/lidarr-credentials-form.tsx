"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth/auth-context"

interface LidarrCredentialsFormProps {
  allowEditWhenConnected?: boolean
}

export function LidarrCredentialsForm({
  allowEditWhenConnected = false,
}: LidarrCredentialsFormProps) {
  const { lidarr, setLidarrCredentials, clearLidarrCredentials, isLoading } =
    useAuth()
  const [formData, setFormData] = useState({ url: "", apiKey: "" })
  const [errors, setErrors] = useState<{ url?: string; apiKey?: string }>({})
  const [isConnecting, setIsConnecting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (lidarr.credentials) {
      setFormData({
        url: lidarr.credentials.url,
        apiKey: lidarr.credentials.apiKey,
      })
    }
  }, [lidarr.credentials])

  const validateForm = useCallback((): boolean => {
    const newErrors: { url?: string; apiKey?: string } = {}

    if (!formData.url.trim()) {
      newErrors.url = "URL is required"
    } else {
      try {
        new URL(formData.url)
      } catch {
        newErrors.url = "Invalid URL format"
      }
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = "API Key is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!validateForm()) return

    setIsConnecting(true)
    try {
      const success = await setLidarrCredentials(formData)
      if (success) {
        setIsEditing(false)
      } else {
        setLocalError(lidarr.error || "Connection failed")
      }
    } catch {
      setLocalError("An unexpected error occurred")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setFormData({ url: "", apiKey: "" })
    setErrors({})
    setLocalError(null)
    setIsEditing(false)
    clearLidarrCredentials()
  }

  const handleCancelEdit = () => {
    if (lidarr.credentials) {
      setFormData({
        url: lidarr.credentials.url,
        apiKey: lidarr.credentials.apiKey,
      })
    }
    setErrors({})
    setLocalError(null)
    setIsEditing(false)
  }

  const inputsDisabled =
    (lidarr.isConnected && !allowEditWhenConnected) ||
    (lidarr.isConnected && allowEditWhenConnected && !isEditing) ||
    isConnecting

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-3">
          <div className="h-10 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 w-full animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Lidarr
        </h2>
        {lidarr.isConnected ? (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-sm text-orange-600 dark:text-orange-400">
              Connected{lidarr.version && ` (v${lidarr.version})`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-zinc-400" />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Not connected
            </span>
          </div>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Optional — connect Lidarr to automatically download artists from your playlists. Credentials are kept in memory only and are cleared on refresh.
      </p>

      {lidarr.error && !localError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {lidarr.error}
        </div>
      )}

      {localError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {localError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="lidarr-url"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Server URL
          </label>
          <input
            id="lidarr-url"
            type="url"
            value={formData.url}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, url: e.target.value }))
            }
            placeholder="https://lidarr.example.com"
            disabled={inputsDisabled}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-500 dark:focus:ring-orange-500"
          />
          {errors.url && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.url}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="lidarr-apikey"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            API Key
          </label>
          <input
            id="lidarr-apikey"
            type="password"
            value={formData.apiKey}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
            }
            placeholder="Your Lidarr API key"
            disabled={inputsDisabled}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-orange-500 dark:focus:ring-orange-500"
          />
          {errors.apiKey && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.apiKey}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          {lidarr.isConnected ? (
            allowEditWhenConnected && isEditing ? (
              <>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="flex-1 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-50 hover:cursor-pointer"
                >
                  {isConnecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isConnecting}
                  className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {allowEditWhenConnected && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    disabled={isConnecting}
                    className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isConnecting}
                  className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Disconnect
                </button>
              </>
            )
          ) : (
            <button
              type="submit"
              disabled={isConnecting}
              className="flex-1 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-50 hover:cursor-pointer"
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Connecting...
                </span>
              ) : (
                "Connect"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
