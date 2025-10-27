import type { CacheStats as CacheStatsType } from '@/lib/types';
import styles from './CacheStats.module.css';

interface CacheStatsProps {
  stats: CacheStatsType | null;
}

export default function CacheStats({ stats }: CacheStatsProps) {
  if (!stats) {
    return <div className={styles.placeholder}>Cache statistics unavailable.</div>;
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Cache Statistics</h2>
      <div className={styles.row}>
        <span>Type</span>
        <span>{stats.type}</span>
      </div>
      <div className={styles.row}>
        <span>TTL</span>
        <span>{stats.ttl}s</span>
      </div>
      <div className={styles.row}>
        <span>Entries</span>
        <span>{stats.entries}</span>
      </div>
      {typeof stats.hitRate === 'number' && (
        <div className={styles.row}>
          <span>Hit Rate</span>
          <span>{(stats.hitRate * 100).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
