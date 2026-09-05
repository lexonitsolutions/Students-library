/**
 * Backend proxy handler for /api/colleges/search?q=<searchTerm>
 * 
 * Communicates with the institutions-api service with:
 * - Live institutions-api server support (via INSTITUTIONS_API_URL)
 * - Online institutions-api dataset fallback (streamed and cached in memory on backend only)
 * - Query-level LRU caching
 * - Fast normalization and deduplication
 */

// In-memory query-level LRU cache
class QueryCache {
  constructor(maxSize = 100, ttlMs = 1000 * 60 * 30) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.data;
  }

  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}

const searchCache = new QueryCache(100, 1000 * 60 * 30);

// Lazy in-memory dataset cache for fallback when standalone institutions-api microservice isn't running locally
let cachedInstitutionsList = null;
let isFetchingDataset = false;

function cleanNameAndId(rawName) {
  if (!rawName) return null;
  const match = rawName.match(/^(.*?)(?:\s*\((?:Id:\s*)?([A-Z0-9_-]+)\))?$/i);
  if (match) {
    const name = match[1].trim();
    const id = match[2] ? match[2].trim() : undefined;
    return { name, id };
  }
  return { name: rawName.trim() };
}

/**
 * 1. Attempt to query live institutions-api microservice (if running)
 */
async function fetchFromInstitutionsApiServer(query, limit = 10) {
  const baseUrl = process.env.INSTITUTIONS_API_URL || 'http://localhost:5000';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const url = `${baseUrl.replace(/\/$/, '')}/institutions?name=${encodeURIComponent(query)}&count=${limit}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item, idx) => {
        if (typeof item === 'string') {
          const parsed = cleanNameAndId(item);
          return {
            name: parsed?.name || item,
            id: parsed?.id || `inst-${idx}`,
          };
        }
        return {
          name: item.name || item.institution || String(item),
          id: item.id || `inst-${idx}`,
        };
      });
    }
  } catch {
    clearTimeout(timeoutId);
  }
  return null;
}

/**
 * 2. Fallback: query online institutions-api dataset directly
 */
async function getInstitutionsDataset() {
  if (cachedInstitutionsList) return cachedInstitutionsList;
  if (isFetchingDataset) {
    // Wait briefly for current fetch
    await new Promise((r) => setTimeout(r, 800));
    if (cachedInstitutionsList) return cachedInstitutionsList;
  }

  isFetchingDataset = true;
  try {
    const [collegesRes, universitiesRes, worldRes] = await Promise.all([
      fetch('https://raw.githubusercontent.com/MustansirZia/institutions-api/master/data/json/indian_colleges.json').catch(() => null),
      fetch('https://raw.githubusercontent.com/MustansirZia/institutions-api/master/data/json/indian_universities.json').catch(() => null),
      fetch('https://raw.githubusercontent.com/MustansirZia/institutions-api/master/data/json/world_universities_and_domains.json').catch(() => null),
    ]);

    const items = [];

    if (universitiesRes && universitiesRes.ok) {
      const uData = await universitiesRes.json();
      if (Array.isArray(uData)) {
        for (const u of uData) {
          const raw = u['University Name'];
          if (raw) {
            const parsed = cleanNameAndId(raw);
            if (parsed) items.push({ name: parsed.name, id: parsed.id || `u-${items.length}`, state: u['State Name'] });
          }
        }
      }
    }

    if (collegesRes && collegesRes.ok) {
      const cData = await collegesRes.json();
      if (Array.isArray(cData)) {
        for (const c of cData) {
          const raw = c['College Name'];
          if (raw) {
            const parsed = cleanNameAndId(raw);
            if (parsed) items.push({ name: parsed.name, id: parsed.id || `c-${items.length}`, state: c['State Name'] });
          }
        }
      }
    }

    if (worldRes && worldRes.ok) {
      const wData = await worldRes.json();
      if (Array.isArray(wData)) {
        for (const w of wData) {
          if (w.name) {
            items.push({ name: w.name, id: `w-${items.length}`, country: w.country });
          }
        }
      }
    }

    if (items.length > 0) {
      cachedInstitutionsList = items;
    }
  } catch (err) {
    console.warn('Could not initialize institutions dataset fallback:', err);
  } finally {
    isFetchingDataset = false;
  }

  return cachedInstitutionsList || [];
}

/**
 * Search colleges
 */
export async function searchColleges(query, limit = 10) {
  const trimmed = (query || '').trim();
  if (trimmed.length < 2) {
    return [];
  }

  const cacheKey = `${trimmed.toLowerCase()}_${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 1. Try institutions-api microservice endpoint
  const liveResults = await fetchFromInstitutionsApiServer(trimmed, limit);
  if (liveResults && liveResults.length > 0) {
    searchCache.set(cacheKey, liveResults);
    return liveResults;
  }

  // 2. Fallback: Search the online institutions-api dataset in backend memory
  const dataset = await getInstitutionsDataset();
  const qLower = trimmed.toLowerCase();

  const prefixMatches = [];
  const substringMatches = [];
  const seen = new Set();

  for (const item of dataset) {
    const nameLower = item.name.toLowerCase();
    if (nameLower.startsWith(qLower)) {
      if (!seen.has(nameLower)) {
        seen.add(nameLower);
        prefixMatches.push(item);
      }
    } else if (nameLower.includes(qLower)) {
      if (!seen.has(nameLower)) {
        seen.add(nameLower);
        substringMatches.push(item);
      }
    }
    if (prefixMatches.length >= limit) break;
  }

  const combined = [...prefixMatches, ...substringMatches].slice(0, limit);
  searchCache.set(cacheKey, combined);
  return combined;
}

/**
 * Connect/Express middleware handler for /api/colleges/search
 */
export async function handleCollegesSearchRequest(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const q = url.searchParams.get('q') || url.searchParams.get('name') || '';
    const limit = Math.min(15, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)));

    if (q.trim().length < 2) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ colleges: [] }));
      return;
    }

    const colleges = await searchColleges(q, limit);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.end(JSON.stringify({ colleges }));
  } catch (err) {
    console.error('Error handling college search:', err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ colleges: [], error: 'Failed to fetch colleges' }));
  }
}
