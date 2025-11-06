'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users,
  FileText,
  Shield,
  Activity,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface DashboardStats {
  totalAdmins: number;
  totalAuditLogs: number;
  recentLogins: number;
  emergencyAccesses: number;
}

interface RecentActivity {
  id: string;
  action: string;
  adminEmail: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity/recent'),
      ]);

      if (statsRes.ok && activityRes.ok) {
        const statsData = await statsRes.json();
        const activityData = await activityRes.json();
        setStats(statsData);
        setRecentActivity(activityData.activities);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActionColor = (action: string) => {
    if (action.includes('BREAK_GLASS')) return 'text-red-600 bg-red-50';
    if (action.includes('LOGIN')) return 'text-green-600 bg-green-50';
    if (action.includes('DELETE')) return 'text-orange-600 bg-orange-50';
    if (action.includes('CREATE')) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getActionLabel = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to the admin control panel
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Admins */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats?.totalAdmins || 0}
              </h3>
              <p className="text-sm text-gray-600">Total Administrators</p>
            </div>

            {/* Total Audit Logs */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 rounded-lg p-3">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats?.totalAuditLogs || 0}
              </h3>
              <p className="text-sm text-gray-600">Audit Log Entries</p>
            </div>

            {/* Recent Logins (last 24h) */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats?.recentLogins || 0}
              </h3>
              <p className="text-sm text-gray-600">Logins (24h)</p>
            </div>

            {/* Emergency Accesses */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-red-100 rounded-lg p-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                {(stats?.emergencyAccesses || 0) > 0 && (
                  <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-1 rounded">
                    Alert
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats?.emergencyAccesses || 0}
              </h3>
              <p className="text-sm text-gray-600">Emergency Access (30d)</p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Loading activity...
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No recent activity
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(
                          activity.action
                        )}`}
                      >
                        {getActionLabel(activity.action)}
                      </span>
                      <span className="text-sm text-gray-900">
                        {activity.adminEmail}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
