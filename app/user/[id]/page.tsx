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
          {/* Header Section */}
          <div className={styles.header}>
            <div className={styles.avatar}>{initials}</div>
            <h1 className={styles.name}>{user.displayName}</h1>
            {(user.title || user.department) && (
              <p className={styles.subtitle}>
                {user.title && <span>{user.title}</span>}
                {user.title && user.department && <span className={styles.separator}> • </span>}
                {user.department && <span>{user.department}</span>}
              </p>
            )}
          </div>

          {/* Basic Information Section */}
          {(user.login || user.email || user.secondaryEmail) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Basic Information</h2>
              <div className={styles.details}>
                {user.login && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Username:</span>
                    <span className={styles.value}>{user.login}</span>
                  </div>
                )}
                {user.email && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Email:</span>
                    <a href={`mailto:${user.email}`} className={styles.link}>{user.email}</a>
                  </div>
                )}
                {user.secondaryEmail && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Secondary Email:</span>
                    <a href={`mailto:${user.secondaryEmail}`} className={styles.link}>{user.secondaryEmail}</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information Section */}
          {(user.mobilePhone || user.primaryPhone || user.streetAddress || user.city || user.state || user.zipCode || user.countryCode) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Contact Information</h2>
              <div className={styles.details}>
                {user.mobilePhone && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Mobile Phone:</span>
                    <a href={`tel:${user.mobilePhone}`} className={styles.link}>{user.mobilePhone}</a>
                  </div>
                )}
                {user.primaryPhone && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Primary Phone:</span>
                    <a href={`tel:${user.primaryPhone}`} className={styles.link}>{user.primaryPhone}</a>
                  </div>
                )}
                {user.streetAddress && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Street Address:</span>
                    <span className={styles.value}>{user.streetAddress}</span>
                  </div>
                )}
                {user.city && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>City:</span>
                    <span className={styles.value}>{user.city}</span>
                  </div>
                )}
                {user.state && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>State:</span>
                    <span className={styles.value}>{user.state}</span>
                  </div>
                )}
                {user.zipCode && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Postal Code:</span>
                    <span className={styles.value}>{user.zipCode}</span>
                  </div>
                )}
                {user.countryCode && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Country Code:</span>
                    <span className={styles.value}>{user.countryCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organization Information Section */}
          {(user.title || user.department || user.division || user.organization || user.costCenter || user.employeeNumber) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Organization Information</h2>
              <div className={styles.details}>
                {user.title && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Title:</span>
                    <span className={styles.value}>{user.title}</span>
                  </div>
                )}
                {user.department && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Department:</span>
                    <span className={styles.value}>{user.department}</span>
                  </div>
                )}
                {user.division && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Division:</span>
                    <span className={styles.value}>{user.division}</span>
                  </div>
                )}
                {user.organization && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Organization:</span>
                    <span className={styles.value}>{user.organization}</span>
                  </div>
                )}
                {user.costCenter && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Cost Center:</span>
                    <span className={styles.value}>{user.costCenter}</span>
                  </div>
                )}
                {user.employeeNumber && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Employee Number:</span>
                    <span className={styles.value}>{user.employeeNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location & Preferences Section */}
          {(user.officeLocation || user.preferredLanguage || user.locale || user.timezone || user.countryName) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Location & Preferences</h2>
              <div className={styles.details}>
                {user.officeLocation && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Office Location:</span>
                    <span className={styles.value}>{user.officeLocation}</span>
                  </div>
                )}
                {user.preferredLanguage && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Preferred Language:</span>
                    <span className={styles.value}>{user.preferredLanguage}</span>
                  </div>
                )}
                {user.locale && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Locale:</span>
                    <span className={styles.value}>{user.locale}</span>
                  </div>
                )}
                {user.timezone && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Time Zone:</span>
                    <span className={styles.value}>{user.timezone}</span>
                  </div>
                )}
                {user.countryName && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Country/Region:</span>
                    <span className={styles.value}>{user.countryName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manager Information Section */}
          {(user.manager || user.managerEmail) && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Manager Information</h2>
              <div className={styles.details}>
                {user.manager && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Manager:</span>
                    <span className={styles.value}>{user.manager}</span>
                  </div>
                )}
                {user.managerEmail && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Manager Email:</span>
                    <a href={`mailto:${user.managerEmail}`} className={styles.link}>{user.managerEmail}</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Details Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Technical Details</h2>
            <div className={styles.details}>
              <div className={styles.detailItem}>
                <span className={styles.label}>Okta ID:</span>
                <span className={styles.valueCode}>{user.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <a
            href={searchParams.q ? `/?q=${encodeURIComponent(searchParams.q)}` : '/'}
            className={styles.backLink}
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
