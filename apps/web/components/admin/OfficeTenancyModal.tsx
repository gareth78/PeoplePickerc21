'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';

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
  enableGroupSendCheck: boolean;
}

interface Props {
  tenancy: OfficeTenancy | null;
  onClose: (saved: boolean) => void;
}

export default function OfficeTenancyModal({ tenancy, onClose }: Props) {
  console.log('🚀 OfficeTenancyModal mounted/rendered', { tenancy });
  const isEditing = !!tenancy;

  const [formData, setFormData] = useState({
    name: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    enabled: true,
    enablePresence: true,
    enablePhotos: true,
    enableOutOfOffice: true,
    enableLocalGroups: false,
    enableGlobalGroups: false,
    enableGroupSendCheck: false,
  });

  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tenancy) {
      setFormData({
        name: tenancy.name,
        tenantId: tenancy.tenantId,
        clientId: tenancy.clientId,
        clientSecret: '••••••••••••••••', // Masked
        enabled: tenancy.enabled,
        enablePresence: tenancy.enablePresence,
        enablePhotos: tenancy.enablePhotos,
        enableOutOfOffice: tenancy.enableOutOfOffice,
        enableLocalGroups: tenancy.enableLocalGroups,
        enableGlobalGroups: tenancy.enableGlobalGroups,
        enableGroupSendCheck: tenancy.enableGroupSendCheck,
      });
    }
  }, [tenancy]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.tenantId.trim()) {
      newErrors.tenantId = 'Tenant ID is required';
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(formData.tenantId)) {
        newErrors.tenantId = 'Invalid UUID format';
      }
    }

    if (!formData.clientId.trim()) {
      newErrors.clientId = 'Client ID is required';
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(formData.clientId)) {
        newErrors.clientId = 'Invalid UUID format';
      }
    }

    if (!isEditing && !formData.clientSecret.trim()) {
      newErrors.clientSecret = 'Client Secret is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    console.log('🔍 handleTestConnection called');
    console.log('Form data:', { tenantId: formData.tenantId, clientId: formData.clientId, hasSecret: !!formData.clientSecret });
    setTesting(true);
    setTestResult(null);

    try {
      console.log('🌐 Making test connection request to /api/admin/tenancies/test');
      const response = await fetch('/api/admin/tenancies/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: formData.tenantId,
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
        }),
      });

      const result = await response.json();
      console.log('✅ Test connection response:', result);
      setTestResult(result);
    } catch (error) {
      console.error('❌ Test connection error:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    console.log('💾 handleSave called');
    console.log('Is editing:', isEditing);
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed, proceeding with save');
    setSaving(true);

    try {
      const url = isEditing
        ? `/api/admin/tenancies/${tenancy.id}`
        : '/api/admin/tenancies';
      const method = isEditing ? 'PUT' : 'POST';

      // Build request body
      const body: any = {
        name: formData.name,
        enabled: formData.enabled,
        enablePresence: formData.enablePresence,
        enablePhotos: formData.enablePhotos,
        enableOutOfOffice: formData.enableOutOfOffice,
        enableLocalGroups: formData.enableLocalGroups,
        enableGlobalGroups: formData.enableGlobalGroups,
        enableGroupSendCheck: formData.enableGroupSendCheck,
      };

      // Only include these fields when creating or if they've changed
      if (!isEditing) {
        body.tenantId = formData.tenantId;
        body.clientId = formData.clientId;
        body.clientSecret = formData.clientSecret;
      } else {
        // When editing, only include clientSecret if it's not masked
        if (formData.clientSecret && !formData.clientSecret.includes('••••')) {
          body.clientSecret = formData.clientSecret;
        }
      }

      console.log('🌐 Making save request:', { url, method, body });
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      console.log('📥 Save response status:', response.status);

      if (response.ok) {
        console.log('✅ Save successful');
        onClose(true);
      } else {
        const data = await response.json();
        console.error('❌ Save failed:', data);
        setErrors({ submit: data.error || 'Failed to save tenancy' });
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      setErrors({ submit: 'Error saving tenancy' });
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Office 365 Tenant' : 'Add Office 365 Tenant'}
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

          {/* Friendly Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Friendly Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., UK Office, US Office"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Entra Tenant ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entra Tenant ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              disabled={isEditing}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
              } ${errors.tenantId ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.tenantId && <p className="mt-1 text-sm text-red-600">{errors.tenantId}</p>}
            {isEditing && (
              <p className="mt-1 text-xs text-gray-500">Tenant ID cannot be changed</p>
            )}
          </div>

          {/* Entra Client ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entra Client ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              disabled={isEditing}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
              } ${errors.clientId ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>}
            {isEditing && (
              <p className="mt-1 text-xs text-gray-500">Client ID cannot be changed</p>
            )}
          </div>

          {/* Entra Client Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entra Client Secret {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={formData.clientSecret}
                onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                placeholder={isEditing ? 'Leave blank to keep existing' : 'Enter client secret'}
                className={`w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.clientSecret ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.clientSecret && (
              <p className="mt-1 text-sm text-red-600">{errors.clientSecret}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {isEditing
                ? 'Leave blank to keep the existing secret'
                : 'Secret will be encrypted before storage'}
            </p>
          </div>

          {/* Test Connection Button */}
          <div>
            {(() => {
              const isDisabled = testing ||
                !formData.tenantId ||
                !formData.clientId ||
                !formData.clientSecret ||
                formData.clientSecret.includes('••••');
              console.log('🔘 Test Connection button state:', { 
                isDisabled, 
                testing, 
                hasTenantId: !!formData.tenantId,
                hasClientId: !!formData.clientId,
                hasClientSecret: !!formData.clientSecret,
                secretIncludesMask: formData.clientSecret.includes('••••')
              });
              return null;
            })()}
            <button
              type="button"
              onClick={(e) => {
                console.log('🖱️ Test Connection button clicked', e);
                handleTestConnection();
              }}
              disabled={
                testing ||
                !formData.tenantId ||
                !formData.clientId ||
                !formData.clientSecret ||
                formData.clientSecret.includes('••••')
              }
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
            <p className="mt-1 text-xs text-gray-500">
              Test credentials before saving (recommended)
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-start space-x-3 p-4 rounded-lg ${
                testResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {testResult.success ? 'Success' : 'Error'}
                </p>
                <p
                  className={`text-sm ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {testResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Enabled Toggle */}
          <div className="flex items-center space-x-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-700">Enable this tenant</span>
          </div>

          {/* Feature Flags Section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center space-x-2 mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Feature Flags</h4>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="hidden group-hover:block absolute left-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                  Control which Microsoft Graph API features are enabled for this tenant
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Enable Presence */}
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enablePresence}
                    onChange={(e) =>
                      setFormData({ ...formData, enablePresence: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Presence Lookup</span>
                  <p className="text-xs text-gray-500">Presence.Read.All permission</p>
                </div>
              </div>

              {/* Enable Photos */}
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enablePhotos}
                    onChange={(e) => setFormData({ ...formData, enablePhotos: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Profile Photos</span>
                  <p className="text-xs text-gray-500">User.Read.All permission</p>
                </div>
              </div>

              {/* Enable Out of Office */}
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableOutOfOffice}
                    onChange={(e) =>
                      setFormData({ ...formData, enableOutOfOffice: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Enable Out of Office Status
                  </span>
                  <p className="text-xs text-gray-500">MailboxSettings.Read permission</p>
                </div>
              </div>

              {/* Enable Local Groups */}
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableLocalGroups}
                    onChange={(e) =>
                      setFormData({ ...formData, enableLocalGroups: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Local Groups</span>
                  <p className="text-xs text-gray-500">Query local tenant groups</p>
                </div>
              </div>

              {/* Enable Global Groups */}
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableGlobalGroups}
                    onChange={(e) =>
                      setFormData({ ...formData, enableGlobalGroups: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-gray-700">Enable Global Groups</span>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="hidden group-hover:block absolute left-0 top-5 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                      Shows Groups tab in UI for this tenant's users
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500"></p>
              </div>

              {/* Enable Group Send Permission Check */}
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableGroupSendCheck}
                    onChange={(e) =>
                      setFormData({ ...formData, enableGroupSendCheck: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Group Send Permission Check</span>
                  <p className="text-xs text-gray-500">Allow users to check if they can send to distribution groups (requires Group.Read.All permission)</p>
                </div>
              </div>
            </div>
          </div>
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
            onClick={(e) => {
              console.log('🖱️ Save button clicked', e);
              handleSave();
            }}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
