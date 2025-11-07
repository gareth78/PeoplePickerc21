/**
 * Configuration Management System
 * 
 * Provides a centralized way to manage application configuration with:
 * - Database-backed config (preferred)
 * - Environment variable fallback
 * - Optional encryption for sensitive values
 * - Audit trail for config changes
 */

import prisma from './prisma';
import { createAuditLog } from './admin/audit';

// Simple encryption/decryption using base64 + XOR
// For production, consider using a proper encryption library
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || 'default-encryption-key-change-me';

function encrypt(text: string): string {
  const key = Buffer.from(ENCRYPTION_KEY);
  const input = Buffer.from(text);
  const output = Buffer.alloc(input.length);
  
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] ^ key[i % key.length];
  }
  
  return output.toString('base64');
}

function decrypt(encoded: string): string {
  const key = Buffer.from(ENCRYPTION_KEY);
  const input = Buffer.from(encoded, 'base64');
  const output = Buffer.alloc(input.length);
  
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] ^ key[i % key.length];
  }
  
  return output.toString();
}

// ============================================================================
// Okta Configuration
// ============================================================================

export interface OktaConfig {
  orgUrl: string;
  apiToken: string;
}

/**
 * Get Okta configuration from database or environment variables
 * Priority: Database > Environment Variables
 */
export async function getOktaConfig(): Promise<OktaConfig> {
  try {
    // Try to get from database first
    const configs = await prisma.configuration.findMany({
      where: {
        category: 'okta',
        enabled: true,
      },
    });

    if (configs.length > 0) {
      const orgUrlConfig = configs.find(c => c.key === 'okta_org_url');
      const apiTokenConfig = configs.find(c => c.key === 'okta_api_token');

      if (orgUrlConfig && apiTokenConfig) {
        return {
          orgUrl: orgUrlConfig.value,
          apiToken: apiTokenConfig.encrypted 
            ? decrypt(apiTokenConfig.value)
            : apiTokenConfig.value,
        };
      }
    }
  } catch (error) {
    console.error('[CONFIG] Failed to read Okta config from database:', error);
  }

  // Fallback to environment variables
  // Support both naming conventions: OKTA_ORG_URL and okta-org-url
  const orgUrl = 
    process.env.OKTA_ORG_URL || 
    process.env['okta-org-url'] ||
    process.env['OKTA-ORG-URL'];
    
  const apiToken = 
    process.env.OKTA_API_TOKEN || 
    process.env['okta-api-token'] ||
    process.env['OKTA-API-TOKEN'];

  if (!orgUrl || !apiToken) {
    throw new Error('Okta configuration not found in database or environment variables');
  }

  return {
    orgUrl,
    apiToken,
  };
}

/**
 * Save Okta configuration to database
 */
export async function saveOktaConfig(
  config: OktaConfig,
  adminEmail: string
): Promise<void> {
  const encryptedToken = encrypt(config.apiToken);

  // Upsert org URL
  await prisma.configuration.upsert({
    where: { key: 'okta_org_url' },
    update: {
      value: config.orgUrl,
      updatedAt: new Date(),
      createdBy: adminEmail,
    },
    create: {
      key: 'okta_org_url',
      value: config.orgUrl,
      category: 'okta',
      encrypted: false,
      enabled: true,
      createdBy: adminEmail,
    },
  });

  // Upsert API token
  await prisma.configuration.upsert({
    where: { key: 'okta_api_token' },
    update: {
      value: encryptedToken,
      updatedAt: new Date(),
      createdBy: adminEmail,
    },
    create: {
      key: 'okta_api_token',
      value: encryptedToken,
      category: 'okta',
      encrypted: true,
      enabled: true,
      createdBy: adminEmail,
    },
  });

  // Create audit log
  await createAuditLog({
    action: 'UPDATE_OKTA_CONFIG',
    email: adminEmail,
    details: `Updated Okta configuration (orgUrl: ${config.orgUrl})`,
    metadata: {
      orgUrl: config.orgUrl,
      timestamp: new Date().toISOString(),
    },
  });

  console.log('[CONFIG] Okta configuration saved to database by', adminEmail);
}

/**
 * Test Okta configuration by attempting a connection
 */
export async function testOktaConfig(config: OktaConfig): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${config.orgUrl}/api/v1/users?limit=1`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `SSWS ${config.apiToken}`,
      },
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Successfully connected to Okta',
      };
    } else {
      return {
        success: false,
        message: `Okta API returned ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// General Configuration Helpers
// ============================================================================

/**
 * Get a single configuration value by key
 */
export async function getConfigValue(key: string): Promise<string | null> {
  try {
    const config = await prisma.configuration.findUnique({
      where: { key, enabled: true },
    });

    if (!config) {
      return null;
    }

    return config.encrypted ? decrypt(config.value) : config.value;
  } catch (error) {
    console.error(`[CONFIG] Failed to get config value for key "${key}":`, error);
    return null;
  }
}

/**
 * Set a configuration value
 */
export async function setConfigValue(
  key: string,
  value: string,
  category: string,
  encrypted: boolean,
  adminEmail: string
): Promise<void> {
  const finalValue = encrypted ? encrypt(value) : value;

  await prisma.configuration.upsert({
    where: { key },
    update: {
      value: finalValue,
      updatedAt: new Date(),
      createdBy: adminEmail,
    },
    create: {
      key,
      value: finalValue,
      category,
      encrypted,
      enabled: true,
      createdBy: adminEmail,
    },
  });
}
