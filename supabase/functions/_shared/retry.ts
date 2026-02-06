/**
 * Shared retry utility for edge functions
 * Provides exponential backoff with jitter for HTTP requests and async operations
 */

/**
 * Custom error class for explicitly retryable errors
 */
export class RetryableError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'RetryableError';
  }
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
}

export interface FetchRetryResult {
  response: Response;
  attempts: number;
  totalDelayMs: number;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalDelayMs: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  timeoutMs: 30000,
};

/**
 * Calculate delay with exponential backoff and jitter
 * Formula: min(maxDelay, baseDelay * 2^attempt * (0.5 + random * 0.5))
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = 0.5 + Math.random() * 0.5; // Random between 0.5 and 1
  const delay = Math.min(config.maxDelayMs, exponentialDelay * jitter);
  return Math.floor(delay);
}

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an HTTP status code should trigger a retry
 */
function isRetryableStatusCode(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * Check if an error is retryable (transient errors)
 */
export function isRetryableError(error: unknown): boolean {
  // Check for explicit RetryableError
  if (error instanceof RetryableError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network/connection errors
    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('enotfound') ||
      message.includes('etimedout') ||
      message.includes('socket')
    ) {
      return true;
    }
    
    // Timeout errors
    if (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('aborted')
    ) {
      return true;
    }
    
    // Rate limit errors
    if (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429')
    ) {
      return true;
    }
    
    // Postgres transient errors
    if (
      message.includes('pgrst504') ||
      message.includes('connection terminated') ||
      message.includes('could not connect')
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Fetch with automatic retry on transient failures
 * Implements exponential backoff with jitter and request timeout
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<FetchRetryResult> {
  const finalConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;
  let totalDelayMs = 0;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeoutMs);

    try {
      console.log(`[retry] Attempt ${attempt}/${finalConfig.maxAttempts} for ${url}`);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if we should retry based on status code
      if (isRetryableStatusCode(response.status)) {
        const errorText = await response.text();
        lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        
        if (attempt < finalConfig.maxAttempts) {
          let delayMs = calculateDelay(attempt, finalConfig);
          // Learn from rate limit: use longer backoff on 429 so next sync improves
          if (response.status === 429) {
            delayMs = Math.min(finalConfig.maxDelayMs, delayMs * 2);
            console.log(`[retry] Rate limit (429) - using extended backoff: ${delayMs}ms`);
          }
          totalDelayMs += delayMs;
          console.log(
            `[retry] HTTP ${response.status} received, retrying in ${delayMs}ms ` +
            `(attempt ${attempt}/${finalConfig.maxAttempts}, total delay: ${totalDelayMs}ms)`
          );
          await delay(delayMs);
          continue;
        }
        
        // Return the response anyway on final attempt (let caller decide)
        console.log(`[retry] Final attempt returned HTTP ${response.status}`);
        return { response, attempts: attempt, totalDelayMs };
      }

      // Success
      if (attempt > 1) {
        console.log(
          `[retry] Success on attempt ${attempt} after ${totalDelayMs}ms total delay`
        );
      }
      return { response, attempts: attempt, totalDelayMs };

    } catch (error) {
      clearTimeout(timeoutId);
      
      const isAborted = error instanceof Error && error.name === 'AbortError';
      lastError = isAborted 
        ? new Error(`Request timeout after ${finalConfig.timeoutMs}ms`)
        : (error instanceof Error ? error : new Error(String(error)));

      const shouldRetry = isAborted || isRetryableError(error);

      if (shouldRetry && attempt < finalConfig.maxAttempts) {
        const delayMs = calculateDelay(attempt, finalConfig);
        totalDelayMs += delayMs;
        console.log(
          `[retry] ${isAborted ? 'Timeout' : 'Error'}: ${lastError.message}, ` +
          `retrying in ${delayMs}ms (attempt ${attempt}/${finalConfig.maxAttempts}, ` +
          `total delay: ${totalDelayMs}ms)`
        );
        await delay(delayMs);
        continue;
      }

      if (!shouldRetry) {
        console.log(`[retry] Non-retryable error on attempt ${attempt}: ${lastError.message}`);
        throw lastError;
      }
    }
  }

  console.log(
    `[retry] All ${finalConfig.maxAttempts} attempts failed after ${totalDelayMs}ms total delay`
  );
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Generic retry wrapper for any async function
 * Useful for database operations and other async tasks
 */
export async function withRetry<T>(
  asyncFn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  operationName = 'operation'
): Promise<RetryResult<T>> {
  const finalConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;
  let totalDelayMs = 0;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      console.log(`[retry] ${operationName}: Attempt ${attempt}/${finalConfig.maxAttempts}`);
      
      // Create a timeout promise for the operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`${operationName} timeout after ${finalConfig.timeoutMs}ms`)),
          finalConfig.timeoutMs
        );
      });

      const result = await Promise.race([asyncFn(), timeoutPromise]);
      
      if (attempt > 1) {
        console.log(
          `[retry] ${operationName}: Success on attempt ${attempt} after ${totalDelayMs}ms total delay`
        );
      }
      
      return { result, attempts: attempt, totalDelayMs };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (isRetryableError(error) && attempt < finalConfig.maxAttempts) {
        const delayMs = calculateDelay(attempt, finalConfig);
        totalDelayMs += delayMs;
        console.log(
          `[retry] ${operationName}: Error "${lastError.message}", ` +
          `retrying in ${delayMs}ms (attempt ${attempt}/${finalConfig.maxAttempts}, ` +
          `total delay: ${totalDelayMs}ms)`
        );
        await delay(delayMs);
        continue;
      }

      if (!isRetryableError(error)) {
        console.log(
          `[retry] ${operationName}: Non-retryable error on attempt ${attempt}: ${lastError.message}`
        );
        throw lastError;
      }
    }
  }

  console.log(
    `[retry] ${operationName}: All ${finalConfig.maxAttempts} attempts failed ` +
    `after ${totalDelayMs}ms total delay`
  );
  throw lastError || new Error(`All retry attempts failed for ${operationName}`);
}

/**
 * Helper to check if a Supabase error is retryable
 */
export function isRetryableSupabaseError(error: { message?: string; code?: string }): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code || '';
  
  return (
    code === 'PGRST504' ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('could not connect') ||
    message.includes('connection terminated')
  );
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  requestsPerWindow: number;
  windowMs: number;
}

const DEFAULT_RATE_LIMIT_CONFIG: RateLimiterConfig = {
  requestsPerWindow: 100,
  windowMs: 60000, // 1 minute
};

/**
 * Request-scoped rate limiter to prevent API throttling
 * Create a new instance per request to avoid race conditions
 */
export class RateLimiter {
  private requestCount = 0;
  private windowStart: number;
  private readonly config: RateLimiterConfig;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
    this.windowStart = Date.now();
  }

  /**
   * Acquire permission to make a request
   * Waits if rate limit would be exceeded
   * Returns the wait time in ms (0 if no wait was needed)
   */
  async acquire(): Promise<number> {
    const now = Date.now();
    const elapsed = now - this.windowStart;

    // Reset window if expired
    if (elapsed >= this.config.windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    // Check if we're at the limit
    if (this.requestCount >= this.config.requestsPerWindow) {
      const waitTime = this.config.windowMs - elapsed;
      if (waitTime > 0) {
        console.log(
          `[rate-limit] Rate limit reached (${this.requestCount}/${this.config.requestsPerWindow}), ` +
          `waiting ${waitTime}ms for window reset`
        );
        await delay(waitTime);
        this.requestCount = 0;
        this.windowStart = Date.now();
        return waitTime;
      }
    }

    this.requestCount++;
    return 0;
  }

  /**
   * Get current rate limit status
   */
  getStatus(): { count: number; remaining: number; windowMs: number; resetIn: number } {
    const elapsed = Date.now() - this.windowStart;
    return {
      count: this.requestCount,
      remaining: Math.max(0, this.config.requestsPerWindow - this.requestCount),
      windowMs: this.config.windowMs,
      resetIn: Math.max(0, this.config.windowMs - elapsed),
    };
  }
}

/**
 * Fetch with rate limiting and automatic retry
 * Combines rate limiting with exponential backoff retry logic
 */
export async function rateLimitedFetchWithRetry(
  url: string,
  options: RequestInit = {},
  rateLimiter: RateLimiter,
  retryConfig: Partial<RetryConfig> = {}
): Promise<FetchRetryResult & { rateLimitWaitMs: number }> {
  // Acquire rate limit slot before making request
  const rateLimitWaitMs = await rateLimiter.acquire();
  
  // Use standard retry logic
  const result = await fetchWithRetry(url, options, retryConfig);
  
  return { ...result, rateLimitWaitMs };
}
