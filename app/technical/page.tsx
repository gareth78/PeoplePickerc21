import DiagnosticCard from '@/components/dashboard/DiagnosticCard';
import Link from 'next/link';

async function getCacheStats() {
  try {
    // In production, the API is on the same host
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    console.log('🟢 Fetching cache stats from:', `${baseUrl}/api/cache/stats`);

    const response = await fetch(
      `${baseUrl}/api/cache/stats`,
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('🟢 Stats response status:', response.status);

    if (!response.ok) {
      console.error('🟢 Stats fetch failed:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('🟢 Stats data:', data);

    return data.ok ? data.data : null;
  } catch (error) {
    console.error('🟢 Error fetching cache stats:', error);
    return null;
  }
}

export default async function TechnicalPage() {
  const version = process.env.NEXT_PUBLIC_GIT_SHA || 'dev';
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;
  const nodeVersion = process.version;
  const oktaUrl = process.env['okta-org-url'];
  let oktaTenant = 'Not configured';

  if (oktaUrl) {
    try {
      oktaTenant = new URL(oktaUrl).hostname;
    } catch {
      oktaTenant = oktaUrl;
    }
  }

  const cacheStats = await getCacheStats();

  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-primary hover:text-primary-dark font-medium transition-colors"
        >
          ← Back to Search
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-2">
          ORG CONTACT LOOKUP
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Technical Details
        </h1>
        <p className="text-gray-600 leading-relaxed max-w-3xl">
          System diagnostics, build information, and API connectivity status for the People Picker application.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Build Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Version</span>
              <span className="text-sm text-gray-900 font-mono">{version}</span>
            </div>
            {buildTime && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Built</span>
                <span className="text-sm text-gray-900 font-mono">{new Date(buildTime).toLocaleString('en-GB')}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Node Runtime</span>
              <span className="text-sm text-gray-900 font-mono">{nodeVersion}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Okta Tenant</span>
              <span className="text-sm text-gray-900 font-mono">{oktaTenant}</span>
            </div>
          </div>
        </div>

        {/* Cache Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cache Statistics</h2>
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
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a
              href="/diagnostics"
              className="block px-4 py-2 text-sm text-primary hover:bg-primary-light rounded transition-colors"
            >
              View Full Diagnostics →
            </a>
            <a
              href="/api-docs"
              className="block px-4 py-2 text-sm text-primary hover:bg-primary-light rounded transition-colors"
            >
              API Documentation →
            </a>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-4">Diagnostic Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DiagnosticCard
          icon="🏥"
          title="Health dashboard"
          description="Latency, uptime, and runtime diagnostics for the app tier."
          link="/diagnostics"
        />
        <DiagnosticCard
          icon="🔗"
          title="Okta connectivity"
          description="Validate credentials and network access to the Okta Users API."
          link="/diagnostics"
          actionEndpoint="/api/okta/ping"
        />
        <DiagnosticCard
          icon="💾"
          title="Cache statistics"
          description="Redis connection, hit rate, and memory usage metrics."
          link="/diagnostics"
        />
      </div>
    </div>
  );
}
