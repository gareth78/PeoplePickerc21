'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, XCircle } from 'lucide-react';

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
  tenancy: OfficeTenancy;
}

interface Props {
  domain: SmtpDomain | null;
  onClose: (saved: boolean) => void;
}

export default function SmtpDomainModal({ domain, onClose }: Props) {
  const isEditing = !!domain;

  const [formData, setFormData] = useState({
    domain: '',
    tenancyId: '',
    priority: 0,
  });

  const [tenancies, setTenancies] = useState<OfficeTenancy[]>([]);
  const [loadingTenancies, setLoadingTenancies] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTenancies();
    if (domain) {
      setFormData({
        domain: domain.domain,
        tenancyId: domain.tenancyId,
        priority: domain.priority,
      });
    }
  }, [domain]);

  const loadTenancies = async () => {
    setLoadingTenancies(true);
    try {
      const response = await fetch('/api/admin/tenancies');
      if (response.ok) {
        const data = await response.json();
        setTenancies(data.tenancies);
        // If creating new and no tenancyId set, select first tenant
        if (!domain && data.tenancies.length > 0) {
          setFormData((prev) => ({
            ...prev,
            tenancyId: data.tenancies[0].id,
          }));
        }
      } else {
        setErrors({ submit: 'Failed to load tenancies' });
      }
    } catch (err) {
      setErrors({ submit: 'Error loading tenancies' });
      console.error(err);
    } finally {
      setLoadingTenancies(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.domain.trim()) {
      newErrors.domain = 'Domain is required';
    } else {
      // Basic domain validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(formData.domain)) {
        newErrors.domain = 'Invalid domain format (e.g., example.com)';
      }
      if (formData.domain.includes('@')) {
        newErrors.domain = 'Domain should not include @ symbol';
      }
    }

    if (!formData.tenancyId) {
      newErrors.tenancyId = 'Please select a tenant';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const url = isEditing
        ? `/api/admin/domains/${domain.id}`
        : '/api/admin/domains';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onClose(true);
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Failed to save domain' });
      }
    } catch (error) {
      setErrors({ submit: 'Error saving domain' });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit SMTP Domain' : 'Add SMTP Domain'}
          </h3>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {loadingTenancies ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : tenancies.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No tenants configured yet. Please create an Office 365 tenant first.
              </p>
            </div>
          ) : (
            <>
              {/* Email Domain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Domain <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="e.g., plan.org.uk"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.domain ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.domain && <p className="mt-1 text-sm text-red-600">{errors.domain}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  Enter domain without @ symbol (e.g., "plan.org.uk" not "@plan.org.uk")
                </p>
              </div>

              {/* Assigned Tenant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Tenant <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tenancyId}
                  onChange={(e) => setFormData({ ...formData, tenancyId: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.tenancyId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a tenant...</option>
                  {tenancies.map((tenancy) => (
                    <option key={tenancy.id} value={tenancy.id}>
                      {tenancy.name} {!tenancy.enabled && '(Disabled)'}
                    </option>
                  ))}
                </select>
                {errors.tenancyId && (
                  <p className="mt-1 text-sm text-red-600">{errors.tenancyId}</p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Higher priority domains are checked first (default: 0)
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onClose(false)}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loadingTenancies || tenancies.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Update' : 'Create'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
