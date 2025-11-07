// components/admin/QuickActions.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Settings, TestTube, FileText, RefreshCw, Database, Users } from 'lucide-react';

interface ActionButton {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
  bgColor: string;
  hoverColor: string;
}

export function QuickActions() {
  const router = useRouter();

  const actions: ActionButton[] = [
    {
      label: 'Configure Okta',
      icon: <Settings className="w-5 h-5" />,
      onClick: () => router.push('/admin/configuration'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      label: 'Test Connection',
      icon: <TestTube className="w-5 h-5" />,
      onClick: async () => {
        try {
          const response = await fetch('/api/admin/config/okta/test', {
            method: 'POST'
          });
          const data = await response.json();
          alert(data.success ? 'Connection successful!' : `Failed: ${data.error}`);
        } catch (error) {
          alert('Test failed: ' + error);
        }
      },
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100'
    },
    {
      label: 'View Audit Logs',
      icon: <FileText className="w-5 h-5" />,
      onClick: () => router.push('/admin/audit'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    },
    {
      label: 'Refresh Cache',
      icon: <RefreshCw className="w-5 h-5" />,
      onClick: async () => {
        if (confirm('Refresh system cache? This will reload all configurations.')) {
          // Placeholder for cache refresh logic
          alert('Cache refresh triggered');
        }
      },
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100'
    },
    {
      label: 'Database Console',
      icon: <Database className="w-5 h-5" />,
      onClick: () => {
        window.open('https://portal.azure.com', '_blank');
      },
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      hoverColor: 'hover:bg-indigo-100'
    },
    {
      label: 'Manage Users',
      icon: <Users className="w-5 h-5" />,
      onClick: () => {
        window.open('https://plan-international.okta-emea.com/admin/users', '_blank');
      },
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      hoverColor: 'hover:bg-pink-100'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`group p-4 rounded-xl ${action.bgColor} ${action.hoverColor} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
          >
            <div className={`${action.color} mb-2 group-hover:scale-110 transition-transform duration-200`}>
              {action.icon}
            </div>
            <p className="text-sm font-medium text-gray-900 text-left">
              {action.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
