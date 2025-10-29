# Utilities and Types

## typedFetch
- Path: `lib/fetcher.ts`
- Signature:
```ts
async function typedFetch<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>>
```
- Description: A small wrapper around `fetch` that returns a consistent `ApiResponse<T>` including latency and timestamp metadata when successful. On HTTP errors it returns `{ ok: false, error, meta: { latency } }`.

Example:
```ts
import { typedFetch } from '@/lib/fetcher';

type Health = { ok: boolean; status: number; environment: string; nodeVersion: string; uptime: number; timestamp: string };
const res = await typedFetch<Health>('/api/health', { cache: 'no-store' });
if (res.ok) {
  console.log('Uptime:', res.data.uptime);
}
```

---

## Okta client (`lib/okta.ts`)
Environment variables (required):
- `okta-org-url`
- `okta-api-token`

Shared behavior:
- Exponential backoff on rate limits (HTTP 429), up to 3 retries.
- Defensive timeouts (10s) via `AbortController`.
- User objects are normalized to the internal `User` type and sorted by `displayName`.

### `searchUsers(query: string, limit = 100, cursor?: string): Promise<SearchResult>`
- `q` parameter for single-term searches, or `search` filter for multi-term prefix matching across firstName/lastName/email.
- Returns `{ users, nextCursor, totalCount }`.

### `getUserById(id: string): Promise<User>`
- Fetches a single Okta user by ID and normalizes to `User`.

### `searchUserByEmail(email: string): Promise<User | null>`
- Finds a single user by email. Returns `null` when not found.

---

## Redis cache (`lib/redis.ts`)
Environment variables (optional):
- `redis-connection-string` or `REDIS_CONNECTION_STRING`

If not configured, caching is disabled and methods become no-ops (or return defaults). A singleton `ioredis` client is used.

### Constants
- `TTL`: `{ PHOTO: 86400, PROFILE: 14400, SEARCH: 3600, PRESENCE: 300 }`

### Client
- `getRedisClient(): Redis | null`
  - Creates and caches the Redis client. Logs connection status and errors.

### Stats
- `getCacheStats(): Promise<CacheStats>`
  - Returns `{ connected, keys, memoryUsed, hits, misses, hitRate }`.

### Operations
- `cacheGet<T>(key: string): Promise<T | null>`
- `cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<boolean>`
- `cacheDelete(key: string): Promise<boolean>`
- `cacheClear(): Promise<boolean>`

---

## Types (`lib/types.ts`)
```ts
export interface User {
  id: string;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  title: string | null;
  department: string | null;
  officeLocation: string | null;
  mobilePhone: string | null;
  avatarUrl: string | null;
  managerEmail: string | null;
}

export interface SearchResult {
  users: User[];
  nextCursor: string | null;
  totalCount: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  meta?: { count?: number; latency?: number; timestamp?: string };
}

export interface HealthStatus {
  ok: boolean;
  status: number;
  timestamp: string;
  environment: string;
  nodeVersion: string;
  uptime: number;
}

export interface DiagnosticMetrics {
  health: HealthStatus;
  okta: { connected: boolean; latency: number; error?: string };
}
```
