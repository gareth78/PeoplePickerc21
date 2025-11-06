'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Book } from 'lucide-react';

interface CacheStats {
  connected: boolean;
  keys: number;
  memoryUsed: string;
  hitRate: string;
  hits: number;
  misses: number;
}

interface OktaTestResult {
  connected: boolean;
  latency: number;
  error?: string;
}

export default function AdminDashboardPage() {
  const [buildInfo, setBuildInfo] = useState<{
    version: string;
    buildTime?: string;
    nodeVersion: string;
    oktaTenant: string;
  } | null>(null);

  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<{success: boolean; message: string; keysCleared?: number} | null>(null);
  const [oktaTestResult, setOktaTestResult] = useState<OktaTestResult | null>(null);
  const [testingOkta, setTestingOkta] = useState(false);

  // Fetch build info, cache stats, and Okta connection status
  const fetchData = async () => {
    try {
      // Fetch cache stats
      const cacheResponse = await fetch('/api/cache/stats', { cache: 'no-store' });
      const cacheJson = await cacheResponse.json();
      if (cacheJson.ok) {
        setCacheStats(cacheJson.data);
      }

      // Fetch build info from API
      const buildResponse = await fetch('/api/health', { cache: 'no-store' });
      const buildJson = await buildResponse.json();

      setBuildInfo({
        version: buildJson.version || 'dev',
        buildTime: buildJson.buildTime,
        nodeVersion: buildJson.nodeVersion || process.version,
        oktaTenant: buildJson.oktaTenant || 'Not configured'
      });

      // Fetch Okta connection status
      const oktaResponse = await fetch('/api/okta/ping', { cache: 'no-store' });
      const oktaJson = await oktaResponse.json();
      if (oktaJson.data) {
        setOktaTestResult(oktaJson.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setClearResult(null);
    setOktaTestResult(null);
    await fetchData();
    setRefreshing(false);
  };

  const handleClearCache = async () => {
    if (!confirm('Clear all cached data?')) {
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

      // Refresh cache stats after clearing
      if (data.success) {
        setTimeout(async () => {
          await fetchData();
        }, 1000);
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

  const handleTestOkta = async () => {
    setTestingOkta(true);
    try {
      const response = await fetch('/api/okta/ping', { cache: 'no-store' });
      const data = await response.json();
      setOktaTestResult(data.data || {
        connected: false,
        latency: 0,
        error: data.error || 'Connection failed'
      });
    } catch (error) {
      setOktaTestResult({
        connected: false,
        latency: 0,
        error: 'Failed to test connection'
      });
    } finally {
      setTestingOkta(false);
    }
  };

  return (
    <div>
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2">
              People Picker
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 leading-relaxed max-w-3xl">
              System diagnostics, build information, and API connectivity status for the People Picker application.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Build Information, Okta Connection & Cache Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Build Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Build Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</span>
              <span className="text-sm text-gray-900 font-mono">
                {buildInfo?.version || 'dev'}
                {buildInfo?.buildTime && (
                  <span className="text-gray-400"> • Built: {new Date(buildInfo.buildTime).toLocaleString('en-GB')}</span>
                )}
              </span>
            </div>
            {buildInfo?.buildTime && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Built</span>
                <span className="text-sm text-gray-900 font-mono">{new Date(buildInfo.buildTime).toLocaleString('en-GB')}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Node Runtime</span>
              <span className="text-sm text-gray-900 font-mono">{buildInfo?.nodeVersion || 'Loading...'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Okta Tenant</span>
              <span className="text-sm text-gray-900 font-mono">{buildInfo?.oktaTenant || 'Loading...'}</span>
            </div>
          </div>
        </div>

        {/* Okta Connection */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Okta Connection</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
              <span className={`text-sm font-semibold ${oktaTestResult?.connected ? 'text-green-600' : 'text-gray-400'}`}>
                {oktaTestResult?.connected ? '✓ Connected' : 'Checking...'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Latency</span>
              <span className="text-sm text-gray-900 font-mono">
                {oktaTestResult?.latency !== undefined ? `${oktaTestResult.latency}ms` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Cache Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Cache Statistics</h2>
            <button
              onClick={handleClearCache}
              disabled={clearing || !cacheStats?.connected}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {clearing ? 'Clearing...' : 'Clear All Cache'}
            </button>
          </div>

          {cacheStats ? (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
                <span className={`text-sm font-semibold ${cacheStats.connected ? 'text-green-600' : 'text-red-600'}`}>
                  {cacheStats.connected ? '✓ Connected' : '✗ Disconnected'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Keys</span>
                <span className="text-sm text-gray-900 font-mono">{cacheStats.keys}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Memory</span>
                <span className="text-sm text-gray-900 font-mono">{cacheStats.memoryUsed}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hit Rate</span>
                <span className="text-sm text-gray-900 font-mono">{cacheStats.hitRate}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hits / Misses</span>
                <span className="text-sm text-gray-900 font-mono">{cacheStats.hits} / {cacheStats.misses}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Cache stats unavailable</div>
          )}

          {clearResult && (
            <div className={`mt-4 p-3 rounded-lg ${clearResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <p className="font-medium text-sm">{clearResult.message}</p>
              {clearResult.keysCleared !== undefined && (
                <p className="text-xs mt-1">{clearResult.keysCleared} cache keys cleared</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Diagnostic Tools Section */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Diagnostic Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Okta Connectivity */}
        <div className="bg-white rounded-lg shadow-sm p-6 transition-shadow hover:shadow-md">
          <div className="text-3xl mb-3">🔗</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Okta connectivity</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Validate credentials and network access to the Okta Users API.
          </p>

          {oktaTestResult && (
            <div className="mb-3 text-sm">
              {oktaTestResult.connected ? (
                <div className="space-y-1">
                  <span className="text-green-600 font-medium">✓ Connected</span>
                  <div className="text-gray-700">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Latency: </span>
                    <span className="font-mono">{oktaTestResult.latency}ms</span>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  <div className="font-medium">✗ Connection Failed</div>
                  {oktaTestResult.error && (
                    <div className="text-xs mt-1">{oktaTestResult.error}</div>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleTestOkta}
            disabled={testingOkta}
            className="inline-block text-sm text-primary hover:text-primary-dark font-medium transition-colors disabled:opacity-50"
          >
            {testingOkta ? 'Testing...' : 'Test Connection →'}
          </button>
        </div>

        {/* API Documentation */}
        <div className="bg-white rounded-lg shadow-sm p-6 transition-shadow hover:shadow-md">
          <div className="text-3xl mb-3">
            <Book className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">API Documentation</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Browse the interactive API documentation and endpoint specifications.
          </p>
          <a
            href="/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-primary hover:text-primary-dark font-medium transition-colors"
          >
            Open Documentation →
          </a>
        </div>
      </div>
    </div>
  );
}
