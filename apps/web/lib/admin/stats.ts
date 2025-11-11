// lib/admin/stats.ts
import prisma from '@/lib/prisma';
import { getRecentAuditLogs } from '@/lib/admin/audit';

export interface DashboardStats {
  searches: {
    today: number;
    thisWeek: number;
    total: number;
    trend: number; // Percentage change from last period
  };
  users: {
    total: number;
    activeToday: number;
    trend: number;
  };
  database: {
    totalRecords: number;
    configRecords: number;
    auditRecords: number;
    size: string;
  };
  system: {
    uptime: string;
    version: string;
    build: string;
    environment: string;
  };
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    message: string;
  };
  okta: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    message: string;
  };
  overall: 'healthy' | 'degraded' | 'down';
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  try {
    // Get audit log counts for search tracking
    const [
      totalActivity,
      todayActivity,
      weekActivity,
      lastWeekActivity
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: todayStart }
        }
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: weekStart }
        }
      }),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: lastWeekStart,
            lt: weekStart
          }
        }
      })
    ]);

    const searchTrend = lastWeekActivity > 0
      ? ((weekActivity - lastWeekActivity) / lastWeekActivity) * 100
      : 0;

    const [totalAdmins, weeklyActiveAdmins, previousWeeklyActiveAdmins, activeTodayAdmins] = await Promise.all([
      prisma.admin.count(),
      prisma.auditLog.findMany({
        where: {
          createdAt: { gte: weekStart }
        },
        distinct: ['adminEmail'],
        select: { adminEmail: true }
      }),
      prisma.auditLog.findMany({
        where: {
          createdAt: {
            gte: lastWeekStart,
            lt: weekStart
          }
        },
        distinct: ['adminEmail'],
        select: { adminEmail: true }
      }),
      prisma.auditLog.findMany({
        where: {
          createdAt: { gte: todayStart }
        },
        distinct: ['adminEmail'],
        select: { adminEmail: true }
      })
    ]);

    const userTrend = previousWeeklyActiveAdmins.length > 0
      ? ((weeklyActiveAdmins.length - previousWeeklyActiveAdmins.length) / previousWeeklyActiveAdmins.length) * 100
      : 0;

    const configCountResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM configurations
    `;
    const configCount = Number(configCountResult[0]?.count || 0);
    const auditCount = totalActivity;
    const totalRecords = configCount + auditCount;

    // System info
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const uptimeStr = `${uptimeHours}h ${uptimeMinutes}m`;

    return {
      searches: {
        today: todayActivity,
        thisWeek: weekActivity,
        total: totalActivity,
        trend: Math.round(searchTrend * 10) / 10
      },
      users: {
        total: totalAdmins,
        activeToday: activeTodayAdmins.length,
        trend: Math.round(userTrend * 10) / 10
      },
      database: {
        totalRecords,
        configRecords: configCount,
        auditRecords: auditCount,
        size: '~' + Math.round(totalRecords * 0.001) + ' MB'
      },
      system: {
        uptime: uptimeStr,
        version: '2.0.0',
        build: process.env.BUILD_NUMBER || '#155',
        environment: process.env.NODE_ENV || 'production'
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return safe defaults
    return {
      searches: { today: 0, thisWeek: 0, total: 0, trend: 0 },
      users: { total: 0, activeToday: 0, trend: 0 },
      database: { totalRecords: 0, configRecords: 0, auditRecords: 0, size: '0 MB' },
      system: {
        uptime: '0h 0m',
        version: '2.0.0',
        build: '#155',
        environment: process.env.NODE_ENV || 'production'
      }
    };
  }
}

export async function checkSystemHealth(): Promise<SystemHealth> {
  const health: SystemHealth = {
    database: { status: 'down', responseTime: 0, message: '' },
    okta: { status: 'down', responseTime: 0, message: '' },
    overall: 'down'
  };

  // Check database
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
      message: 'Connected'
    };
  } catch (error: any) {
    health.database = {
      status: 'down',
      responseTime: Date.now() - dbStart,
      message: error.message || 'Connection failed'
    };
  }

  // Check Okta (basic check)
  const oktaStart = Date.now();
  try {
    const { getOktaConfig } = await import('@/lib/config');
    const config = await getOktaConfig();
    
    if (config.orgUrl && config.apiToken) {
      health.okta = {
        status: 'healthy',
        responseTime: Date.now() - oktaStart,
        message: 'Configuration loaded'
      };
    } else {
      health.okta = {
        status: 'degraded',
        responseTime: Date.now() - oktaStart,
        message: 'Missing configuration'
      };
    }
  } catch (error: any) {
    health.okta = {
      status: 'down',
      responseTime: Date.now() - oktaStart,
      message: error.message || 'Check failed'
    };
  }

  // Determine overall health
  if (health.database.status === 'healthy' && health.okta.status === 'healthy') {
    health.overall = 'healthy';
  } else if (health.database.status === 'down' || health.okta.status === 'down') {
    health.overall = 'down';
  } else {
    health.overall = 'degraded';
  }

  return health;
}

export async function getRecentActivity(limit: number = 10) {
  try {
    const activities = await getRecentAuditLogs(limit);

    return activities.map((activity: typeof activities[0]) => ({
      id: activity.id,
      action: activity.action,
      user: activity.adminEmail || 'System',
      timestamp: activity.createdAt,
      metadata: activity.metadata
    }));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}
