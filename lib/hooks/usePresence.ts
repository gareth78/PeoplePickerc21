import { useState, useEffect } from 'react';
import type { PresenceData } from '@/lib/presence-utils';

export function usePresence(email: string | undefined) {
  const [presence, setPresence] = useState<PresenceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setPresence(null);
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    let controller: AbortController | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchPresence = async (showLoading = false) => {
      if (!mounted) return;

      // Cancel any in-flight request before starting a new one
      if (controller) {
        controller.abort();
      }

      controller = new AbortController();

      if (showLoading) {
        setLoading(true);
      }

      try {
        const response = await fetch(`/api/graph/presence/${encodeURIComponent(email)}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (mounted && data.ok && data.data) {
          setPresence(data.data);
        } else if (mounted) {
          setPresence(null);
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }

        console.error('Presence fetch failed:', error);
        if (mounted) {
          setPresence(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchPresence(true);

    intervalId = setInterval(() => {
      void fetchPresence();
    }, 60_000);

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (controller) {
        controller.abort();
      }
    };
  }, [email]);

  return { presence, loading };
}
