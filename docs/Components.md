# Components

All components are written in React with TypeScript. Import paths are relative to `@/components`.

## SearchInterface
- Path: `components/search/SearchInterface.tsx`
- Type: Client component
- Props: none
- Description: Full search experience with query input, results list, infinite load, and person detail preview. Uses `useSearch` and `useDebounce`.

Usage:
```tsx
import SearchInterface from '@/components/search/SearchInterface';

export default function Page() {
  return <SearchInterface />;
}
```

---

## SearchInput
- Path: `components/search/SearchInput.tsx`
- Props:
  - `value: string`
  - `onChange: ChangeEventHandler<HTMLInputElement>`
  - `placeholder?: string`
  - `disabled?: boolean`

Usage:
```tsx
import SearchInput from '@/components/search/SearchInput';

export function Example() {
  const [query, setQuery] = useState('');
  return (
    <SearchInput
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search by name, title, or location..."
    />
  );
}
```

---

## SearchResults
- Path: `components/search/SearchResults.tsx`
- Props:
  - `users: User[]`
  - `onSelect?: (user: User) => void`
  - `onLoadMore?: () => void`
  - `nextCursor?: string | null`
  - `loading?: boolean`

Usage:
```tsx
import SearchResults from '@/components/search/SearchResults';
import type { User } from '@/lib/types';

export function Example({ users, nextCursor, loading, onSelect }: {
  users: User[];
  nextCursor: string | null;
  loading: boolean;
  onSelect: (user: User) => void;
}) {
  return (
    <SearchResults
      users={users}
      nextCursor={nextCursor}
      loading={loading}
      onSelect={onSelect}
      onLoadMore={() => {/* fetch next page */}}
    />
  );
}
```

---

## UserCard
- Path: `components/search/UserCard.tsx`
- Props:
  - `user: User`
  - `onSelect?: (user: User) => void`

Usage:
```tsx
import UserCard from '@/components/search/UserCard';
import type { User } from '@/lib/types';

export function Example({ user, onClick }: { user: User; onClick: (u: User) => void; }) {
  return <UserCard user={user} onSelect={onClick} />;
}
```

---

## DiagnosticCard
- Path: `components/dashboard/DiagnosticCard.tsx`
- Type: Client component
- Props:
  - `icon: string`
  - `title: string`
  - `description: string`
  - `link: string`
  - `actionEndpoint?: string` (optional test action, GET is invoked on click)

Usage (link only):
```tsx
<DiagnosticCard
  icon="🏥"
  title="Health dashboard"
  description="Latency, uptime, and runtime diagnostics for the app tier."
  link="/diagnostics"
/>
```

Usage (with action):
```tsx
<DiagnosticCard
  icon="🔗"
  title="Okta connectivity"
  description="Validate credentials and network access to the Okta Users API."
  link="/diagnostics"
  actionEndpoint="/api/okta/ping"
/>
```

---

## HealthMetrics
- Path: `components/diagnostics/HealthMetrics.tsx`
- Props:
  - `metrics: DiagnosticMetrics | null`
- Description: Displays system health metrics returned by `useHealth`.

Usage:
```tsx
import HealthMetrics from '@/components/diagnostics/HealthMetrics';
import { useHealth } from '@/lib/hooks/useHealth';

export function Example() {
  const { metrics } = useHealth();
  return <HealthMetrics metrics={metrics} />;
}
```
