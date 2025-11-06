'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FileText, Filter, Calendar, User, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  adminEmail: string;
  targetEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes('BREAK_GLASS')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('FAILED')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (action === 'LOGIN') return 'bg-green-100 text-green-700 border-green-200';
    if (action === 'LOGOUT') return 'bg-gray-100 text-gray-700 border-gray-200';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('CREATE')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (action.includes('VIEW')) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getActionLabel = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const uniqueActions = ['all', ...Array.from(new Set(logs.map((log) => log.action)))];

  const filteredLogs =
    filterAction === 'all'
      ? logs
      : logs.filter((log) => log.action === filterAction);

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-2">
            View all administrative actions and security events
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action === 'all' ? 'All Actions' : getActionLabel(action)}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">
              {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center text-sm font-semibold text-gray-700">
              <FileText className="w-5 h-5 mr-2" />
              Security Audit Trail
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium border ${getActionColor(
                            log.action
                          )}`}
                        >
                          {getActionLabel(log.action)}
                        </span>
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-1" />
                          <span className="font-medium">{log.adminEmail}</span>
                        </div>
                        {log.targetEmail && (
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-1">→</span>
                            {log.targetEmail}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(log.createdAt)}
                        </div>
                        {log.ipAddress && (
                          <div className="flex items-center">
                            <Activity className="w-4 h-4 mr-1" />
                            {log.ipAddress}
                          </div>
                        )}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                            View metadata
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
