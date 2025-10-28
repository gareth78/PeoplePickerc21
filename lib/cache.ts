export const runtime = 'nodejs';

const DEFAULT_TTL_SECONDS = 600;
const DEFAULT_TYPE = 'memory';

type CacheManagerOptions = {
  type: string;
  ttlSeconds: number;
};

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

export interface CacheStats {
  type: string;
  ttlSeconds: number;
  entries: number;
  hitRate: number;
}

const ttlEnvValue =
  process.env['cache-ttl-seconds'] ?? process.env['CACHE_TTL_SECONDS'];
const cacheTtlSeconds = Number(ttlEnvValue);
const resolvedTtlSeconds = Number.isFinite(cacheTtlSeconds) && cacheTtlSeconds > 0
  ? Math.floor(cacheTtlSeconds)
  : DEFAULT_TTL_SECONDS;

const cacheTypeEnv = process.env['cache-type'] ?? process.env['CACHE_TYPE'];
const resolvedCacheType = typeof cacheTypeEnv === 'string' && cacheTypeEnv.length > 0
  ? cacheTypeEnv
  : DEFAULT_TYPE;

// DEBUG: Log what env vars are actually being read
console.log('🔍 CACHE ENV DEBUG:', {
  'cache-ttl-seconds (kebab)': process.env['cache-ttl-seconds'],
  'CACHE_TTL_SECONDS (upper)': process.env.CACHE_TTL_SECONDS,
  'cache-type (kebab)': process.env['cache-type'],
  'CACHE_TYPE (upper)': process.env.CACHE_TYPE,
  'Computed CACHE_TTL_SECONDS': resolvedTtlSeconds,
  'Computed CACHE_TYPE': resolvedCacheType,
});

export class CacheManager {
  private readonly options: CacheManagerOptions;
  private store: Map<string, CacheEntry> = new Map();
  private hits = 0;
  private misses = 0;

  constructor(options?: Partial<CacheManagerOptions>) {
    this.options = {
      type: options?.type ?? resolvedCacheType,
      ttlSeconds: options?.ttlSeconds ?? resolvedTtlSeconds,
    };
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const ttl =
      typeof ttlSeconds === 'number' && ttlSeconds > 0
        ? Math.floor(ttlSeconds)
        : this.options.ttlSeconds;

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  async stats(): Promise<CacheStats> {
    const totalRequests = this.hits + this.misses;
    return {
      type: this.options.type,
      ttlSeconds: this.options.ttlSeconds,
      entries: this.store.size,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
    };
  }

  get defaultTtlSeconds(): number {
    return this.options.ttlSeconds;
  }

  get cacheType(): string {
    return this.options.type;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __CACHE_SINGLETON__: CacheManager | undefined;
}

const globalForCache = globalThis as typeof globalThis & {
  __CACHE_SINGLETON__?: CacheManager;
};

if (!globalForCache.__CACHE_SINGLETON__) {
  globalForCache.__CACHE_SINGLETON__ = new CacheManager();
}

export const cache = globalForCache.__CACHE_SINGLETON__;
