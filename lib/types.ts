import type { CacheStats } from '@/lib/cache';

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
    managerEmail?: string;
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

export interface DiagnosticMetrics {
  health: HealthStatus;
  cache: CacheStats;
  okta: {
    connected: boolean;
    latency: number;
    error?: string;
  };
}
