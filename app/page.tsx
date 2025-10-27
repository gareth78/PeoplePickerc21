import SearchSection from '@/components/dashboard/SearchSection';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <SearchSection />

      <div className={styles.navigation}>
        <a href="/technical" className={styles.technicalLink}>
          View technical details →
        </a>
      </div>
    </div>
  );
}
