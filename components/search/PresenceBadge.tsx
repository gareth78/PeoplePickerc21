'use client';

import { useEffect, useState, useRef } from 'react';
import { formatPresenceActivity, getPresenceBadgeClasses, type PresenceData } from '@/lib/presence-utils';

interface PresenceBadgeProps {
  email: string | undefined | null;
}

/**
 * PresenceBadge - Isolated component that fetches and displays presence status
 * 
 * Uses a ref-based approach to prevent infinite render loops:
 * - Only fetches when email changes (not on every render)
 * - Uses ref to track previous email and prevent duplicate fetches
 * - Isolates all presence logic from parent component
 */
export default function PresenceBadge({ email }: PresenceBadgeProps) {
  const [presence, setPresence] = useState<PresenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const previousEmailRef = useRef<string | undefined | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // If no email, clear presence
    if (!email) {
      setPresence(null);
      previousEmailRef.current = email;
      return;
    }

    // Skip if email hasn't actually changed
    if (previousEmailRef.current === email) {
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Track that we're fetching for this email
    previousEmailRef.current = email;
    setLoading(true);

    fetch(`/api/graph/presence/${encodeURIComponent(email)}`, {
      signal: abortController.signal,
    })
      .then(res => res.json())
      .then(data => {
        // Only update if this is still the current email and request wasn't aborted
        if (!abortController.signal.aborted && previousEmailRef.current === email) {
          if (data.ok && data.data) {
            setPresence(data.data);
          } else {
            setPresence(null);
          }
        }
      })
      .catch(err => {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Presence fetch failed:', err);
        // Only clear if this is still the current email
        if (previousEmailRef.current === email) {
          setPresence(null);
        }
      })
      .finally(() => {
        // Only update loading if this is still the current email
        if (previousEmailRef.current === email) {
          setLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [email]);

  // Don't render anything if no presence data or if activity is unknown
  if (!presence?.activity || presence.activity === 'PresenceUnknown') {
    return null;
  }

  const badgeClasses = getPresenceBadgeClasses(presence.activity);
  
  // Don't render if badge classes are empty (unknown activity)
  if (!badgeClasses) {
    return null;
  }

  return (
    <div className="flex justify-center mb-3">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeClasses}`}>
        {formatPresenceActivity(presence.activity)}
      </span>
    </div>
  );
}
