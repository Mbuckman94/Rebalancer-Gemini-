interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class GlobalCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string, ttlSeconds: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const ageSeconds = (Date.now() - entry.timestamp) / 1000;
    if (ageSeconds > ttlSeconds) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const quoteCache = new GlobalCache();
