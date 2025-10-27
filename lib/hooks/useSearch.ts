import { useCallback, useState } from 'react';
import type { User } from '../types';

function sortUsers(users: User[]): User[] {
  return [...users].sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));
}

interface UseSearchResult {
  results: User[];
  loading: boolean;
  error: string | null;
  nextCursor: string | null;
  search: (query: string, cursor?: string) => Promise<void>;
  reset: () => void;
}

export function useSearch(): UseSearchResult {
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const search = useCallback(async (query: string, cursor?: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setError(null);
      setNextCursor(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q: query.trim() });
      if (cursor) params.append('cursor', cursor);

      const response = await fetch(`/api/okta/users?${params.toString()}`);
      const data = await response.json();

      if (!data.ok) {
        setError(data.error || 'Search failed');
        return;
      }

      const users: User[] = data.data.users;

      setResults((prev) => {
        if (cursor) {
          return sortUsers([...prev, ...users]);
        }
        return sortUsers(users);
      });

      setNextCursor(data.data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setLoading(false);
    setError(null);
    setNextCursor(null);
  }, []);

  return { results, loading, error, nextCursor, search, reset };
}
