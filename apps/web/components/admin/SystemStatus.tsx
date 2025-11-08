// components/admin/SystemStatus.tsx
'use client';

import { useEffect, useState } from 'react';
import { Database, Shield, Activity, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface HealthStatus {
  database: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    message: string;
  };
  okta: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    message: string;
  };
  overall: 'healthy' | 'degraded' | 'down';
}

export function SystemStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/admin/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
        setLastCheck(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400 animate-pulse" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
        <button
          onClick={fetchHealth}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : health ? (
        <div className="space-y-3">
          {/* Overall Status */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(health.overall)}
                <div>
                  <p className="font-semibold text-gray-900">Overall System</p>
                  <p className="text-xs text-gray-500">All services</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(health.overall)}`}>
                {health.overall.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Database Status */}
          <div className="p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Database</p>
                  <p className="text-xs text-gray-500">
                    {health.database.message} · {health.database.responseTime}ms
                  </p>
                </div>
              </div>
              {getStatusIcon(health.database.status)}
            </div>
          </div>

          {/* Okta Status */}
          <div className="p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Okta Integration</p>
                  <p className="text-xs text-gray-500">
                    {health.okta.message} · {health.okta.responseTime}ms
                  </p>
                </div>
              </div>
              {getStatusIcon(health.okta.status)}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>Unable to fetch system status</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
        Last checked: {lastCheck.toLocaleTimeString()}
      </div>
    </div>
  );
}
