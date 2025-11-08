/* eslint-disable @typescript-eslint/no-explicit-any */
export interface User {
  id: string;
  displayName: string;
  email: string;
  title: string | null;
  department: string | null;
  organization: string | null;
  officeLocation?: string | null;
}

export interface UsersResult {
  users: User[];
  nextCursor: string | null;
  totalCount: number;
}

export interface PresenceResult {
  activity: string | null;
  availability: string | null;
  fetchedAt: string | null;
}

export interface OOOResult {
  isOOO: boolean;
  message: string | null;
  startTime: string | null;
  endTime: string | null;
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T | null;
  error?: string | null;
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT = 10_000;
let memoizedBaseUrl: string | undefined;

function resolveBaseUrl(): string {
  if (memoizedBaseUrl !== undefined) {
    return memoizedBaseUrl;
  }

  const fromProcess = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_PEOPLEPICKER_BASE_URL : undefined;
  if (fromProcess) {
    memoizedBaseUrl = fromProcess;
    return fromProcess;
  }

  const fromImportMeta = typeof import.meta !== 'undefined' ? (import.meta as any)?.env?.NEXT_PUBLIC_PEOPLEPICKER_BASE_URL : undefined;
  if (fromImportMeta) {
    memoizedBaseUrl = fromImportMeta;
    return fromImportMeta;
  }

  const fromGlobal = typeof globalThis !== 'undefined' ? (globalThis as any)?.NEXT_PUBLIC_PEOPLEPICKER_BASE_URL : undefined;
  memoizedBaseUrl = typeof fromGlobal === 'string' ? fromGlobal : '';
  return memoizedBaseUrl ?? '';
}

export function getBaseUrl(): string {
  return resolveBaseUrl();
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = resolveBaseUrl();
  const normalizedBase = base ? base.replace(/\/$/, '') : '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}` || normalizedPath;
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT, signal, ...rest } = options;
  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  const fetchInit: RequestInit = {
    credentials: 'include',
    ...rest,
    signal: controller.signal
  };

  const timeout = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetch(buildUrl(path), fetchInit);
    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
    return (await response.json()) as T;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function withErrorBoundary<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return promise.catch(() => fallback);
}

async function searchUsers(q: string, opts?: { myOrg?: boolean; cursor?: string }): Promise<UsersResult> {
  if (!q || q.trim().length === 0) {
    throw new Error('Search query is required');
  }

  const params = new URLSearchParams({ q: q.trim() });
  if (opts?.cursor) {
    params.set('cursor', opts.cursor);
  }
  if (opts?.myOrg) {
    params.set('myOrg', '1');
  }

  const payload = await requestJson<ApiResponse<UsersResult>>(`/api/okta/users?${params.toString()}`, {
    timeoutMs: 15_000
  });

  if (!payload.ok || !payload.data) {
    throw new Error(payload.error ?? 'Search failed');
  }

  return payload.data;
}

async function getPresence(email: string, opts?: { noCache?: boolean; ttl?: number }): Promise<PresenceResult> {
  const params = new URLSearchParams();
  if (opts?.noCache) {
    params.set('noCache', '1');
  }
  if (typeof opts?.ttl === 'number') {
    params.set('ttl', String(opts.ttl));
  }

  const payload = await withErrorBoundary(
    requestJson<ApiResponse<{ activity: string | null; availability: string | null; fetchedAt?: string }>>(
      `/api/graph/presence/${encodeURIComponent(email)}${params.toString() ? `?${params.toString()}` : ''}`,
      {
        timeoutMs: 12_000
      }
    ),
    { ok: false, data: null }
  );

  if (!payload || !payload.ok || !payload.data) {
    return {
      activity: null,
      availability: null,
      fetchedAt: null
    };
  }

  return {
    activity: payload.data.activity ?? null,
    availability: payload.data.availability ?? null,
    fetchedAt: payload.data.fetchedAt ?? null
  };
}

async function getPhoto(email: string): Promise<string | null> {
  const payload = await withErrorBoundary(
    requestJson<{ photo: string | null }>(`/api/graph/photo/${encodeURIComponent(email)}`, {
      timeoutMs: 20_000
    }),
    { photo: null }
  );
  return payload.photo ?? null;
}

async function getOOO(email: string): Promise<OOOResult | null> {
  const payload = await withErrorBoundary(
    requestJson<ApiResponse<OOOResult>>(`/api/graph/ooo/${encodeURIComponent(email)}`, {
      timeoutMs: 12_000
    }),
    { ok: false, data: null }
  );

  if (!payload || !payload.ok) {
    return null;
  }

  return payload.data ?? null;
}

export const users = {
  search: searchUsers
};

export const presence = {
  get: getPresence
};

export const photo = {
  get: getPhoto
};

export const ooo = {
  get: getOOO
};

export default {
  users,
  presence,
  photo,
  ooo,
  getBaseUrl
};
