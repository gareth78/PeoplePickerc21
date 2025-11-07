'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Server, 
  Cloud, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Loader2,
  Save,
  X
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

interface OktaConfig {
  orgUrl: string;
  apiToken: string;
}

export default function ConfigurationPage() {
  // Okta Config State
  const [oktaConfig, setOktaConfig] = useState<OktaConfig>({
    orgUrl: '',
    apiToken: '',
  });
  const [originalOktaConfig, setOriginalOktaConfig] = useState<OktaConfig>({
    orgUrl: '',
    apiToken: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [oktaLoading, setOktaLoading] = useState(false);
  const [oktaSaving, setOktaSaving] = useState(false);
  const [oktaTesting, setOktaTesting] = useState(false);
  const [oktaTestResult, setOktaTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [oktaChanged, setOktaChanged] = useState(false);

  // Load Okta config on mount
  useEffect(() => {
    loadOktaConfig();
  }, []);

  // Check if Okta config has changed
  useEffect(() => {
    const changed = 
      oktaConfig.orgUrl !== originalOktaConfig.orgUrl ||
      (oktaConfig.apiToken !== originalOktaConfig.apiToken && !oktaConfig.apiToken.includes('••••'));
    setOktaChanged(changed);
  }, [oktaConfig, originalOktaConfig]);

  const loadOktaConfig = async () => {
    setOktaLoading(true);
    try {
      const response = await fetch('/api/admin/config/okta');
      if (response.ok) {
        const data = await response.json();
        const config = {
          orgUrl: data.orgUrl,
          apiToken: data.apiToken,
        };
        setOktaConfig(config);
        setOriginalOktaConfig(config);
      } else {
        console.error('Failed to load Okta config');
      }
    } catch (error) {
      console.error('Error loading Okta config:', error);
    } finally {
      setOktaLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setOktaTesting(true);
    setOktaTestResult(null);
    
    try {
      const response = await fetch('/api/admin/config/okta/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oktaConfig),
      });
      
      const result = await response.json();
      setOktaTestResult(result);
    } catch (error) {
      setOktaTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setOktaTesting(false);
    }
  };

  const handleSaveOkta = async () => {
    setOktaSaving(true);
    try {
      const response = await fetch('/api/admin/config/okta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oktaConfig),
      });

      if (response.ok) {
        await loadOktaConfig(); // Reload to get masked token
        setOktaTestResult({
          success: true,
          message: 'Configuration saved successfully',
        });
        setOktaChanged(false);
      } else {
        const error = await response.json();
        setOktaTestResult({
          success: false,
          message: error.error || 'Failed to save configuration',
        });
      }
    } catch (error) {
      setOktaTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setOktaSaving(false);
    }
  };

  const handleCancelOkta = () => {
    setOktaConfig(originalOktaConfig);
    setOktaTestResult(null);
    setOktaChanged(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center space-x-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
            <p className="text-gray-600">Manage application settings and integrations</p>
          </div>
        </div>

        {/* Okta Configuration - FUNCTIONAL */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-50 border-b border-green-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Server className="w-6 h-6 text-green-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Okta Environment</h2>
                  <p className="text-sm text-gray-600">Configure Okta API connection</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                ACTIVE
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {oktaLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Org URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization URL
                  </label>
                  <input
                    type="url"
                    value={oktaConfig.orgUrl}
                    onChange={(e) => setOktaConfig({ ...oktaConfig, orgUrl: e.target.value })}
                    placeholder="https://dev-12345.okta.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* API Token */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Token
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={oktaConfig.apiToken}
                      onChange={(e) => setOktaConfig({ ...oktaConfig, apiToken: e.target.value })}
                      placeholder="Enter API token"
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Token will be encrypted before storage
                  </p>
                </div>

                {/* Test Connection Button */}
                <div>
                  <button
                    onClick={handleTestConnection}
                    disabled={oktaTesting || !oktaConfig.orgUrl || !oktaConfig.apiToken || oktaConfig.apiToken.includes('••••')}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {oktaTesting ? (
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
                </div>

                {/* Test Result */}
                {oktaTestResult && (
                  <div className={`flex items-start space-x-3 p-4 rounded-lg ${
                    oktaTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    {oktaTestResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        oktaTestResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {oktaTestResult.success ? 'Success' : 'Error'}
                      </p>
                      <p className={`text-sm ${
                        oktaTestResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {oktaTestResult.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Save/Cancel Buttons */}
                {oktaChanged && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCancelOkta}
                      disabled={oktaSaving}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveOkta}
                      disabled={oktaSaving}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {oktaSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Office 365 Tenancies - COMING SOON */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden opacity-60">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Cloud className="w-6 h-6 text-gray-400" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Office 365 Tenancies</h2>
                  <p className="text-sm text-gray-600">Manage multiple Office 365 tenants</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-400 text-white text-xs font-medium rounded-full">
                COMING SOON
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-gray-500">
              Add and manage multiple Office 365 tenants for multi-tenancy support.
            </p>
            <button
              disabled
              className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            >
              <span>+ Add Tenant</span>
            </button>
            <div className="text-center py-8 text-gray-400">
              No tenants configured yet
            </div>
          </div>
        </div>

        {/* SMTP Domain Routing - COMING SOON */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden opacity-60">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6 text-gray-400" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">SMTP Domain Routing</h2>
                  <p className="text-sm text-gray-600">Configure email domain to tenant routing</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-400 text-white text-xs font-medium rounded-full">
                COMING SOON
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-gray-500">
              Map email domains to specific Office 365 tenants for intelligent routing.
            </p>
            <button
              disabled
              className="flex items-center space-x-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
            >
              <span>+ Add Domain</span>
            </button>
            <div className="text-center py-8 text-gray-400">
              No domains configured yet
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
