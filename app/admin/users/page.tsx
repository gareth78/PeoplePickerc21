'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, UserPlus, Trash2, Shield } from 'lucide-react';

interface AdminUser {
  email: string;
  isSuperAdmin: boolean;
}

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  meta?: {
    count?: number;
    timestamp?: string;
  };
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch admin users
  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      const data: ApiResponse<AdminUser[]> = await response.json();

      if (data.ok && data.data) {
        setAdmins(data.data);
      } else {
        showNotification('error', data.error || 'Failed to load admin users');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      showNotification('error', 'Failed to load admin users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdmins();
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAdminEmail.trim()) {
      showNotification('error', 'Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      showNotification('error', 'Invalid email format');
      return;
    }

    setAddingAdmin(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newAdminEmail }),
      });

      const data: ApiResponse<{ email: string; added: boolean; message: string }> =
        await response.json();

      if (data.ok) {
        showNotification('success', data.data?.message || 'Admin added successfully');
        setNewAdminEmail('');
        setShowAddForm(false);
        await fetchAdmins();
      } else {
        showNotification('error', data.error || 'Failed to add admin');
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      showNotification('error', 'Failed to add admin');
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`Remove admin access for ${email}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data: ApiResponse<{ email: string; removed: boolean; message: string }> =
        await response.json();

      if (data.ok) {
        showNotification('success', data.data?.message || 'Admin removed successfully');
        await fetchAdmins();
      } else {
        showNotification('error', data.error || 'Failed to remove admin');
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      showNotification('error', 'Failed to remove admin');
    }
  };

  return (
    <div>
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-2">
              People Picker
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Admin Users
            </h1>
            <p className="text-gray-600 leading-relaxed max-w-3xl">
              Manage admin access for the People Picker application. Super admins are
              defined via environment variable and cannot be removed.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Add Admin
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <p className="font-medium text-sm">{notification.message}</p>
        </div>
      )}

      {/* Add Admin Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Admin</h2>
          <form onSubmit={handleAddAdmin} className="flex gap-3">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={addingAdmin}
            />
            <button
              type="submit"
              disabled={addingAdmin}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {addingAdmin ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewAdminEmail('');
              }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Admin Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Current Admins ({admins.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading admin users...</div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No admin users found. Add admins using the button above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.email} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{admin.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {admin.isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          <Shield className="w-3 h-3" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {admin.isSuperAdmin ? (
                        <span className="text-xs text-gray-400 italic">
                          Cannot be removed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRemoveAdmin(admin.email)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">About Admin Roles</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>Super Admins:</strong> Defined via SUPER_ADMINS environment
            variable and cannot be removed through the UI.
          </li>
          <li>
            <strong>Regular Admins:</strong> Can be added and removed by any admin user.
            Admin status is stored in Redis.
          </li>
          <li>
            <strong>Permissions:</strong> All admin users have full access to the admin panel
            and can manage other admins.
          </li>
        </ul>
      </div>
    </div>
  );
}
