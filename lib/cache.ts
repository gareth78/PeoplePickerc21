// Memory cache for single-instance development
// For production with multiple instances, implement RedisCache and set cache-type=redis

import type { CacheInterface, CacheStats } from './types';

const CACHE_TYPE = process.env['cache-type'] || 'memory';
const CACHE_TTL_SECONDS = Number(process.env['cache-ttl-seconds'] || 600);

// DEBUG: Log what env vars are actually being read
console.log('🔍 CACHE ENV DEBUG:', {
  'cache-ttl-seconds (kebab)': process.env['cache-ttl-seconds'],
  'CACHE_TTL_SECONDS (upper)': process.env.CACHE_TTL_SECONDS,
  'cache-type (kebab)': process.env['cache-type'],
  'CACHE_TYPE (upper)': process.env.CACHE_TYPE,
  'Computed CACHE_TTL_SECONDS': CACHE_TTL_SECONDS,
  'Computed CACHE_TYPE': CACHE_TYPE,
});

interface CacheEntry {
  value: unknown;
  expires: number;
}

class MemoryCache implements CacheInterface {
  private store: Map<string, CacheEntry> = new Map();
  private hits = 0;
  private misses = 0;

  async get(key: string): Promise<unknown | null> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.value;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  async stats(): Promise<CacheStats> {
    const total = this.hits + this.misses;
    return {
      type: 'memory',
      ttl: CACHE_TTL_SECONDS,
      entries: this.store.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}

class RedisCache implements CacheInterface {
  async get(): Promise<unknown | null> {
    throw new Error('Redis cache not yet implemented - set cache-type=memory');
  }

  async set(): Promise<void> {
    throw new Error('Redis cache not yet implemented - set cache-type=memory');
  }

  async clear(): Promise<void> {
    throw new Error('Redis cache not yet implemented - set cache-type=memory');
  }

  async stats(): Promise<CacheStats> {
    throw new Error('Redis cache not yet implemented - set cache-type=memory');
  }
}

function createCache(): CacheInterface {
  const cacheType = CACHE_TYPE;
  if (cacheType === 'redis') {
    return new RedisCache();
  }
  return new MemoryCache();
}

// Create true singleton anchored to globalThis
const globalForCache = globalThis as unknown as {
  __peoplePickerCache?: CacheInterface;
};

if (!globalForCache.__peoplePickerCache) {
  globalForCache.__peoplePickerCache = createCache();
}

export const cache = globalForCache.__peoplePickerCache;
