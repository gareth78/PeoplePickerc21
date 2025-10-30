'use client';

import { useEffect, useState } from 'react';

interface PresenceBadgeProps {
  email: string;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

export default function PresenceBadge({
  email,
  size = 'small',
  showTooltip = true
}: PresenceBadgeProps) {
  const [presence, setPresence] = useState<{
    availability: string;
    activity: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/graph/presence/${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.presence) {
          setPresence(data.presence);
        }
      })
      .catch(() => {
        // Silently fail - presence is optional
      });
  }, [email]);

  if (!presence) {
    return null;
  }

  const getPresenceColor = () => {
    switch (presence.availability) {
      case 'Available':
      case 'AvailableIdle':
        return 'bg-green-500';
      case 'Busy':
      case 'BusyIdle':
      case 'DoNotDisturb':
        return 'bg-red-500';
      case 'Away':
      case 'BeRightBack':
        return 'bg-yellow-500';
      case 'Offline':
      case 'PresenceUnknown':
      default:
        return 'bg-gray-400';
    }
  };

  const getPresenceLabel = () => {
    if (presence.activity === 'InACall') return 'In a call';
    if (presence.activity === 'InAMeeting') return 'In a meeting';
    if (presence.activity === 'Presenting') return 'Presenting';

    switch (presence.availability) {
      case 'Available':
      case 'AvailableIdle':
        return 'Available';
      case 'Busy':
      case 'BusyIdle':
        return 'Busy';
      case 'DoNotDisturb':
        return 'Do not disturb';
      case 'Away':
      case 'BeRightBack':
        return 'Away';
      case 'Offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const sizeClasses = {
    small: 'w-2.5 h-2.5',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };

  const badge = (
    <div
      className={`${sizeClasses[size]} rounded-full ${getPresenceColor()} border-2 border-white`}
    />
  );

  if (showTooltip) {
    return (
      <div title={getPresenceLabel()} className="flex items-center">
        {badge}
      </div>
    );
  }

  return badge;
}
