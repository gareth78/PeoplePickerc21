import { useState, useEffect } from 'react';
import type { PresenceData } from '@/lib/presence-utils';

export function usePresence(email: string | undefined) {
  const [presence, setPresence] = useState<PresenceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no email, clear presence and exit
    if (!email) {
      setPresence(null);
      return;
    }

    // Track if component is still mounted to prevent state updates after unmount
    let mounted = true;
    setLoading(true);

    fetch(`/api/graph/presence/${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        // Only update state if component is still mounted
        if (mounted && data.ok && data.data) {
          setPresence(data.data);
        }
      })
      .catch(err => {
        console.error('Presence fetch failed:', err);
        if (mounted) setPresence(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    // Cleanup function: prevent state updates after unmount
    return () => {
      mounted = false;
    };
  }, [email]); // Only re-run when email changes

  return { presence, loading };
}
