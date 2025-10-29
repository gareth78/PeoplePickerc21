'use client';

import { useEffect, useState } from 'react';
import { useHealth } from '@/lib/hooks/useHealth';
import styles from './page.module.css';

export default function DiagnosticsClient() {
  const { metrics, loading, error, refresh } = useHealth();

  const [cacheStats, setCacheStats] = useState<any>(null);
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<{success: boolean; message: string; keysCleared?: number} | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCacheStats = async () => {
      try {
        const res = await fetch('/api/cache/stats', { cache: 'no-store' });
        const json = await res.json();
        if (isMounted) {
          setCacheStats(json?.data || null);
        }
      } catch {
        if (isMounted) {
          setCacheStats(null);
        }
      }
    };
    fetchCacheStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cache? This cannot be undone.')) {
      return;
    }
    
    setClearing(true);
    setClearResult(null);
    
    try {
      const response = await fetch('/api/cache/clear', {
        method: 'POST'
      });
      const data = await response.json();
      setClearResult(data);
      
      // Refresh page after 1.5 seconds to show updated stats
      if (data.success) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      setClearResult({
        success: false,
        message: 'Failed to clear cache'
      });
    } finally {
      setClearing(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading diagnostics...</div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
        <button onClick={refresh} className={styles.button}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>System Diagnostics</h1>
        <button onClick={refresh} className={styles.button}>
          Refresh
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Health Status</h2>
          {metrics ? (
            <>
              <div className={styles.metric}>
                <span className={styles.label}>Status:</span>
                <span
                  className={
                    metrics.health.ok ? styles.success : styles.error
                  }
                >
                  {metrics.health.ok ? '✓ Healthy' : '✗ Unhealthy'}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Environment:</span>
                <span>{metrics.health.environment}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Node Version:</span>
                <span>{metrics.health.nodeVersion}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Uptime:</span>
                <span>{Math.floor(metrics.health.uptime)}s</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Last Check:</span>
                <span>
                  {new Date(metrics.health.timestamp).toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <div className={styles.loading}>Loading health status...</div>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Okta Connection</h2>
          {metrics ? (
            <>
              <div className={styles.metric}>
                <span className={styles.label}>Status:</span>
                <span
                  className={
                    metrics.okta.connected ? styles.success : styles.error
                  }
                >
                  {metrics.okta.connected ? '✓ Connected' : '✗ Disconnected'}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Latency:</span>
                <span>{metrics.okta.latency}ms</span>
              </div>
              {metrics.okta.error && (
                <div className={styles.metric}>
                  <span className={styles.label}>Error:</span>
                  <span className={styles.error}>{metrics.okta.error}</span>
                </div>
              )}
            </>
          ) : (
            <div className={styles.loading}>Checking Okta connectivity...</div>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Cache Statistics</h2>
          {cacheStats ? (
            <>
              <div className={styles.metric}>
                <span className={styles.label}>Status:</span>
                <span className={cacheStats.connected ? styles.success : styles.error}>
                  {cacheStats.connected ? '✓ Connected' : '✗ Disconnected'}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Keys:</span>
                <span>{cacheStats.keys}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Memory:</span>
                <span>{cacheStats.memoryUsed}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.label}>Hit Rate:</span>
                <span>{cacheStats.hitRate}</span>
              </div>

              {cacheStats.connected && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-3">Cache Management</h3>
                  <button
                    onClick={handleClearCache}
                    disabled={clearing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {clearing ? 'Clearing Cache...' : 'Clear All Cache'}
                  </button>
                  {clearResult && (
                    <div className={`mt-3 p-3 rounded-lg ${clearResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="font-medium">{clearResult.message}</p>
                      {clearResult.keysCleared !== undefined && (
                        <p className="text-sm mt-1">{clearResult.keysCleared} cache keys cleared</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.loading}>Loading cache statistics...</div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <a href="/" className={styles.link}>
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
