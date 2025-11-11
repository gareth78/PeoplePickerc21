'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Save, X, Key } from 'lucide-react';

interface AuthConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}

interface TestResult {
  success: boolean;
  message: string;
}

export default function AuthenticationConfig() {
  const [config, setConfig] = useState<AuthConfig>({
    clientId: '',
    clientSecret: '',
    tenantId: 'common'
  });
  const [originalConfig, setOriginalConfig] = useState<AuthConfig>({
    clientId: '',
    clientSecret: '',
    tenantId: 'common'
  });
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [configChanged, setConfigChanged] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  // Check if config has changed
  useEffect(() => {
    const changed =
      config.clientId !== originalConfig.clientId ||
      config.tenantId !== originalConfig.tenantId ||
      (config.clientSecret !== originalConfig.clientSecret && !config.clientSecret.startsWith('****'));
    setConfigChanged(changed);
  }, [config, originalConfig]);

  async function loadConfig() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/config/auth');
      if (!response.ok) throw new Error('Failed to load config');
      const data = await response.json();
      const loadedConfig = {
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        tenantId: data.tenantId
      };
      setConfig(loadedConfig);
      setOriginalConfig(loadedConfig);
    } catch (error) {
      console.error('Error loading auth config:', error);
      setTestResult({
        success: false,
        message: 'Failed to load authentication configuration'
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTest() {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/config/auth/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: config.clientId,
          tenantId: config.tenantId
        })
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({ success: true, message: data.message || 'Connection test successful!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Connection test failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Network error during test' });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSave() {
    if (config.clientSecret.startsWith('****')) {
      setTestResult({
        success: false,
        message: 'Please enter the full client secret before saving.'
      });
      return;
    }

    setIsSaving(true);
    setTestResult(null);

    try {
      const secretToSend = config.clientSecret;

      const response = await fetch('/api/admin/config/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: config.clientId,
          clientSecret: secretToSend,
          tenantId: config.tenantId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      setTestResult({ success: true, message: 'Configuration saved successfully!' });
      setConfigChanged(false);
      await loadConfig(); // Reload to get masked secret
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setConfig(originalConfig);
    setTestResult(null);
    setConfigChanged(false);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Authentication Configuration</h2>
              <p className="text-sm text-gray-600">Multi-tenant Azure App Registration for user login</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
            UNIVERSAL AUTH
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Information Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Purpose:</strong> This is the universal authentication app registration
            used for login flows (web client and Outlook add-in). It should be configured
            as &quot;multi-tenant&quot; in Azure.
          </p>
          <p className="text-sm text-blue-900 mt-2">
            <strong>Note:</strong> This is separate from the Office 365 Tenancies below,
            which are used for Graph API calls and selected via domain routing.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Client ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client ID (Multi-Tenant App Registration)
              </label>
              <input
                type="text"
                value={config.clientId}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                placeholder="d3d86dcd-4647-4c3e-bbc5-b023308adaa9"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Client Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Secret
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={config.clientSecret}
                  onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                  placeholder="Enter client secret"
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Secret will be encrypted before storage
              </p>
            </div>

            {/* Tenant ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant ID
              </label>
              <input
                type="text"
                value={config.tenantId}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use &quot;common&quot; for multi-tenant authentication
              </p>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`flex items-start space-x-3 p-4 rounded-lg ${
                testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? 'Success' : 'Error'}
                  </p>
                  <p className={`text-sm ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {configChanged ? (
                <div className="flex items-center space-x-2 text-amber-600">
                  <span className="text-sm font-medium">● Unsaved changes</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">All changes saved</span>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || !config.clientId}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTesting ? (
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

                <button
                  onClick={handleCancel}
                  disabled={!configChanged || isSaving}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>

                <button
                  onClick={handleSave}
                  disabled={!configChanged || isSaving}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save to Database</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
