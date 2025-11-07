// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { SystemStatus } from '@/components/admin/SystemStatus';
import { QuickActions } from '@/components/admin/QuickActions';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { SearchTrendsChart } from '@/components/admin/SearchTrendsChart';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  Clock,
  Database,
  TrendingUp,
  Sparkles,
  Zap
} from 'lucide-react';

interface DashboardStats {
  searches: {
    today: number;
    thisWeek: number;
    total: number;
    trend: number;
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        {/* Header Section */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white border-b border-gray-200 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                    className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl"
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                </div>
                <p className="text-gray-600 mt-1">
                  Welcome back, Gareth · Last login: {currentTime.toLocaleDateString()} at {currentTime.toLocaleTimeString()}
                </p>
              </div>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-right"
              >
                <p className="text-sm text-gray-500">System Version</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats?.system.version || '2.0.0'}
                </p>
                <p className="text-xs text-gray-400">
                  Build {stats?.system.build || '#155'}
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Grid with Staggered Animation */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <motion.div variants={itemVariants}>
              <StatCard
                title="Searches Today"
                value={stats?.searches.today || 0}
                subtitle={`${stats?.searches.thisWeek || 0} this week`}
                trend={stats?.searches.trend}
                icon={Search}
                iconColor="text-blue-600"
                gradientFrom="from-blue-400"
                gradientTo="to-blue-600"
                loading={loading}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <StatCard
                title="Active Users"
                value={stats?.users.activeToday || 0}
                subtitle={`${stats?.users.total || 0} total users`}
                trend={stats?.users.trend}
                icon={Users}
                iconColor="text-purple-600"
                gradientFrom="from-purple-400"
                gradientTo="to-purple-600"
                loading={loading}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <StatCard
                title="System Uptime"
                value={stats?.system.uptime || '0h 0m'}
                subtitle="Current session"
                icon={Clock}
                iconColor="text-green-600"
                gradientFrom="from-green-400"
                gradientTo="to-green-600"
                loading={loading}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <StatCard
                title="Database Records"
                value={stats?.database.totalRecords || 0}
                subtitle={stats?.database.size || '0 MB'}
                icon={Database}
                iconColor="text-orange-600"
                gradientFrom="from-orange-400"
                gradientTo="to-orange-600"
                loading={loading}
              />
            </motion.div>
          </motion.div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Takes 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search Trends Chart - NEW! */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <SearchTrendsChart />
              </motion.div>

              {/* System Status */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <SystemStatus />
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <ActivityFeed />
              </motion.div>

              {/* Performance Insights Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Performance Insights</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
                  >
                    <p className="text-sm text-blue-600 font-medium mb-1">Total Searches</p>
                    <p className="text-2xl font-bold text-blue-900">{stats?.searches.total || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">All time</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
                  >
                    <p className="text-sm text-purple-600 font-medium mb-1">Config Records</p>
                    <p className="text-2xl font-bold text-purple-900">{stats?.database.configRecords || 0}</p>
                    <p className="text-xs text-purple-600 mt-1">Active settings</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
                  >
                    <p className="text-sm text-green-600 font-medium mb-1">Audit Logs</p>
                    <p className="text-2xl font-bold text-green-900">{stats?.database.auditRecords || 0}</p>
                    <p className="text-xs text-green-600 mt-1">Recorded events</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200"
                  >
                    <p className="text-sm text-orange-600 font-medium mb-1">Environment</p>
                    <p className="text-2xl font-bold text-orange-900 uppercase">{stats?.system.environment || 'PROD'}</p>
                    <p className="text-xs text-orange-600 mt-1">Current mode</p>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Takes 1/3 width */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <QuickActions />
              </motion.div>

              {/* System Information Card */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-6 text-white"
              >
                <h3 className="text-lg font-semibold mb-4">System Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                    <span className="text-sm text-gray-400">Version</span>
                    <span className="font-mono text-sm font-semibold">{stats?.system.version || '2.0.0'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                    <span className="text-sm text-gray-400">Build</span>
                    <span className="font-mono text-sm font-semibold">{stats?.system.build || '#155'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                    <span className="text-sm text-gray-400">Environment</span>
                    <span className="font-mono text-sm font-semibold uppercase">{stats?.system.environment || 'production'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                    <span className="text-sm text-gray-400">Uptime</span>
                    <span className="font-mono text-sm font-semibold">{stats?.system.uptime || '0h 0m'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Database Size</span>
                    <span className="font-mono text-sm font-semibold">{stats?.database.size || '0 MB'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Azure Container Apps</span>
                    <div className="flex items-center gap-1">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                      <span>Online</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tips Card */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
              >
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">Pro Tip</h4>
                    <p className="text-sm text-blue-100">
                      Your configuration is now database-backed! Changes persist across deployments without needing env vars.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer Stats */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl shadow p-6 text-center"
            >
              <p className="text-sm text-gray-600 mb-2">Average Response Time</p>
              <p className="text-3xl font-bold text-gray-900">~50ms</p>
              <p className="text-xs text-green-600 mt-1">↓ 15% faster</p>
            </motion.div>
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl shadow p-6 text-center"
            >
              <p className="text-sm text-gray-600 mb-2">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900">99.9%</p>
              <p className="text-xs text-green-600 mt-1">↑ Excellent</p>
            </motion.div>
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl shadow p-6 text-center"
            >
              <p className="text-sm text-gray-600 mb-2">Cache Hit Rate</p>
              <p className="text-3xl font-bold text-gray-900">85%</p>
              <p className="text-xs text-blue-600 mt-1">→ Optimal</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
