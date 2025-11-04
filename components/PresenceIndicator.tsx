'use client';

import { useState, useEffect } from 'react';

interface PresenceIndicatorProps {
  email: string;
  className?: string;
}

export function PresenceIndicator({ email, className = '' }: PresenceIndicatorProps) {
  const [availability, setAvailability] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setAvailability(null);
      return;
    }

    let mounted = true;
    setLoading(true);

    fetch(`/api/graph/presence/${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (mounted && data.ok && data.data) {
          setAvailability(data.data.availability); // USE AVAILABILITY, NOT ACTIVITY
        }
      })
      .catch(err => {
        console.error('Presence fetch failed:', err);
        if (mounted) setAvailability(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [email]);

  // Don't render anything if no availability or still loading
  if (!availability || loading) {
    return null;
  }

  // Map availability to badge style
  const getBadgeClasses = () => {
    switch (availability) {
      case 'Available':
        return 'bg-green-100 text-green-700';
      case 'Busy':
      case 'DoNotDisturb':
        return 'bg-red-100 text-red-700';
      case 'Away':
      case 'BeRightBack':
        return 'bg-amber-100 text-amber-700';
      case 'Offline':
        return 'bg-gray-100 text-gray-700';
      default:
        return '';
    }
  };

  // Format availability for display
  const formatAvailability = () => {
    switch (availability) {
      case 'BeRightBack':
        return 'Be Right Back';
      case 'DoNotDisturb':
        return 'Do Not Disturb';
      default:
        return availability;
    }
  };

  const badgeClasses = getBadgeClasses();
  if (!badgeClasses) return null;

  return (
    <div className={`flex justify-center ${className}`}>
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>
        {formatAvailability()}
      </span>
    </div>
  );
}
