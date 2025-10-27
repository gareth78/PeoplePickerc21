'use client';

import { useEffect, useState } from 'react';
import type { OrgChartNode, User } from '@/lib/types';

interface OrgChartModalProps {
  userId: string;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export default function OrgChartModal({ userId, onClose, onSelectUser }: OrgChartModalProps) {
  const [orgChart, setOrgChart] = useState<OrgChartNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgChart = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/okta/orgchart/${userId}`);
        const data = await response.json();

        if (!data.ok) {
          setError(data.error || 'Failed to load org chart');
          return;
        }

        setOrgChart(data.data);
      } catch (err) {
        setError('Failed to load org chart');
      } finally {
        setLoading(false);
      }
    };

    fetchOrgChart();
  }, [userId]);

  const getInitials = (user: User) => {
    return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}` || user.displayName.charAt(0);
  };

  const PersonCard = ({ user, highlight = false, label }: { user: User; highlight?: boolean; label?: string }) => (
    <button
      onClick={() => {
        onSelectUser(user);
        onClose();
      }}
      className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:shadow-md ${
        highlight
          ? 'bg-primary-light border-primary'
          : 'bg-white border-gray-200 hover:border-primary'
      }`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white mb-2 ${
        highlight ? 'bg-primary' : 'bg-gray-400'
      }`}>
        {getInitials(user)}
      </div>
      <div className="text-sm font-semibold text-gray-900 text-center">
        {user.displayName}
      </div>
      {user.title && (
        <div className="text-xs text-gray-600 text-center mt-1">
          {user.title}
        </div>
      )}
      {label && (
        <div className="text-xs font-medium text-primary mt-1">
          {label}
        </div>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Organization Chart</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-12 text-gray-600">
              Loading org chart...
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Close
              </button>
            </div>
          )}

          {orgChart && (
            <div className="flex flex-col items-center space-y-8">
              {/* Manager's Manager (2 levels up) */}
              {orgChart.managersManager && (
                <>
                  <PersonCard
                    user={orgChart.managersManager}
                    label="Manager's Manager"
                  />
                  <div className="w-0.5 h-8 bg-gray-300" />
                </>
              )}

              {/* Manager (1 level up) */}
              {orgChart.manager && (
                <>
                  <PersonCard
                    user={orgChart.manager}
                    label="Manager"
                  />
                  <div className="w-0.5 h-8 bg-gray-300" />
                </>
              )}

              {/* Current User + Peers */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4 flex-wrap justify-center">
                  {/* Peers before */}
                  {orgChart.peers.slice(0, Math.floor(orgChart.peers.length / 2)).map((peer) => (
                    <PersonCard key={peer.id} user={peer} />
                  ))}

                  {/* Current User (highlighted) */}
                  <PersonCard
                    user={orgChart.user}
                    highlight={true}
                    label="You"
                  />

                  {/* Peers after */}
                  {orgChart.peers.slice(Math.floor(orgChart.peers.length / 2)).map((peer) => (
                    <PersonCard key={peer.id} user={peer} />
                  ))}
                </div>

                {orgChart.peers.length > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    {orgChart.peers.length} peer{orgChart.peers.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-center text-xs text-gray-500">
          Click any person to view their details
        </div>
      </div>
    </div>
  );
}
