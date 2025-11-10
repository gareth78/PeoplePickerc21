'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, XCircle, Info } from 'lucide-react';

interface OfficeTenancy {
  id: string;
  name: string;
  tenantId: string;
  enabled: boolean;
  enablePresence: boolean;
  enablePhotos: boolean;
  enableOutOfOffice: boolean;
  enableLocalGroups: boolean;
  enableGlobalGroups: boolean;
}

interface SmtpDomain {
  id: string;
  domain: string;
  tenancyId: string;
  priority: number;
  enablePresence?: boolean | null;
  enablePhotos?: boolean | null;
  enableOutOfOffice?: boolean | null;
  enableLocalGroups?: boolean | null;
  enableGlobalGroups?: boolean | null;
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
    enablePresence: null as boolean | null,
    enablePhotos: null as boolean | null,
    enableOutOfOffice: null as boolean | null,
    enableLocalGroups: null as boolean | null,
    enableGlobalGroups: null as boolean | null,
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
        enablePresence: domain.enablePresence ?? null,
        enablePhotos: domain.enablePhotos ?? null,
        enableOutOfOffice: domain.enableOutOfOffice ?? null,
        enableLocalGroups: domain.enableLocalGroups ?? null,
        enableGlobalGroups: domain.enableGlobalGroups ?? null,
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

  const getSelectedTenancy = (): OfficeTenancy | null => {
    return tenancies.find((t) => t.id === formData.tenancyId) || null;
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

    // Validate feature flags - domain can't enable features tenancy doesn't support
    const selectedTenancy = getSelectedTenancy();
    if (selectedTenancy) {
      if (formData.enablePresence === true && !selectedTenancy.enablePresence) {
        newErrors.enablePresence = `Cannot enable Presence - parent tenancy '${selectedTenancy.name}' does not support this feature`;
      }
      if (formData.enablePhotos === true && !selectedTenancy.enablePhotos) {
        newErrors.enablePhotos = `Cannot enable Photos - parent tenancy '${selectedTenancy.name}' does not support this feature`;
      }
      if (formData.enableOutOfOffice === true && !selectedTenancy.enableOutOfOffice) {
        newErrors.enableOutOfOffice = `Cannot enable Out of Office - parent tenancy '${selectedTenancy.name}' does not support this feature`;
      }
      if (formData.enableLocalGroups === true && !selectedTenancy.enableLocalGroups) {
        newErrors.enableLocalGroups = `Cannot enable Local Groups - parent tenancy '${selectedTenancy.name}' does not support this feature`;
      }
      if (formData.enableGlobalGroups === true && !selectedTenancy.enableGlobalGroups) {
        newErrors.enableGlobalGroups = `Cannot enable Global Groups - parent tenancy '${selectedTenancy.name}' does not support this feature`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Tri-state toggle: null -> true -> false -> null
  const toggleFeatureFlag = (flag: keyof typeof formData) => {
    const currentValue = formData[flag];
    let newValue: boolean | null;

    if (currentValue === null) {
      newValue = true;
    } else if (currentValue === true) {
      newValue = false;
    } else {
      newValue = null;
    }

    setFormData({ ...formData, [flag]: newValue });
    // Clear error for this field if any
    if (errors[flag]) {
      const newErrors = { ...errors };
      delete newErrors[flag];
      setErrors(newErrors);
    }
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

              {/* Feature Flags Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Feature Flags</h4>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Configure which Microsoft Graph features are enabled for this domain. Leave blank to inherit from tenancy.
                </p>

                {/* Feature Flag Toggles */}
                <div className="space-y-3">
                  {/* Enable Presence */}
                  <FeatureFlagToggle
                    label="Enable Presence Lookup"
                    value={formData.enablePresence}
                    tenancyValue={getSelectedTenancy()?.enablePresence ?? false}
                    tenancyName={getSelectedTenancy()?.name ?? ''}
                    disabled={!getSelectedTenancy()?.enablePresence}
                    error={errors.enablePresence}
                    onClick={() => toggleFeatureFlag('enablePresence')}
                  />

                  {/* Enable Photos */}
                  <FeatureFlagToggle
                    label="Enable Profile Photos"
                    value={formData.enablePhotos}
                    tenancyValue={getSelectedTenancy()?.enablePhotos ?? false}
                    tenancyName={getSelectedTenancy()?.name ?? ''}
                    disabled={!getSelectedTenancy()?.enablePhotos}
                    error={errors.enablePhotos}
                    onClick={() => toggleFeatureFlag('enablePhotos')}
                  />

                  {/* Enable Out of Office */}
                  <FeatureFlagToggle
                    label="Enable Out of Office Status"
                    value={formData.enableOutOfOffice}
                    tenancyValue={getSelectedTenancy()?.enableOutOfOffice ?? false}
                    tenancyName={getSelectedTenancy()?.name ?? ''}
                    disabled={!getSelectedTenancy()?.enableOutOfOffice}
                    error={errors.enableOutOfOffice}
                    onClick={() => toggleFeatureFlag('enableOutOfOffice')}
                  />

                  {/* Enable Local Groups */}
                  <FeatureFlagToggle
                    label="Enable Local Groups"
                    value={formData.enableLocalGroups}
                    tenancyValue={getSelectedTenancy()?.enableLocalGroups ?? false}
                    tenancyName={getSelectedTenancy()?.name ?? ''}
                    disabled={!getSelectedTenancy()?.enableLocalGroups}
                    error={errors.enableLocalGroups}
                    onClick={() => toggleFeatureFlag('enableLocalGroups')}
                  />

                  {/* Enable Global Groups */}
                  <FeatureFlagToggle
                    label="Enable Global Groups"
                    value={formData.enableGlobalGroups}
                    tenancyValue={getSelectedTenancy()?.enableGlobalGroups ?? false}
                    tenancyName={getSelectedTenancy()?.name ?? ''}
                    disabled={!getSelectedTenancy()?.enableGlobalGroups}
                    error={errors.enableGlobalGroups}
                    onClick={() => toggleFeatureFlag('enableGlobalGroups')}
                  />
                </div>
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

// Tri-state toggle component for feature flags
interface FeatureFlagToggleProps {
  label: string;
  value: boolean | null;
  tenancyValue: boolean;
  tenancyName: string;
  disabled: boolean;
  error?: string;
  onClick: () => void;
}

function FeatureFlagToggle({
  label,
  value,
  tenancyValue,
  tenancyName,
  disabled,
  error,
  onClick,
}: FeatureFlagToggleProps) {
  // Determine the effective value (domain override or inherited)
  const effectiveValue = value ?? tenancyValue;
  const isInherited = value === null;

  // Visual state
  let toggleColor = 'bg-gray-300'; // Default (null/inheriting)
  let togglePosition = 'translate-x-0';

  if (!isInherited) {
    if (value === true) {
      toggleColor = 'bg-green-500';
      togglePosition = 'translate-x-5';
    } else {
      toggleColor = 'bg-red-500';
      togglePosition = 'translate-x-0';
    }
  } else if (effectiveValue) {
    // Inherited and enabled
    toggleColor = 'bg-gray-400';
    togglePosition = 'translate-x-5';
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {isInherited && (
            <p className="text-xs text-gray-500 mt-0.5">
              Inheriting from {tenancyName}: {effectiveValue ? 'enabled' : 'disabled'}
            </p>
          )}
          {!isInherited && (
            <p className="text-xs text-gray-500 mt-0.5">
              {value ? 'Explicitly enabled' : 'Explicitly disabled'}
            </p>
          )}
        </div>

        {/* Tri-state toggle */}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } ${toggleColor}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${togglePosition}`} />
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {disabled && !error && (
        <p className="mt-1 text-xs text-yellow-600">
          Tenancy does not support this feature
        </p>
      )}
    </div>
  );
}
