import type { User } from '@/lib/types';
import UserCard from './UserCard';
import styles from './SearchResults.module.css';

interface SearchResultsProps {
  users: User[];
  onSelect?: (user: User) => void;
  onLoadMore?: () => void;
  nextCursor?: string | null;
  loading?: boolean;
}

export default function SearchResults({ users, onSelect, onLoadMore, nextCursor, loading }: SearchResultsProps) {
  if (users.length === 0) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.list}>
        {users.map((user) => (
          <UserCard key={user.id} user={user} onSelect={onSelect} />
        ))}
      </div>
      {nextCursor && (
        <button
          type="button"
          className={styles.loadMore}
          onClick={onLoadMore}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
