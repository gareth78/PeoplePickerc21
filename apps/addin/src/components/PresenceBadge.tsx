import { clsx } from 'clsx';
import type { PresenceResult } from '@people-picker/sdk';

interface PresenceBadgeProps {
  presence: PresenceResult | null | undefined;
  refreshing?: boolean;
}

const AVAILABILITY_CONFIG: Record<string, { color: string; bgColor: string; pulse?: boolean }> = {
  available: {
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
  },
  busy: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  do_not_disturb: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
  away: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  be_right_back: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  offline: {
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  unknown: {
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
};

const normalize = (value: string | null | undefined): string => {
  if (!value) {
    return 'unknown';
  }
  return value.toLowerCase().replace(/\s+/g, '_');
};

export function PresenceBadge({ presence, refreshing = false }: PresenceBadgeProps) {
  if (presence === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
        Pending…
      </span>
    );
  }

  if (presence === null) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        Unavailable
      </span>
    );
  }

  const availabilityKey = normalize(presence.availability);
  const config = AVAILABILITY_CONFIG[availabilityKey] ?? AVAILABILITY_CONFIG.unknown;
  const label = presence.availability ?? 'Unknown';
  const activity = presence.activity ? ` · ${presence.activity}` : '';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
        config.color,
        config.bgColor
      )}
    >
      <span
        className={clsx(
          'w-2 h-2 rounded-full',
          refreshing && 'animate-pulse'
        )}
        style={{
          backgroundColor: 'currentColor',
        }}
      />
      {refreshing ? 'Refreshing…' : `${label}${activity}`}
    </span>
  );
}
