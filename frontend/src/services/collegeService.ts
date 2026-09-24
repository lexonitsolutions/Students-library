export interface CollegeSuggestion {
  readonly id: string;
  readonly name: string;
  readonly country?: string;
}

// Client-side cache to instantly return results for repeated typing
const clientSearchCache = new Map<string, CollegeSuggestion[]>();
const MAX_CLIENT_CACHE = 50;

/**
 * Searches colleges via our backend proxy endpoint (/api/colleges/search).
 * 
 * - Only searches when query is at least 2 characters.
 * - Supports AbortSignal to cancel pending requests when user continues typing.
 * - Caches results to minimize network requests.
 * - Never throws; returns empty array on failure.
 */
export async function searchColleges(
  query: string,
  signal?: AbortSignal
): Promise<CollegeSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const cacheKey = trimmed.toLowerCase();
  if (clientSearchCache.has(cacheKey)) {
    return clientSearchCache.get(cacheKey)!;
  }

  try {
    const url = `/api/colleges/search?q=${encodeURIComponent(trimmed)}&limit=10`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const list: CollegeSuggestion[] = Array.isArray(data.colleges)
      ? data.colleges.map((c: any, index: number) => ({
          id: c.id || `col-${index}`,
          name: typeof c === 'string' ? c : c.name || '',
          country: c.country,
        })).filter((c: CollegeSuggestion) => Boolean(c.name))
      : [];

    // Limit cache size
    if (clientSearchCache.size >= MAX_CLIENT_CACHE) {
      const oldestKey = clientSearchCache.keys().next().value;
      if (oldestKey) clientSearchCache.delete(oldestKey);
    }
    clientSearchCache.set(cacheKey, list);

    return list;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // Intentionally aborted due to user typing
      return [];
    }
    console.warn('College search API request failed:', err);
    return [];
  }
}
