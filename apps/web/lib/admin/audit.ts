import { randomUUID } from 'crypto';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'BREAK_GLASS_ACCESS'
  | 'BREAK_GLASS_LOGIN'
  | 'CREATE_ADMIN'
  | 'DELETE_ADMIN'
  | 'VIEW_ADMINS'
  | 'VIEW_AUDIT_LOGS'
  | 'FAILED_LOGIN'
  | 'UNAUTHORIZED_ACCESS'
  | 'UPDATE_OKTA_CONFIG'
  | 'CREATE_TENANCY'
  | 'UPDATE_TENANCY'
  | 'DELETE_TENANCY'
  | 'VIEW_TENANCIES'
  | 'CREATE_DOMAIN'
  | 'UPDATE_DOMAIN'
  | 'DELETE_DOMAIN'
  | 'VIEW_DOMAINS'
  | 'REORDER_SMTP_DOMAINS';

interface AuditLogRecord {
  id: string;
  action: AuditAction;
  adminEmail: string;
  targetEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: Date;
}

interface AuditLogParams {
  action: AuditAction;
  adminEmail: string;
  targetEmail?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const { action, adminEmail, targetEmail, metadata } = params;

  try {
    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await prisma.auditLog.create({
      data: {
        id: randomUUID(),
        action,
        adminEmail: adminEmail.toLowerCase(),
        targetEmail: targetEmail?.toLowerCase(),
        ipAddress,
        userAgent,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    console.log(`[AUDIT] ${action} by ${adminEmail}${targetEmail ? ` on ${targetEmail}` : ''}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the application
  }
}

/**
 * Parse metadata string to object
 */
function parseMetadata(metadata: string | null): Record<string, unknown> | null {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata);
  } catch (error) {
    console.error('Failed to parse audit log metadata:', error);
    return null;
  }
}

export type AuditLogWithParsedMetadata = Omit<AuditLogRecord, 'metadata'> & {
  metadata: Record<string, unknown> | null;
};

const withParsedMetadata = (log: AuditLogRecord): AuditLogWithParsedMetadata => ({
  ...log,
  metadata: parseMetadata(log.metadata),
});

/**
 * Get recent audit logs
 */
export async function getRecentAuditLogs(
  limit: number = 100,
): Promise<AuditLogWithParsedMetadata[]> {
  const logs: AuditLogRecord[] = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return logs.map(withParsedMetadata);
}

/**
 * Get audit logs for a specific admin
 */
export async function getAdminAuditLogs(
  adminEmail: string,
  limit: number = 50,
): Promise<AuditLogWithParsedMetadata[]> {
  const logs: AuditLogRecord[] = await prisma.auditLog.findMany({
    where: { adminEmail: adminEmail.toLowerCase() },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return logs.map(withParsedMetadata);
}

/**
 * Get audit logs by action type
 */
export async function getAuditLogsByAction(
  action: AuditAction,
  limit: number = 50,
): Promise<AuditLogWithParsedMetadata[]> {
  const logs: AuditLogRecord[] = await prisma.auditLog.findMany({
    where: { action },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return logs.map(withParsedMetadata);
}

/**
 * Count audit logs by action in the last N days
 */
export async function getAuditStats(days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: since,
      },
    },
    select: {
      action: true,
    },
  });

  const stats: Record<string, number> = {};
  for (const log of logs) {
    const action = log.action as AuditAction;
    stats[action] = (stats[action] || 0) + 1;
  }

  return stats;
}
