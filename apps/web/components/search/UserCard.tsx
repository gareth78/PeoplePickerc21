import type { User } from '@/lib/types';
import styles from './UserCard.module.css';

interface UserCardProps {
  user: User;
  onSelect?: (user: User) => void;
}

export default function UserCard({ user, onSelect }: UserCardProps) {
  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}` || user.displayName.charAt(0);

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onSelect?.(user)}
    >
      <div className={styles.avatar}>{initials}</div>
      <div className={styles.details}>
        <div className={styles.name}>{user.displayName}</div>
        {user.title && <div className={styles.title}>{user.title}</div>}
        {user.officeLocation && <div className={styles.location}>{user.officeLocation}</div>}
        <div className={styles.email}>{user.email}</div>
      </div>
    </button>
  );
}
