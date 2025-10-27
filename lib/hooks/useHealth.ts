import { useCallback, useEffect, useState } from 'react';
import type { DiagnosticMetrics } from '../types';

export function useHealth() {
  const [metrics, setMetrics] = useState<DiagnosticMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      setMetrics({
        health: healthJson,
        cache: healthJson.cache || { type: 'unknown', ttl: 0, entries: 0 },
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
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { metrics, loading, error, refresh };
}
