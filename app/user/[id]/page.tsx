import { notFound } from 'next/navigation';
import { getUserById } from '@/lib/okta';
import styles from './page.module.css';

export default async function UserProfilePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { q?: string };
}) {
  try {
    const user = await getUserById(params.id);
    const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}` || user.displayName.charAt(0);

    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.avatar}>{initials}</div>

          <h1 className={styles.name}>{user.displayName}</h1>

          {user.title && <p className={styles.title}>{user.title}</p>}
          {user.department && <p className={styles.department}>{user.department}</p>}

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.label}>Email:</span>
              <a href={`mailto:${user.email}`} className={styles.value}>{user.email}</a>
            </div>

            {user.mobilePhone && (
              <div className={styles.detailItem}>
                <span className={styles.label}>Phone:</span>
                <a href={`tel:${user.mobilePhone}`} className={styles.value}>{user.mobilePhone}</a>
              </div>
            )}

            {user.officeLocation && (
              <div className={styles.detailItem}>
                <span className={styles.label}>Location:</span>
                <span className={styles.value}>{user.officeLocation}</span>
              </div>
            )}

            <div className={styles.detailItem}>
              <span className={styles.label}>Okta ID:</span>
              <span className={styles.valueCode}>{user.id}</span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <a
            href={searchParams.q ? `/?q=${encodeURIComponent(searchParams.q)}` : '/'}
            className={styles.link}
          >
            ← Back to Search
          </a>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
