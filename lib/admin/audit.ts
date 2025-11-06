import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

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
  | 'UNAUTHORIZED_ACCESS';

interface AuditLogParams {
  action: AuditAction;
  adminEmail: string;
  targetEmail?: string;
  metadata?: Record<string, any>;
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
        action,
        adminEmail: adminEmail.toLowerCase(),
        targetEmail: targetEmail?.toLowerCase(),
        ipAddress,
        userAgent,
        metadata: metadata || {},
      },
    });

    console.log(`[AUDIT] ${action} by ${adminEmail}${targetEmail ? ` on ${targetEmail}` : ''}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the application
  }
}

/**
 * Get recent audit logs
 */
export async function getRecentAuditLogs(limit: number = 100) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get audit logs for a specific admin
 */
export async function getAdminAuditLogs(adminEmail: string, limit: number = 50) {
  return prisma.auditLog.findMany({
    where: { adminEmail: adminEmail.toLowerCase() },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get audit logs by action type
 */
export async function getAuditLogsByAction(action: AuditAction, limit: number = 50) {
  return prisma.auditLog.findMany({
    where: { action },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
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
  logs.forEach((log) => {
    stats[log.action] = (stats[log.action] || 0) + 1;
  });

  return stats;
}
