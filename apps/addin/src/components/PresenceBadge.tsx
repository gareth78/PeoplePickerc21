import type { PresenceResult } from '@people-picker/sdk';

interface PresenceBadgeProps {
  presence: PresenceResult | null | undefined;
  refreshing?: boolean;
  compact?: boolean;
}

const AVAILABILITY_CONFIG: Record<string, { color: string; label: string; pulseColor: string }> = {
  available: { color: 'bg-green-500', label: 'Available', pulseColor: 'bg-green-400' },
  busy: { color: 'bg-red-500', label: 'Busy', pulseColor: 'bg-red-400' },
  do_not_disturb: { color: 'bg-red-600', label: 'Do Not Disturb', pulseColor: 'bg-red-500' },
  away: { color: 'bg-yellow-500', label: 'Away', pulseColor: 'bg-yellow-400' },
  be_right_back: { color: 'bg-yellow-400', label: 'Be Right Back', pulseColor: 'bg-yellow-300' },
  offline: { color: 'bg-slate-400', label: 'Offline', pulseColor: 'bg-slate-300' },
  unknown: { color: 'bg-slate-400', label: 'Unknown', pulseColor: 'bg-slate-300' },
};

const normalize = (value: string | null | undefined): string => {
  if (!value) return 'unknown';
  return value.toLowerCase().replace(/\s+/g, '_');
};

export function PresenceBadge({ presence, refreshing = false, compact = false }: PresenceBadgeProps) {
  if (presence === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
        Loading...
      </span>
    );
  }

  if (presence === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <span className="w-2 h-2 rounded-full bg-slate-300" />
        Unavailable
      </span>
    );
  }

  const availabilityKey = normalize(presence.availability);
  const config = AVAILABILITY_CONFIG[availabilityKey] ?? AVAILABILITY_CONFIG.unknown;
  const label = presence.availability ?? 'Unknown';
  const activity = presence.activity && !compact ? ` · ${presence.activity}` : '';

  if (compact) {
    return (
      <span className="relative inline-flex items-center">
        <span className={`w-2 h-2 rounded-full ${config.color}`} />
        {availabilityKey === 'available' && (
          <>
            <span className={`absolute w-2 h-2 rounded-full ${config.pulseColor} animate-ping opacity-75`} />
            <span className={`absolute w-2 h-2 rounded-full ${config.color} animate-pulse-dot`} />
          </>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
      <span className="relative flex items-center">
        <span className={`w-2 h-2 rounded-full ${config.color} z-10`} />
        {availabilityKey === 'available' && (
          <>
            <span className={`absolute w-2 h-2 rounded-full ${config.pulseColor} animate-ping opacity-75`} />
            <span className={`absolute w-2 h-2 rounded-full ${config.color} animate-pulse-dot`} />
          </>
        )}
      </span>
      <span className="text-xs font-medium text-slate-700">
        {refreshing ? 'Refreshing...' : `${label}${activity}`}
      </span>
    </span>
  );
}
