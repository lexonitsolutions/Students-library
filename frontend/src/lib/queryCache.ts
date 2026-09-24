/**
 * In-memory query and response cache utility.
 * 
 * Features:
 * - Time-To-Live (TTL) expiration per query key.
 * - In-flight Promise deduplication (prevents duplicate simultaneous network calls for the same key).
 * - Key prefix invalidation for optimistic mutations (e.g. invalidating 'materials' on new upload).
 * - Synchronous read/write helpers.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();
const inFlightPromises = new Map<string, Promise<unknown>>();

export const DEFAULT_TTL_MS = 30_000; // 30 seconds

/**
 * Execute a query with caching and in-flight deduplication.
 */
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const now = Date.now();

  // 1. Return fresh cached data if valid
  const cached = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  // 2. Return in-flight promise if an identical query is already pending
  const inFlight = inFlightPromises.get(key) as Promise<T> | undefined;
  if (inFlight) {
    return inFlight;
  }

  // 3. Initiate request with in-flight deduplication
  const promise = (async () => {
    try {
      const data = await fetcher();
      cacheStore.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
      });
      return data;
    } finally {
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, promise);
  return promise;
}

/**
 * Set cache value directly (e.g., after a mutation or optimistic update).
 */
export function setCacheData<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Synchronously read cached data if valid and not expired.
 */
export function getCacheData<T>(key: string): T | null {
  const cached = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  return null;
}

/**
 * Invalidate cache by key or key prefix.
 * If no key is provided, clears the entire cache.
 */
export function invalidateCache(keyOrPrefix?: string): void {
  if (!keyOrPrefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      cacheStore.delete(key);
    }
  }
}
