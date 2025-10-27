'use client';

import { useState } from 'react';
import styles from './DiagnosticCard.module.css';

type ActionResult = {
  error?: string;
  [key: string]: unknown;
};

interface DiagnosticCardProps {
  icon: string;
  title: string;
  description: string;
  link: string;
  actionEndpoint?: string;
}

export default function DiagnosticCard({ icon, title, description, link, actionEndpoint }: DiagnosticCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const handleAction = async () => {
    if (!actionEndpoint) return;

    setLoading(true);
    try {
      const response = await fetch(actionEndpoint, { cache: 'no-store' });
      const data = (await response.json()) as ActionResult;
      setResult(data);
    } catch {
      setResult({ error: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  };

  const hasError = result && typeof result.error === 'string';

  return (
    <div className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      
      {result && (
        <div className={styles.result}>
          {hasError ? (
            <span className={styles.error}>❌ {result.error}</span>
          ) : (
            <span className={styles.success}>✓ Success</span>
          )}
        </div>
      )}
      
      <a 
        href={link} 
        className={styles.link}
        onClick={(event) => {
          if (actionEndpoint) {
            event.preventDefault();
            void handleAction();
          }
        }}
      >
        {loading ? 'Loading...' : 'Explore →'}
      </a>
    </div>
  );
}
