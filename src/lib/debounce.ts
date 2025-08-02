// Utility for debouncing API requests to prevent spam
const requestCache = new Map<string, { timestamp: number; promise: Promise<unknown> }>();

export function debounceRequest<T>(
  key: string, 
  requestFn: () => Promise<T>, 
  delay: number = 300
): Promise<T> {
  const now = Date.now();
  const cached = requestCache.get(key);
  
  // If we have a recent request for the same key, return the existing promise
  if (cached && (now - cached.timestamp) < delay) {
    return cached.promise as Promise<T>;
  }
  
  // Create new request
  const promise = requestFn().finally(() => {
    // Clean up cache after completion
    setTimeout(() => {
      requestCache.delete(key);
    }, delay);
  });
  
  // Cache the request
  requestCache.set(key, { timestamp: now, promise });
  
  return promise;
}

export function clearRequestCache() {
  requestCache.clear();
}
