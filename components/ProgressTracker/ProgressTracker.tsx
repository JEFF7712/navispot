'use client';

import { useEffect } from 'react';
import { ProgressTrackerProps, ProgressPhase } from './types';

export type { ProgressTrackerProps, ProgressPhase, ProgressState, CurrentTrackInfo } from './types';

const PHASE_LABELS: Record<ProgressPhase, string> = {
  idle: 'Ready',
  matching: 'Matching tracks',
  exporting: 'Exporting to Navidrome',
  lidarr: 'Syncing to Lidarr',
  completed: 'Export complete',
  cancelled: 'Export cancelled',
  error: 'Export failed',
};

export function ProgressTracker({ state, onCancel, onComplete }: ProgressTrackerProps) {
  const { phase, currentTrack, progress, statistics, error } = state;
  const isActive = phase === 'matching' || phase === 'exporting' || phase === 'lidarr';
  const isComplete = phase === 'completed' || phase === 'cancelled' || phase === 'error';

  useEffect(() => {
    if (phase === 'completed' && onComplete) {
      onComplete();
    }
  }, [phase, onComplete]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Export Progress
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              phase === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              phase === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
              phase === 'cancelled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {PHASE_LABELS[phase]}
            </span>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">
                {isActive ? 'Processing...' : isComplete ? 'Final result' : 'Preparing...'}
              </span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {progress.percent}%
              </span>
            </div>
            <div className="relative h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-300 ease-out rounded-full ${
                  phase === 'error' ? 'bg-red-500' :
                  phase === 'cancelled' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(progress.percent, 100)}%` }}
              />
              {isActive && (
                <div className="absolute inset-y-0 left-0 animate-progress-stripes w-full h-full opacity-30" />
              )}
            </div>
          </div>

          {currentTrack && (isActive || isComplete) && (
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-zinc-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {currentTrack.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
              {currentTrack.index !== undefined && currentTrack.total !== undefined && (
                <div className="flex-shrink-0 text-xs text-zinc-400">
                  {currentTrack.index + 1}/{currentTrack.total}
                </div>
              )}
            </div>
          )}

          {phase === 'error' && error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatNumber(statistics.matched)}
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">Matched</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatNumber(statistics.unmatched)}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Unmatched</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(statistics.exported)}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Exported</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatNumber(statistics.failed)}
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">Failed</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {progress.current} of {progress.total} tracks processed
            </div>
            {isActive && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors"
              >
                Cancel Export
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes progress-stripes {
          0% { background-position: 0 0; }
          100% { background-position: 16px 0; }
        }
        .animate-progress-stripes {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.15) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.15) 75%,
            transparent 75%,
            transparent
          );
          background-size: 16px 16px;
          animation: progress-stripes 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default ProgressTracker;
