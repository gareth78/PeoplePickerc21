'use client';

import { useEffect, useState } from 'react';
import {
  PresenceAvailable20Regular,
  PresenceBusy20Filled,
  PresenceDnd20Filled,
  PresenceAway20Filled,
  PresenceOof20Regular,
  PresenceOffline20Regular,
  PresenceUnknown20Regular
} from '@fluentui/react-icons';

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

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const getPresenceIcon = () => {
    const iconProps = {
      className: sizeClasses[size],
      'aria-label': getPresenceLabel()
    };

    switch (presence.availability) {
      case 'Available':
      case 'AvailableIdle':
        return <PresenceAvailable20Regular {...iconProps} style={{ color: '#92C353' }} />;
      case 'Busy':
      case 'BusyIdle':
        return <PresenceBusy20Filled {...iconProps} style={{ color: '#C4314B' }} />;
      case 'DoNotDisturb':
        return <PresenceDnd20Filled {...iconProps} style={{ color: '#C4314B' }} />;
      case 'Away':
      case 'BeRightBack':
        return <PresenceAway20Filled {...iconProps} style={{ color: '#FFAA44' }} />;
      case 'OutOfOffice':
        return <PresenceOof20Regular {...iconProps} style={{ color: '#B4009E' }} />;
      case 'Offline':
        return <PresenceOffline20Regular {...iconProps} style={{ color: '#8A8886' }} />;
      case 'PresenceUnknown':
      default:
        return <PresenceUnknown20Regular {...iconProps} style={{ color: '#8A8886' }} />;
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
      case 'OutOfOffice':
        return 'Out of office';
      case 'Offline':
        return 'Offline';
      case 'PresenceUnknown':
      default:
        return 'Unknown';
    }
  };

  if (showTooltip) {
    return (
      <div title={getPresenceLabel()} className="flex items-center">
        {getPresenceIcon()}
      </div>
    );
  }

  return getPresenceIcon();
}
