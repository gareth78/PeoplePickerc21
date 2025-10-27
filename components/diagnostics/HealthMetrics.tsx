import type { DiagnosticMetrics } from '@/lib/types';
import styles from './HealthMetrics.module.css';

interface HealthMetricsProps {
  metrics: DiagnosticMetrics | null;
}

export default function HealthMetrics({ metrics }: HealthMetricsProps) {
  if (!metrics) {
    return <div className={styles.placeholder}>No health metrics available.</div>;
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Health Status</h2>
      <div className={styles.row}>
        <span>Status</span>
        <span className={metrics.health.ok ? styles.success : styles.error}>
          {metrics.health.ok ? 'Healthy' : 'Unhealthy'}
        </span>
      </div>
      <div className={styles.row}>
        <span>Environment</span>
        <span>{metrics.health.environment}</span>
      </div>
      <div className={styles.row}>
        <span>Node Version</span>
        <span>{metrics.health.nodeVersion}</span>
      </div>
      <div className={styles.row}>
        <span>Uptime</span>
        <span>{Math.floor(metrics.health.uptime)}s</span>
      </div>
      <div className={styles.row}>
        <span>Last Check</span>
        <span>{new Date(metrics.health.timestamp).toLocaleString()}</span>
      </div>
    </div>
  );
}
