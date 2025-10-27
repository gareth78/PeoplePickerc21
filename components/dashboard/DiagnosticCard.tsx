'use client';

import { useState } from 'react';

interface DiagnosticCardProps {
  icon: string;
  title: string;
  description: string;
  link: string;
  actionEndpoint?: string;
}

export default function DiagnosticCard({
  icon,
  title,
  description,
  link,
  actionEndpoint
}: DiagnosticCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ error?: string; data?: any } | null>(null);

  const handleAction = async () => {
    if (!actionEndpoint) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(actionEndpoint);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 transition-shadow hover:shadow-md">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{description}</p>

      {result && (
        <div className="mb-3 text-sm">
          {result.error ? (
            <span className="text-red-600">❌ {result.error}</span>
          ) : (
            <span className="text-green-600">✓ Success</span>
          )}
        </div>
      )}

      {actionEndpoint ? (
        <button
          onClick={handleAction}
          disabled={loading}
          className="inline-block text-sm text-primary hover:text-primary-dark font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Connection →'}
        </button>
      ) : (
        <a
          href={link}
          className="inline-block text-sm text-primary hover:text-primary-dark font-medium transition-colors"
        >
          Explore →
        </a>
      )}
    </div>
  );
}
