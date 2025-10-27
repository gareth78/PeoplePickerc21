import HeroSection from '@/components/dashboard/HeroSection';
import SearchSection from '@/components/dashboard/SearchSection';
import DiagnosticCard from '@/components/dashboard/DiagnosticCard';
import styles from './page.module.css';

export default function HomePage() {
  const version = 'v0.1.0';
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

  return (
    <div className={styles.container}>
      <SearchSection />

      <HeroSection
        version={version}
        nodeVersion={nodeVersion}
        oktaTenant={oktaTenant}
      />

      <div className={styles.diagnosticGrid}>
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
          icon="📋"
          title="Sample payload"
          description="Preview normalized user records for development and QA."
          link="/diagnostics"
        />
      </div>
    </div>
  );
}
