import { useCallback, useEffect, useRef, useState } from 'react';
import type { CacheStats } from '@/lib/cache';
import type { DiagnosticMetrics } from '../types';

function mergeCacheStats(
  fallback: CacheStats,
  incoming: CacheStats | undefined
): CacheStats {
  if (!incoming) {
    return fallback;
  }

  return {
    type: incoming.type ?? fallback.type,
    ttlSeconds: incoming.ttlSeconds ?? fallback.ttlSeconds,
    entries: incoming.entries ?? fallback.entries,
    hitRate:
      typeof incoming.hitRate === 'number' ? incoming.hitRate : fallback.hitRate,
  };
}

const EMPTY_STATS: CacheStats = {
  type: 'unknown',
  ttlSeconds: 0,
  entries: 0,
  hitRate: 0,
};

export function useHealth(initialCacheStats?: CacheStats) {
  const [metrics, setMetrics] = useState<DiagnosticMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(
    initialCacheStats ?? null
  );
  const cacheStatsRef = useRef<CacheStats | null>(initialCacheStats ?? null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [healthResponse, oktaResponse] = await Promise.all([
        fetch('/api/health', { cache: 'no-store' }),
        fetch('/api/okta/ping', { cache: 'no-store' }),
      ]);

      if (!healthResponse.ok) {
        throw new Error('Failed to load health metrics');
      }

      const healthJson = await healthResponse.json();
      const oktaJson = await oktaResponse.json();

      const fallbackStats = cacheStatsRef.current ?? initialCacheStats ?? EMPTY_STATS;
      const resolvedCacheStats = mergeCacheStats(fallbackStats, healthJson.cache);

      cacheStatsRef.current = resolvedCacheStats;
      setCacheStats(resolvedCacheStats);

      setMetrics({
        health: healthJson,
        cache: resolvedCacheStats,
        okta: oktaJson.data || {
          connected: false,
          latency: 0,
          error: oktaJson.error,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [initialCacheStats]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { metrics, loading, error, refresh, cacheStats };
}
