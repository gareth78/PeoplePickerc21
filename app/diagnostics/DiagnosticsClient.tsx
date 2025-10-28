'use client';

import { useHealth } from '@/lib/hooks/useHealth';
import styles from './page.module.css';

export default function DiagnosticsClient() {
  const { metrics, loading, error, refresh } = useHealth();

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
      </div>

      <div className={styles.footer}>
        <a href="/" className={styles.link}>
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
