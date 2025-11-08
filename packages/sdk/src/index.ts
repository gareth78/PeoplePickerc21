type QueryValue = string | number | boolean | null | undefined;

const DEFAULT_TIMEOUT_MS = 10_000;

const baseUrlFromEnv =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PEOPLEPICKER_BASE_URL) ||
  '';

const trimTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, -1) : value;

const trimLeadingSlash = (value: string) =>
  value.startsWith('/') ? value.slice(1) : value;

const BASE_URL = trimTrailingSlash(baseUrlFromEnv);

export class PeoplePickerError extends Error {
  override name = 'PeoplePickerError';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class PeoplePickerTimeoutError extends PeoplePickerError {
  override name = 'PeoplePickerTimeoutError';
  constructor(message = 'Request timed out', options?: ErrorOptions) {
    super(message, options);
  }
}

export class PeoplePickerHTTPError extends PeoplePickerError {
  override name = 'PeoplePickerHTTPError';
  readonly status: number;
  readonly statusText: string;

  constructor(status: number, statusText: string, body?: unknown) {
    super(`Request failed with status ${status} ${statusText}`, { cause: body });
    this.status = status;
    this.statusText = statusText;
  }
}

interface RequestOptions extends Omit<RequestInit, 'signal'> {
  query?: Record<string, QueryValue>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T | null;
  error?: string | null;
  meta?: Record<string, unknown>;
}

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

export interface UsersResult {
  users: User[];
  nextCursor: string | null;
  totalCount: number;
}

export interface PresenceResult {
  activity: string | null;
  availability: string | null;
  fetchedAt: string | null;
  cached: boolean;
  ttl: number | null;
}

export interface OOOResult {
  isOOO: boolean;
  message: string | null;
  startTime: string | null;
  endTime: string | null;
}

interface PresenceResponse {
  activity: string | null;
  availability: string | null;
  fetchedAt?: string | null;
  ttl?: number | null;
  cached?: boolean;
}

interface OOOResponse {
  isOOO: boolean;
  message: string | null;
  startTime: string | null;
  endTime: string | null;
}

const toUrl = (path: string, query?: Record<string, QueryValue>): string => {
  const normalizedPath = `/${trimLeadingSlash(path)}`;
  const base = BASE_URL ? `${BASE_URL}${normalizedPath}` : normalizedPath;

  if (!query) {
    return base;
  }

  const params = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    params.append(key, String(rawValue));
  }

  const suffix = params.toString();
  return suffix ? `${base}?${suffix}` : base;
};

const resolveHeaders = (init?: RequestOptions['headers']) => {
  if (!init) {
    return new Headers({
      Accept: 'application/json',
    });
  }

  if (init instanceof Headers) {
    if (!init.has('Accept')) {
      init.set('Accept', 'application/json');
    }
    return init;
  }

  const headers = new Headers(init);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  return headers;
};

const request = async <T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { query, timeoutMs = DEFAULT_TIMEOUT_MS, signal, headers, ...rest } = options;
  const url = toUrl(path, query);
  const controller = new AbortController();
  const timeoutId =
    typeof timeoutMs === 'number' && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

  let abortListener: (() => void) | null = null;
  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      abortListener = () => controller.abort(signal.reason);
      signal.addEventListener('abort', abortListener, { once: true });
    }
  }

  const finalHeaders = resolveHeaders(headers);
  const method = rest.method ?? 'GET';
  const body = rest.body;

  if (body && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
    if (!finalHeaders.has('Content-Type')) {
      finalHeaders.set('Content-Type', 'application/json');
    }
  }

  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...rest,
      method,
      headers: finalHeaders,
      body: body && !(body instanceof FormData) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)
        ? JSON.stringify(body)
        : body,
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorBody: unknown = null;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      throw new PeoplePickerHTTPError(response.status, response.statusText, errorBody);
    }

    // Attempt to parse JSON payload
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw new PeoplePickerError('Failed to parse JSON response', { cause: error });
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new PeoplePickerTimeoutError();
    }

    if ((error as Error).name === 'AbortError') {
      throw new PeoplePickerTimeoutError();
    }

    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (abortListener && signal) {
      signal.removeEventListener('abort', abortListener);
    }
  }
};

const users = {
  async search(
    q: string,
    opts: {
      myOrg?: boolean;
      cursor?: string;
      timeoutMs?: number;
      signal?: AbortSignal;
    } = {}
  ): Promise<UsersResult> {
    if (!q || q.trim().length === 0) {
      throw new PeoplePickerError('Query is required');
    }

    const payload = await request<ApiResponse<UsersResult>>('/api/okta/users', {
      query: {
        q: q.trim(),
        cursor: opts.cursor,
        myOrg: opts.myOrg ? '1' : undefined,
      },
      timeoutMs: opts.timeoutMs,
      signal: opts.signal,
    });

    if (!payload?.ok || !payload.data) {
      throw new PeoplePickerError(payload?.error || 'Search request failed');
    }

    return payload.data;
  },
};

const presence = {
  async get(
    email: string,
    opts: {
      noCache?: boolean;
      ttl?: number;
      timeoutMs?: number;
      signal?: AbortSignal;
    } = {}
  ): Promise<PresenceResult | null> {
    if (!email || email.trim().length === 0) {
      throw new PeoplePickerError('Email is required for presence lookup');
    }

    const payload = await request<ApiResponse<PresenceResponse>>(
      `/api/graph/presence/${encodeURIComponent(email)}`,
      {
        query: {
          noCache: opts.noCache ? 1 : undefined,
          ttl: typeof opts.ttl === 'number' ? opts.ttl : undefined,
        },
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      }
    );

    if (!payload?.ok || !payload.data) {
      return null;
    }

    return {
      activity: payload.data.activity ?? null,
      availability: payload.data.availability ?? null,
      fetchedAt: payload.data.fetchedAt ?? null,
      cached: Boolean(payload.data.cached),
      ttl: typeof payload.data.ttl === 'number' ? payload.data.ttl : null,
    };
  },
};

const photo = {
  async get(
    email: string,
    opts: {
      timeoutMs?: number;
      signal?: AbortSignal;
    } = {}
  ): Promise<string | null> {
    if (!email || email.trim().length === 0) {
      throw new PeoplePickerError('Email is required for photo lookup');
    }

    const payload = await request<{ photo: string | null }>(
      `/api/graph/photo/${encodeURIComponent(email)}`,
      {
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      }
    );

    return payload?.photo ?? null;
  },
};

const ooo = {
  async get(
    email: string,
    opts: {
      timeoutMs?: number;
      signal?: AbortSignal;
    } = {}
  ): Promise<OOOResult | null> {
    if (!email || email.trim().length === 0) {
      throw new PeoplePickerError('Email is required for OOO lookup');
    }

    const payload = await request<ApiResponse<OOOResponse>>(
      `/api/graph/ooo/${encodeURIComponent(email)}`,
      {
        timeoutMs: opts.timeoutMs,
        signal: opts.signal,
      }
    );

    if (!payload?.ok || !payload.data) {
      return null;
    }

    return {
      isOOO: payload.data.isOOO,
      message: payload.data.message,
      startTime: payload.data.startTime,
      endTime: payload.data.endTime,
    };
  },
};

export const sdk = {
  users,
  presence,
  photo,
  ooo,
  get baseUrl() {
    return BASE_URL;
  },
};

export type PeoplePickerSdk = typeof sdk;
