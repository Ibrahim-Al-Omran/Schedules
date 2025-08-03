// Enhanced caching and performance utilities
const API_CACHE = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh
}

export async function cachedFetch<T>(
  url: string, 
  options: RequestInit & CacheOptions = {}
): Promise<T> {
  const { ttl = 30000, key, staleWhileRevalidate = true, ...fetchOptions } = options;
  const cacheKey = key || `${url}-${JSON.stringify(fetchOptions)}`;
  const now = Date.now();
  
  // Check cache
  const cached = API_CACHE.get(cacheKey);
  
  if (cached) {
    const isStale = now - cached.timestamp > cached.ttl;
    
    if (!isStale) {
      // Return fresh cached data
      return cached.data as T;
    }
    
    if (staleWhileRevalidate) {
      // Return stale data and update in background
      fetchAndCache(url, fetchOptions, cacheKey, ttl).catch(console.error);
      return cached.data as T;
    }
  }
  
  // Fetch fresh data
  return await fetchAndCache(url, fetchOptions, cacheKey, ttl);
}

async function fetchAndCache<T>(
  url: string, 
  options: RequestInit, 
  cacheKey: string, 
  ttl: number
): Promise<T> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json() as T;
  
  // Cache the result
  API_CACHE.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });
  
  return data;
}

// Preload critical data
export function preloadCriticalData() {
  if (typeof window === 'undefined') return;
  
  // Preload auth status
  cachedFetch('/api/auth/me', { 
    ttl: 60000,
    key: 'auth-status'
  }).catch(() => {
    // Ignore errors for preloading
  });
}

// Clear cache when needed
export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of API_CACHE.keys()) {
      if (key.includes(pattern)) {
        API_CACHE.delete(key);
      }
    }
  } else {
    API_CACHE.clear();
  }
}

// Warm up critical endpoints on app load
export function warmupCriticalEndpoints() {
  if (typeof window === 'undefined') return;
  
  // Use edge endpoint for instant warmup
  fetch('/api/health-edge', { 
    method: 'GET',
    headers: { 'User-Agent': 'Client-Warmup' }
  }).catch(() => {
    // Fallback to regular health check if edge fails
    fetch('/api/health').catch(() => {
      console.log('Health check failed - cold start expected');
    });
  });
}
