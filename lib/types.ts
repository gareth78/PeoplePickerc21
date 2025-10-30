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
  // Additional profile fields
  login: string | null;
  secondaryEmail: string | null;
  primaryPhone: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  countryCode: string | null;
  division: string | null;
  organization: string | null;
  costCenter: string | null;
  employeeNumber: string | null;
  preferredLanguage: string | null;
  locale: string | null;
  timezone: string | null;
  manager: string | null;
  userType: string | null;
  employeeType: string | null;
  countryName: string | null;
  cn: string | null;
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
    ManagerEmail?: string; // Custom Okta attribute (capitalized)
    // Additional profile fields
    login?: string;
    secondaryEmail?: string;
    primaryPhone?: string;
    streetAddress?: string;
    state?: string;
    zipCode?: string;
    countryCode?: string;
    division?: string;
    organization?: string;
    costCenter?: string;
    employeeNumber?: string;
    preferredLanguage?: string;
    locale?: string;
    timezone?: string;
    manager?: string;
    Manager?: string; // Custom Okta attribute (capitalized)
    userType?: string;
    employeeType?: string;
    countryName?: string;
    cn?: string;
    [key: string]: any; // Allow for custom Okta attributes
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
    timestamp?: string;
  };
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
  okta: {
    connected: boolean;
    latency: number;
    error?: string;
  };
}
