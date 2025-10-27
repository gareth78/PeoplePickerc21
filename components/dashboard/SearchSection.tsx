'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useSearch } from '@/lib/hooks/useSearch';
import type { User } from '@/lib/types';
import styles from './SearchSection.module.css';

export default function SearchSection() {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { results, loading, error, nextCursor, search } = useSearch();

  useEffect(() => {
    if (debouncedQuery) {
      void search(debouncedQuery);
    } else {
      void search('');
    }
  }, [debouncedQuery, search]);

  useEffect(() => {
    if (!query) {
      setSelectedUser(null);
    }
  }, [query]);

  const handleLoadMore = () => {
    if (nextCursor) {
      void search(query, nextCursor);
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.title}>Directory search</h2>
      <p className={styles.subtitle}>
        Start typing to look up colleagues by name, title, or office location.
        Results are served from the Okta Users API with live pagination.
      </p>

      <div className={styles.searchBox}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, title, or location..."
          className={styles.searchInput}
        />

        {loading && <div className={styles.loading}>Searching...</div>}

        {error && <div className={styles.error}>{error}</div>}
      </div>

      {query && (
        <div className={styles.contentLayout}>
          <div className={styles.resultsPanel}>
            {results.length > 0 && (
              <div className={styles.results}>
                {results.map((user) => {
                  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}` || user.displayName.charAt(0);

                  return (
                    <button
                      key={user.id}
                      className={`${styles.resultItem} ${selectedUser?.id === user.id ? styles.resultItemActive : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className={styles.avatar}>{initials}</div>
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>{user.displayName}</div>
                        {user.title && <div className={styles.userTitle}>{user.title}</div>}
                        {user.officeLocation && (
                          <div className={styles.userLocation}>{user.officeLocation}</div>
                        )}
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </button>
                  );
                })}

                {nextCursor && (
                  <button onClick={handleLoadMore} className={styles.loadMore}>
                    Load more
                  </button>
                )}
              </div>
            )}

            {debouncedQuery.length >= 2 && results.length === 0 && !loading && (
              <div className={styles.noResults}>No results found</div>
            )}
          </div>

          <div className={styles.detailsPanel}>
            {selectedUser ? (
              <div className={styles.selectedBox}>
                <h3 className={styles.selectedTitle}>Selected colleague</h3>
                <div className={styles.selectedCard}>
                  <div className={styles.selectedAvatar}>
                    {`${selectedUser.firstName?.charAt(0) ?? ''}${selectedUser.lastName?.charAt(0) ?? ''}` || selectedUser.displayName.charAt(0)}
                  </div>
                  <div className={styles.selectedInfo}>
                    <div className={styles.selectedName}>{selectedUser.displayName}</div>
                    {selectedUser.title && <p><strong>Title:</strong> {selectedUser.title}</p>}
                    {selectedUser.department && <p><strong>Department:</strong> {selectedUser.department}</p>}
                    {selectedUser.officeLocation && <p><strong>Location:</strong> {selectedUser.officeLocation}</p>}
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    {selectedUser.mobilePhone && <p><strong>Phone:</strong> {selectedUser.mobilePhone}</p>}
                    <a href={`/user/${selectedUser.id}`} className={styles.viewProfile}>
                      View full profile →
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.placeholderBox}>
                <p>Select a person from the results to view their details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
