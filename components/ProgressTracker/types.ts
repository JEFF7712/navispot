export type ProgressPhase = 'idle' | 'matching' | 'exporting' | 'lidarr' | 'completed' | 'cancelled' | 'error';

export interface CurrentTrackInfo {
  name: string;
  artist: string;
  index?: number;
  total?: number;
}

export interface ProgressState {
  phase: ProgressPhase;
  currentTrack?: CurrentTrackInfo;
  progress: {
    current: number;
    total: number;
    percent: number;
  };
  statistics: {
    matched: number;
    unmatched: number;
    exported: number;
    failed: number;
  };
  error?: string;
}

export interface ProgressTrackerProps {
  state: ProgressState;
  onCancel?: () => void;
  onComplete?: () => void;
}
