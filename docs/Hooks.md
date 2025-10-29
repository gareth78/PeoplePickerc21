# Hooks

## useSearch
- Path: `lib/hooks/useSearch.ts`
- Signature:
```ts
function useSearch(): {
  results: User[];
  loading: boolean;
  error: string | null;
  nextCursor: string | null;
  search: (query: string, cursor?: string) => Promise<void>;
  reset: () => void;
}
```
- Behavior:
  - Ignores queries shorter than 2 characters (resets results and errors).
  - Calls `/api/okta/users?q=...` and merges paginated results when `cursor` is provided.
  - Results are sorted by `displayName` (case-insensitive).

Example:
```tsx
import { useSearch } from '@/lib/hooks/useSearch';

export function Directory() {
  const { results, loading, error, nextCursor, search } = useSearch();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void search(e.target.value);
  };

  const loadMore = () => {
    if (nextCursor) void search('jane', nextCursor);
  };

  return (
    <div>
      <input onChange={onChange} placeholder="Search by name or email" />
      {loading && <div>Loading…</div>}
      {error && <div role="alert">{error}</div>}
      <ul>
        {results.map(u => <li key={u.id}>{u.displayName}</li>)}
      </ul>
      {nextCursor && <button onClick={loadMore}>Load more</button>}
    </div>
  );
}
```

---

## useHealth
- Path: `lib/hooks/useHealth.ts`
- Signature:
```ts
function useHealth(): {
  metrics: DiagnosticMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```
- Behavior:
  - Fetches `/api/health` and `/api/okta/ping` in parallel with `cache: 'no-store'`.
  - Populates `metrics.health` and `metrics.okta`. Provides `refresh()`.

Example:
```tsx
import { useHealth } from '@/lib/hooks/useHealth';

export function Diagnostics() {
  const { metrics, loading, error, refresh } = useHealth();

  if (loading && !metrics) return <div>Loading diagnostics…</div>;
  if (error && !metrics) return <button onClick={refresh}>Retry</button>;

  return (
    <div>
      <div>Status: {metrics?.health.ok ? 'Healthy' : 'Unhealthy'}</div>
      <div>Okta: {metrics?.okta.connected ? 'Connected' : 'Disconnected'}</div>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

---

## useDebounce
- Path: `lib/hooks/useDebounce.ts`
- Signature:
```ts
function useDebounce<T>(value: T, delay: number): T
```
- Behavior:
  - Returns a debounced copy of `value` that updates after `delay` milliseconds.

Example:
```tsx
import { useDebounce } from '@/lib/hooks/useDebounce';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  // Use `debounced` in API calls
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```
