import { useMemo } from 'react';
import { PresenceBadge } from './PresenceBadge';
import type { EnhancedUser } from '../types';

interface SearchTabProps {
  query: string;
  onQueryChange(next: string): void;
  results: EnhancedUser[];
  isSearching: boolean;
  error: string | null;
  selectedEmail: string | null;
  minQueryLength: number;
  onSelect(user: EnhancedUser): void;
  onHover?(email: string): void;
}

const getInitials = (user: EnhancedUser): string => {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length === 0) {
    return user.displayName.charAt(0).toUpperCase();
  }
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

export function SearchTab({
  query,
  onQueryChange,
  results,
  isSearching,
  error,
  selectedEmail,
  minQueryLength,
  onSelect,
  onHover,
}: SearchTabProps) {
  const trimmed = query.trim();
  const showEmptyState = !isSearching && trimmed.length >= minQueryLength && results.length === 0 && !error;

  const orderedResults = useMemo(() => {
    return results.slice().sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));
  }, [results]);

  return (
    <div className="tab-panel active" role="tabpanel" aria-labelledby="tab-search">
      <label htmlFor="search" className="section-title">
        Search Your Directory
      </label>
      <input
        id="search"
        className="search-input"
        type="text"
        role="searchbox"
        inputMode="search"
        placeholder="Search by name, title, or email"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        aria-describedby="search-help"
      />
      <p id="search-help" className="muted">
        Enter at least {minQueryLength} characters to begin.
      </p>
      {error ? (
        <div className="error-state" role="alert">
          {error}
        </div>
      ) : null}
      {isSearching ? (
        <div className="empty-state" role="status">
          <div className="loading-spinner" aria-hidden />
          <div>Searching directory…</div>
        </div>
      ) : null}
      {trimmed.length < minQueryLength && !isSearching ? (
        <div className="empty-state">Keep typing to search people.</div>
      ) : null}
      {showEmptyState ? <div className="empty-state">No matches. Try a different name or email.</div> : null}
      <div className="results-list" role="list">
        {orderedResults.map((user) => {
          const isActive = user.email === selectedEmail;
          const handleHover = () => onHover?.(user.email);
          return (
            <button
              key={user.id}
              type="button"
              role="listitem"
              className={`result-item${isActive ? ' active' : ''}`}
              onClick={() => onSelect(user)}
              onMouseEnter={handleHover}
              onFocus={handleHover}
            >
              {user.photo ? (
                <img src={user.photo} alt={user.displayName} className="avatar" />
              ) : (
                <span className="avatar" aria-hidden>
                  {getInitials(user)}
                </span>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <strong>{user.displayName}</strong>
                <span className="muted">
                  {user.title ? `${user.title} · ` : ''}
                  {user.department || user.officeLocation || user.email}
                </span>
                <PresenceBadge presence={user.presence} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
