import styles from './HeroSection.module.css';

interface HeroSectionProps {
  version: string;
  nodeVersion: string;
  oktaTenant: string;
}

export default function HeroSection({ version, nodeVersion, oktaTenant }: HeroSectionProps) {
  return (
    <div className={styles.hero}>
      <div className={styles.mainInfo}>
        <p className={styles.label}>ORG CONTACT LOOKUP</p>
        <h1 className={styles.title}>People Picker MVP</h1>
        <p className={styles.description}>
          Build People Picker MVP based on Okta directory integration. 
          This tool searches the Okta directory so staff can quickly connect with the right colleagues.
        </p>
        <div className={styles.actions}>
          <a href="/diagnostics" className={styles.primaryButton}>
            View diagnostics →
          </a>
          <a href="/api-docs" className={styles.secondaryButton}>
            Check Okta status
          </a>
        </div>
      </div>
      
      <div className={styles.buildInfo}>
        <h3 className={styles.buildTitle}>Build summary</h3>
        <div className={styles.buildItem}>
          <span className={styles.buildLabel}>VERSION</span>
          <span className={styles.buildValue}>{version}</span>
        </div>
        <div className={styles.buildItem}>
          <span className={styles.buildLabel}>NODE RUNTIME</span>
          <span className={styles.buildValue}>{nodeVersion}</span>
        </div>
        <div className={styles.buildItem}>
          <span className={styles.buildLabel}>OKTA TENANT</span>
          <span className={styles.buildValue}>{oktaTenant}</span>
        </div>
      </div>
    </div>
  );
}
