import { SpotifyToken, SpotifyUser } from './spotify-auth';
import { NavidromeCredentials } from './navidrome';
import { LidarrCredentials } from '@/lib/lidarr/client';

export interface SpotifyAuthState {
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  token: SpotifyToken | null;
}

export interface NavidromeAuthState {
  isConnected: boolean;
  credentials: NavidromeCredentials | null;
  serverVersion: string | null;
  error: string | null;
  token: string | null;
  clientId: string | null;
}

export interface LidarrAuthState {
  isConnected: boolean;
  credentials: LidarrCredentials | null;
  version: string | null;
  error: string | null;
}

export interface AuthContextType {
  spotify: SpotifyAuthState;
  navidrome: NavidromeAuthState;
  lidarr: LidarrAuthState;
  spotifyLogin: () => Promise<void>;
  spotifyLogout: () => Promise<void>;
  refreshSpotifyToken: () => Promise<boolean>;
  setNavidromeCredentials: (credentials: NavidromeCredentials) => Promise<boolean>;
  testNavidromeConnection: (credentials: NavidromeCredentials) => Promise<boolean>;
  clearNavidromeCredentials: () => void;
  setLidarrCredentials: (credentials: LidarrCredentials) => Promise<boolean>;
  clearLidarrCredentials: () => void;
  isLoading: boolean;
}
