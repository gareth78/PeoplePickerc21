// components/admin/ActivityFeed.tsx
'use client';

import { useEffect, useState } from 'react';
import { Activity, Settings, LogIn, Search, Database, Shield, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  metadata: any;
}

function getUserInitials(name: string): string {
  const parts = name.split(/[@.\s]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getUserColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-orange-500'
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/admin/audit?limit=10');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <LogIn className="w-4 h-4 text-blue-600" />;
      case 'SEARCH':
        return <Search className="w-4 h-4 text-purple-600" />;
      case 'UPDATE_OKTA_CONFIG':
        return <Settings className="w-4 h-4 text-orange-600" />;
      case 'DATABASE_QUERY':
        return <Database className="w-4 h-4 text-green-600" />;
      case 'TEST_CONNECTION':
        return <Shield className="w-4 h-4 text-indigo-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'LOGIN': 'Admin logged in',
      'SEARCH': 'User search performed',
      'UPDATE_OKTA_CONFIG': 'Okta configuration updated',
      'DATABASE_QUERY': 'Database query executed',
      'TEST_CONNECTION': 'Connection test performed'
    };
    return labels[action] || action.replace(/_/g, ' ').toLowerCase();
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button
          onClick={fetchActivities}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {/* User Avatar with Initials */}
              <div className={`w-10 h-10 rounded-full ${getUserColor(activity.user)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 group-hover:scale-110 transition-transform`}>
                {getUserInitials(activity.user)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getActionLabel(activity.action)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activity.user}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                <Clock className="w-3 h-3" />
                {formatTimestamp(activity.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <button
          onClick={() => window.location.href = '/admin/audit'}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          View all activity →
        </button>
      </div>
    </div>
  );
}
