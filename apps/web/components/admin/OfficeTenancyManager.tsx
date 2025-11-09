'use client';

import { useState, useEffect } from 'react';
import {
  Cloud,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import OfficeTenancyModal from './OfficeTenancyModal';

interface OfficeTenancy {
  id: string;
  name: string;
  tenantId: string;
  clientId: string;
  enabled: boolean;
  enablePresence: boolean;
  enablePhotos: boolean;
  enableOutOfOffice: boolean;
  enableLocalGroups: boolean;
  enableGlobalGroups: boolean;
  createdAt: string;
  createdBy: string | null;
  domains?: any[];
}

export default function OfficeTenancyManager() {
  const [tenancies, setTenancies] = useState<OfficeTenancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenancy, setEditingTenancy] = useState<OfficeTenancy | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTenancies();
  }, []);

  const loadTenancies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tenancies');
      if (response.ok) {
        const data = await response.json();
        setTenancies(data.tenancies);
      } else {
        setError('Failed to load tenancies');
      }
    } catch (err) {
      setError('Error loading tenancies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTenancy(null);
    setModalOpen(true);
  };

  const handleEdit = (tenancy: OfficeTenancy) => {
    setEditingTenancy(tenancy);
    setModalOpen(true);
  };

  const handleDelete = async (tenancy: OfficeTenancy) => {
    const domainCount = tenancy.domains?.length || 0;
    const confirmMessage =
      domainCount > 0
        ? `Are you sure you want to delete "${tenancy.name}"? This will also delete ${domainCount} associated domain(s).`
        : `Are you sure you want to delete "${tenancy.name}"?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingId(tenancy.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tenancies/${tenancy.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess(`Tenancy "${tenancy.name}" deleted successfully`);
        await loadTenancies();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete tenancy');
      }
    } catch (err) {
      setError('Error deleting tenancy');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = async (saved: boolean) => {
    setModalOpen(false);
    setEditingTenancy(null);
    if (saved) {
      await loadTenancies();
      setSuccess(
        editingTenancy ? 'Tenancy updated successfully' : 'Tenancy created successfully'
      );
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const FeatureBadge = ({ enabled, label }: { enabled: boolean; label: string }) => (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        enabled
          ? 'bg-green-100 text-green-800 border border-green-300'
          : 'bg-gray-100 text-gray-500 border border-gray-300'
      }`}
    >
      {enabled ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
      {label}
    </span>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Cloud className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Office 365 Tenancies</h2>
              <p className="text-sm text-gray-600">Manage multiple Office 365 tenants</p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tenant</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Notifications */}
        {error && (
          <div className="mb-4 flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : tenancies.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Cloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants configured yet</h3>
            <p className="text-gray-500 mb-6">
              Add your first Office 365 tenant to enable multi-tenancy support
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Tenant</span>
            </button>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature Flags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domains
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenancies.map((tenancy) => (
                  <tr key={tenancy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tenancy.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-mono">{tenancy.tenantId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenancy.enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tenancy.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <FeatureBadge enabled={tenancy.enablePresence} label="Presence" />
                        <FeatureBadge enabled={tenancy.enablePhotos} label="Photos" />
                        <FeatureBadge enabled={tenancy.enableOutOfOffice} label="OOO" />
                        <FeatureBadge enabled={tenancy.enableLocalGroups} label="Local Groups" />
                        <FeatureBadge enabled={tenancy.enableGlobalGroups} label="Global Groups" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tenancy.domains?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(tenancy)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tenancy)}
                          disabled={deletingId === tenancy.id}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === tenancy.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <OfficeTenancyModal
          tenancy={editingTenancy}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
