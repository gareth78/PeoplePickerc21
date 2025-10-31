import Redis from 'ioredis';

// TTL constants (in seconds)
export const TTL = {
  PHOTO: 86400,      // 24 hours
  PROFILE: 14400,    // 4 hours
  SEARCH: 3600,      // 1 hour
  GROUPS: 604800,    // 7 days
  PRESENCE: 300,     // 5 minutes (future use)
} as const;

// Get Redis connection string from env
const getRedisConnectionString = (): string | null => {
  return process.env['redis-connection-string'] ||
         process.env['REDIS_CONNECTION_STRING'] ||
         null;
};

// Create Redis client (singleton)
let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const connectionString = getRedisConnectionString();

  if (!connectionString) {
    console.warn('Redis connection string not found. Caching disabled.');
    return null;
  }

  try {
    redisClient = new Redis(connectionString, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: false,
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
}

// Cache interface
export interface CacheStats {
  connected: boolean;
  keys: number;
  memoryUsed: string;
  hits: number;
  misses: number;
  hitRate: string;
}

// Get cache stats
export async function getCacheStats(): Promise<CacheStats> {
  const client = getRedisClient();

  if (!client) {
    console.log('📊 getCacheStats: No Redis client available');
    return {
      connected: false,
      keys: 0,
      memoryUsed: '0',
      hits: 0,
      misses: 0,
      hitRate: '0%',
    };
  }

  try {
    console.log('📊 getCacheStats: Attempting to get stats...');

    // Check connection status
    const status = client.status;
    console.log('📊 Redis client status:', status);

    if (status !== 'ready' && status !== 'connect') {
      console.log('📊 Redis not ready, status:', status);
      return {
        connected: false,
        keys: 0,
        memoryUsed: '0',
        hits: 0,
        misses: 0,
        hitRate: '0%',
      };
    }

    // Fetch stats and memory info separately
    const statsInfo = await client.info('stats');
    const memoryInfo = await client.info('memory');
    const dbSize = await client.dbsize();

    console.log('📊 Redis MEMORY output:', memoryInfo.substring(0, 500));

    // Parse stats
    const hitsMatch = statsInfo.match(/keyspace_hits:(\d+)/);
    const missesMatch = statsInfo.match(/keyspace_misses:(\d+)/);

    // Parse memory - try multiple formats
    let memoryUsed = '0';

    const memoryHumanMatch = memoryInfo.match(/used_memory_human:([^\r\n]+)/);
    if (memoryHumanMatch) {
      memoryUsed = memoryHumanMatch[1].trim();
    } else {
      const memoryBytesMatch = memoryInfo.match(/used_memory:(\d+)/);
      if (memoryBytesMatch) {
        const bytes = parseInt(memoryBytesMatch[1]);
        if (bytes < 1024) {
          memoryUsed = `${bytes}B`;
        } else if (bytes < 1024 * 1024) {
          memoryUsed = `${(bytes / 1024).toFixed(2)}K`;
        } else if (bytes < 1024 * 1024 * 1024) {
          memoryUsed = `${(bytes / (1024 * 1024)).toFixed(2)}M`;
        } else {
          memoryUsed = `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}G`;
        }
      }
    }

    const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
    const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) : '0';

    return {
      connected: true,
      keys: dbSize,
      memoryUsed: memoryUsed,
      hits,
      misses,
      hitRate: `${hitRate}%`,
    };
  } catch (error) {
    console.error('📊 getCacheStats error:', error);
    return {
      connected: false,
      keys: 0,
      memoryUsed: '0',
      hits: 0,
      misses: 0,
      hitRate: '0%',
    };
  }
}

// Get from cache
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();

  if (!client) {
    return null;
  }

  try {
    const value = await client.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

// Set in cache
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  const client = getRedisClient();

  if (!client) {
    return false;
  }

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

// Delete from cache
export async function cacheDelete(key: string): Promise<boolean> {
  const client = getRedisClient();

  if (!client) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

// Clear all cache
export async function cacheClear(): Promise<boolean> {
  const client = getRedisClient();

  if (!client) {
    return false;
  }

  try {
    await client.flushdb();
    return true;
  } catch (error) {
    console.error('Cache clear error:', error);
    return false;
  }
}
