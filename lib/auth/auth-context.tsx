'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthContextType, SpotifyAuthState, NavidromeAuthState, LidarrAuthState } from '@/types/auth-context';
import { SpotifyToken, SpotifyUser } from '@/types/spotify-auth';
import { NavidromeCredentials } from '@/types/navidrome';
import { NavidromeApiClient } from '@/lib/navidrome/client';
import { LidarrApiClient, LidarrCredentials } from '@/lib/lidarr/client';
import { spotifyClient } from '@/lib/spotify/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [spotify, setSpotify] = useState<SpotifyAuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  const [navidrome, setNavidrome] = useState<NavidromeAuthState>({
    isConnected: false,
    credentials: null,
    serverVersion: null,
    error: null,
    token: null,
    clientId: null,
  });
  const [lidarr, setLidarr] = useState<LidarrAuthState>({
    isConnected: false,
    credentials: null,
    version: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const testNavidromeConnection = useCallback(async (credentials: NavidromeCredentials): Promise<boolean> => {
    if (!credentials) {
      setNavidrome((prev) => ({
        ...prev,
        isConnected: false,
        serverVersion: null,
        error: 'No credentials set',
        token: null,
        clientId: null,
      }));
      return false;
    }

    try {
      const client = new NavidromeApiClient(credentials.url, credentials.username, credentials.password);
      await client.ping();

      const token = client.getToken();
      const clientId = client.getClientId();

      if (token && clientId) {
        setNavidrome((prev) => ({
          ...prev,
          isConnected: true,
          credentials,
          serverVersion: 'Navidrome (native API)',
          error: null,
          token,
          clientId,
        }));
        return true;
      }

      setNavidrome((prev) => ({
        ...prev,
        isConnected: false,
        serverVersion: null,
        error: 'Failed to authenticate',
        token: null,
        clientId: null,
      }));
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setNavidrome((prev) => ({
        ...prev,
        isConnected: false,
        serverVersion: null,
        error: errorMessage,
        token: null,
        clientId: null,
      }));
      return false;
    }
  }, []);

  const setNavidromeCredentials = useCallback(async (credentials: NavidromeCredentials): Promise<boolean> => {
    setNavidrome((prev) => ({ ...prev, error: null, credentials }));

    try {
      const client = new NavidromeApiClient(credentials.url, credentials.username, credentials.password);
      const result = await client.login(credentials.username, credentials.password);

      if (!result.success) {
        setNavidrome((prev) => ({
          ...prev,
          isConnected: false,
          error: result.error || 'Login failed',
          token: null,
          clientId: null,
        }));
        return false;
      }

      const token = client.getToken();
      const clientId = client.getClientId();

      setNavidrome((prev) => ({
        ...prev,
        isConnected: true,
        serverVersion: 'Navidrome (native API)',
        error: null,
        token,
        clientId,
      }));

      return true;
    } catch (error) {
      console.error('Error setting Navidrome credentials:', error);
      setNavidrome((prev) => ({
        ...prev,
        isConnected: false,
        error: 'Failed to save credentials',
        token: null,
        clientId: null,
      }));
      return false;
    }
  }, []);

  const clearNavidromeCredentials = useCallback(() => {
    setNavidrome({
      isConnected: false,
      credentials: null,
      serverVersion: null,
      error: null,
      token: null,
      clientId: null,
    });
  }, []);

  const setLidarrCredentials = useCallback(async (credentials: LidarrCredentials): Promise<boolean> => {
    setLidarr((prev) => ({ ...prev, error: null, credentials }));

    try {
      const client = new LidarrApiClient(credentials.url, credentials.apiKey);
      const result = await client.ping();

      if (!result.success) {
        setLidarr((prev) => ({
          ...prev,
          isConnected: false,
          version: null,
          error: result.error || 'Connection failed',
        }));
        return false;
      }

      setLidarr((prev) => ({
        ...prev,
        isConnected: true,
        version: result.version || null,
        error: null,
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setLidarr((prev) => ({
        ...prev,
        isConnected: false,
        version: null,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  const clearLidarrCredentials = useCallback(() => {
    setLidarr({
      isConnected: false,
      credentials: null,
      version: null,
      error: null,
    });
  }, []);

  const refreshSpotifyToken = useCallback(async (): Promise<boolean> => {
    if (!spotify.token) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const updatedToken: SpotifyToken = {
        ...spotify.token,
        accessToken: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        tokenType: data.token_type,
        scope: data.scope,
      };

      setSpotify((prev) => ({ ...prev, token: updatedToken }));
      return true;
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      return false;
    }
  }, [spotify.token]);

  const initializeSpotifySession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data.authenticated && data.token) {
        spotifyClient.setToken(data.token);
        let user: SpotifyUser | null = null;

        try {
          user = await spotifyClient.getCurrentUser();
        } catch (error) {
          console.error('Failed to fetch Spotify user on load:', error);
        }

        setSpotify({
          isAuthenticated: true,
          token: data.token,
          user,
        });
      }
    } catch (error) {
      console.error('Error loading Spotify session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeSpotifySession();
  }, [initializeSpotifySession]);

  useEffect(() => {
    if (spotify.token) {
      spotifyClient.setToken(spotify.token);
    } else {
      spotifyClient.clearToken();
    }
  }, [spotify.token]);

  const spotifyLogin = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/spotify');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error initiating Spotify login:', error);
      throw error;
    }
  }, []);

  const spotifyLogout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/spotify', { method: 'DELETE' });
      if (response.ok) {
        setSpotify({ isAuthenticated: false, user: null, token: null });
      }
    } catch (error) {
      console.error('Error logging out from Spotify:', error);
      setSpotify({ isAuthenticated: false, user: null, token: null });
    }
  }, []);

  const value: AuthContextType = {
    spotify,
    navidrome,
    lidarr,
    spotifyLogin,
    spotifyLogout,
    refreshSpotifyToken,
    setNavidromeCredentials,
    testNavidromeConnection,
    clearNavidromeCredentials,
    setLidarrCredentials,
    clearLidarrCredentials,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
