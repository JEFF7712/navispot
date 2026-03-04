export interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  signal?: AbortSignal
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'signal'>> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
}

function isRetryableStatus(status: number): boolean {
  if (status >= 500) return true
  if (status === 429) return true
  return false
}

function parseStatusFromMessage(message: string): number | null {
  const match = message.match(/(?:HTTP error: |: )(\d{3})/i) ?? message.match(/\b(4\d{2}|5\d{2})\b/)
  return match ? parseInt(match[1], 10) : null
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return false
  const message = err instanceof Error ? err.message : String(err)
  const status = parseStatusFromMessage(message)
  if (status !== null) return isRetryableStatus(status)
  if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
    return true
  }
  return false
}

/**
 * Retries an async function with exponential backoff on transient errors.
 * - Retries on 5xx and 429 status codes
 * - Retries on network errors
 * - Does NOT retry on 4xx (except 429)
 * - Respects AbortError and rethrows immediately
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs, signal } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (signal?.aborted) {
        throw new DOMException('Operation was aborted', 'AbortError')
      }
      return await fn()
    } catch (err) {
      lastError = err
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
      const isLastAttempt = attempt === maxAttempts
      const status = (err as { response?: Response })?.response?.status
      const retryable = status !== undefined ? isRetryableStatus(status) : isRetryableError(err)
      if (isLastAttempt || !retryable) {
        throw err
      }
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs)
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, delay)
        signal?.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject(new DOMException('Operation was aborted', 'AbortError'))
        })
      })
    }
  }
  throw lastError
}
