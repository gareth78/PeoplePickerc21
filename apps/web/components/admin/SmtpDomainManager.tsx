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
  GripVertical,
  Save,
  Check,
  X,
  Minus,
} from 'lucide-react';
import SmtpDomainModal from './SmtpDomainModal';

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
  createdAt: string;
  enablePresence?: boolean | null;
  enablePhotos?: boolean | null;
  enableOutOfOffice?: boolean | null;
  enableLocalGroups?: boolean | null;
  enableGlobalGroups?: boolean | null;
  tenancy: OfficeTenancy;
}

// Component to display feature flags matching Office 365 Tenancies style
interface FeatureFlagBadgeProps {
  label: string;
  domainValue: boolean | null;
  tenancyValue: boolean;
  tenancyName: string;
}

function FeatureFlagBadge({ label, domainValue, tenancyValue, tenancyName }: FeatureFlagBadgeProps) {
  let icon: React.ReactNode;
  let bgColor: string;
  let textColor: string;
  let tooltip: string;
  
  // Determine status and styling
  if (domainValue === false) {
    // Explicitly disabled at domain level (RED)
    icon = <X className="w-3 h-3" />;
    bgColor = "bg-red-100";
    textColor = "text-red-800";
    tooltip = `${label}: Explicitly disabled for this domain (overriding tenancy)`;
  } 
  else if (domainValue === true) {
    // Explicitly enabled at domain level (GREEN)
    icon = <Check className="w-3 h-3" />;
    bgColor = "bg-green-100";
    textColor = "text-green-800";
    tooltip = `${label}: Explicitly enabled for this domain`;
  } 
  else if (domainValue === null && tenancyValue === true) {
    // Inherited as enabled (GREEN)
    icon = <Check className="w-3 h-3" />;
    bgColor = "bg-green-100";
    textColor = "text-green-800";
    tooltip = `${label}: Enabled (inherited from ${tenancyName})`;
  } 
  else {
    // Inherited as disabled / blocked by tenancy (GRAY)
    icon = <Minus className="w-3 h-3" />;
    bgColor = "bg-gray-100";
    textColor = "text-gray-600";
    tooltip = `${label}: Disabled at tenancy level - cannot be enabled for this domain`;
  }
  
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
      title={tooltip}
    >
      {icon}
      {label}
    </span>
  );
}

export default function SmtpDomainManager() {
  const [domains, setDomains] = useState<SmtpDomain[]>([]);
  const [orderedDomains, setOrderedDomains] = useState<SmtpDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<SmtpDomain | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    // Sort domains by priority (highest priority = lowest number = top of list)
    const sorted = [...domains].sort((a, b) => a.priority - b.priority);
    setOrderedDomains(sorted);
    setHasUnsavedChanges(false);
  }, [domains]);

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    const newOrdered = [...orderedDomains];
    const draggedItem = newOrdered[draggedIndex];
    
    // Remove from old position
    newOrdered.splice(draggedIndex, 1);
    
    // Insert at new position
    newOrdered.splice(index, 0, draggedItem);
    
    setOrderedDomains(newOrdered);
    setDraggedIndex(index);
    setHasUnsavedChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    setError(null);

    try {
      // Update priorities based on array order
      // Index 0 = priority 1 (highest), Index 1 = priority 2, etc.
      const updates = orderedDomains.map((domain, index) => ({
        id: domain.id,
        priority: index + 1,
      }));

      const response = await fetch('/api/admin/domains/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: updates }),
      });

      if (response.ok) {
        setSuccess('Domain priority order saved successfully');
        await loadDomains();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save domain order');
      }
    } catch (err) {
      setError('Error saving domain order');
      console.error(err);
    } finally {
      setSavingOrder(false);
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
              <p className="text-sm text-gray-600">
                Drag to reorder domains by priority (top = highest priority)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {hasUnsavedChanges && (
              <button
                onClick={handleSaveOrder}
                disabled={savingOrder}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {savingOrder ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Apply Order</span>
              </button>
            )}
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Domain</span>
            </button>
          </div>
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
          /* Draggable Table */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-8"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderedDomains.map((domain, index) => (
                  <tr
                    key={domain.id}
                    onDragOver={(e) => handleDragOver(e, index)}
                    className={`hover:bg-gray-50 ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Column 1: Drag handle (spans all 3 visual rows) */}
                    <td className="px-3 py-4 align-top">
                      <div
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="w-5 h-5 text-gray-400" />
                      </div>
                    </td>

                    {/* Column 2: Domain info (contains all 3 lines) */}
                    <td className="px-6 py-4">
                      {/* Line 1: Domain name */}
                      <div className="flex items-center mb-2">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{domain.domain}</span>
                      </div>
                      
                      {/* Line 2: Tenancy name + UUID */}
                      <div className="text-sm text-gray-500 mb-2">
                        {domain.tenancy.name} ({domain.tenancy.tenantId})
                      </div>
                      
                      {/* Line 3: Feature flags */}
                      <div className="flex flex-wrap gap-2">
                        <FeatureFlagBadge 
                          label="Presence"
                          domainValue={domain.enablePresence ?? null}
                          tenancyValue={domain.tenancy.enablePresence}
                          tenancyName={domain.tenancy.name}
                        />
                        <FeatureFlagBadge 
                          label="Photos"
                          domainValue={domain.enablePhotos ?? null}
                          tenancyValue={domain.tenancy.enablePhotos}
                          tenancyName={domain.tenancy.name}
                        />
                        <FeatureFlagBadge 
                          label="OOO"
                          domainValue={domain.enableOutOfOffice ?? null}
                          tenancyValue={domain.tenancy.enableOutOfOffice}
                          tenancyName={domain.tenancy.name}
                        />
                        <FeatureFlagBadge 
                          label="Local Groups"
                          domainValue={domain.enableLocalGroups ?? null}
                          tenancyValue={domain.tenancy.enableLocalGroups}
                          tenancyName={domain.tenancy.name}
                        />
                        <FeatureFlagBadge 
                          label="Global Groups"
                          domainValue={domain.enableGlobalGroups ?? null}
                          tenancyValue={domain.tenancy.enableGlobalGroups}
                          tenancyName={domain.tenancy.name}
                        />
                      </div>
                    </td>

                    {/* Column 3: Priority badge (centered, spans full height) */}
                    <td className="text-center align-top pt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {index + 1}
                      </span>
                    </td>

                    {/* Column 4: Actions (aligned top) */}
                    <td className="px-6 text-right align-top pt-4">
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
