'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { formatPresenceActivity, getPresenceBadgeClasses, type PresenceData } from '@/lib/presence-utils';

interface PresenceBadgeProps {
  email: string;
}

/**
 * Isolated presence badge component that manages its own state independently.
 * This component is wrapped in React.memo with a custom comparison function
 * to prevent unnecessary re-renders and break the render loop cycle.
 */
function PresenceBadgeComponent({ email }: PresenceBadgeProps) {
  const [presence, setPresence] = useState<PresenceData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchedEmailRef = useRef<string | null>(null);

  useEffect(() => {
    // If email hasn't changed, don't fetch again
    if (fetchedEmailRef.current === email) {
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Reset presence when email changes
    setPresence(null);

    // Fetch presence data
    fetch(`/api/graph/presence/${encodeURIComponent(email)}`, {
      signal: abortController.signal,
    })
      .then(res => res.json())
      .then(data => {
        // Only update if request wasn't aborted
        if (!abortController.signal.aborted && data.ok && data.data) {
          setPresence(data.data);
          fetchedEmailRef.current = email;
        }
      })
      .catch(err => {
        // Ignore abort errors
        if (err.name !== 'AbortError') {
          console.error('Presence fetch failed:', err);
        }
      });

    // Cleanup: abort request on unmount or email change
    return () => {
      abortController.abort();
    };
  }, [email]);

  // Don't render anything if no presence data or if activity is unknown/empty
  if (!presence?.activity || !getPresenceBadgeClasses(presence.activity)) {
    return null;
  }

  const badgeClasses = getPresenceBadgeClasses(presence.activity);
  const formattedActivity = formatPresenceActivity(presence.activity);

  return (
    <div className="flex justify-center mb-3">
      <span 
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeClasses}`}
      >
        {formattedActivity}
      </span>
    </div>
  );
}

// Wrap in memo with custom comparison to prevent re-renders when email hasn't changed
export const PresenceBadge = memo(PresenceBadgeComponent, (prevProps, nextProps) => {
  // Only re-render if email actually changed
  return prevProps.email === nextProps.email;
});
