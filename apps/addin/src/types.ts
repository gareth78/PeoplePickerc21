import type { PresenceResult, User } from '@people-picker/sdk';

export interface EnhancedUser extends User {
  photo?: string | null;
  presence?: PresenceResult | null;
}

export interface PublicConfig {
  appName: string;
  orgName: string;
  orgLogoUrl?: string | null;
  featureFlags?: Record<string, boolean>;
}
