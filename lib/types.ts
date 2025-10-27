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
}

export interface OktaUser {
  id: string;
  status: string;
  profile: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email: string;
    title?: string;
    department?: string;
    city?: string;
    officeLocation?: string;
    mobilePhone?: string;
  };
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
  meta?: {
    count?: number;
    latency?: number;
    cached?: boolean;
    timestamp?: string;
  };
}

export interface HealthStatus {
  ok: boolean;
  status: number;
  timestamp: string;
  environment: string;
  nodeVersion: string;
  cacheType: string;
  uptime: number;
}

export interface CacheStats {
  type: string;
  ttl: number;
  entries: number;
  hitRate?: number;
}

export interface DiagnosticMetrics {
  health: HealthStatus;
  cache: CacheStats;
  okta: {
    connected: boolean;
    latency: number;
    error?: string;
  };
}

export interface CacheInterface {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  clear(): Promise<void>;
  stats(): Promise<CacheStats>;
}
