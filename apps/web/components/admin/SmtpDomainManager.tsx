'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import SmtpDomainModal from './SmtpDomainModal';

interface OfficeTenancy {
  id: string;
  name: string;
  tenantId: string;
  enabled: boolean;
}

interface SmtpDomain {
  id: string;
  domain: string;
  tenancyId: string;
  priority: number;
  createdAt: string;
  tenancy: OfficeTenancy;
}

export default function SmtpDomainManager() {
  const [domains, setDomains] = useState<SmtpDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<SmtpDomain | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/domains');
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains);
      } else {
        setError('Failed to load domains');
      }
    } catch (err) {
      setError('Error loading domains');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingDomain(null);
    setModalOpen(true);
  };

  const handleEdit = (domain: SmtpDomain) => {
    setEditingDomain(domain);
    setModalOpen(true);
  };

  const handleDelete = async (domain: SmtpDomain) => {
    if (!confirm(`Are you sure you want to delete the domain "${domain.domain}"?`)) {
      return;
    }

    setDeletingId(domain.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/domains/${domain.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess(`Domain "${domain.domain}" deleted successfully`);
        await loadDomains();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete domain');
      }
    } catch (err) {
      setError('Error deleting domain');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = async (saved: boolean) => {
    setModalOpen(false);
    setEditingDomain(null);
    if (saved) {
      await loadDomains();
      setSuccess(
        editingDomain ? 'Domain updated successfully' : 'Domain created successfully'
      );
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-purple-50 border-b border-purple-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">SMTP Domain Routing</h2>
              <p className="text-sm text-gray-600">Configure email domain to tenant routing</p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Domain</span>
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
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : domains.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains configured yet</h3>
            <p className="text-gray-500 mb-6">
              Map email domains to Office 365 tenants for intelligent routing
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Domain</span>
            </button>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {domains.map((domain) => (
                  <tr key={domain.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{domain.domain}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{domain.tenancy.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{domain.tenancy.tenantId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          domain.tenancy.enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {domain.tenancy.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {domain.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(domain)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(domain)}
                          disabled={deletingId === domain.id}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === domain.id ? (
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
        <SmtpDomainModal
          domain={editingDomain}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
