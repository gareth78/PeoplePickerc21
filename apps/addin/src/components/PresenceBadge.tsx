import type { PresenceResult } from '@people-picker/sdk';
import { motion } from 'framer-motion';

interface PresenceBadgeProps {
  presence: PresenceResult | null | undefined;
  refreshing?: boolean;
}

const AVAILABILITY_COLORS: Record<string, string> = {
  available: '#22c55e',
  busy: '#ef4444',
  do_not_disturb: '#ef4444',
  away: '#f97316',
  be_right_back: '#f97316',
  offline: '#94a3b8',
  unknown: '#64748b',
};

const normalize = (value: string | null | undefined): string => {
  if (!value) return 'unknown';
  return value.toLowerCase().replace(/\s+/g, '_');
};

export function PresenceBadge({ presence, refreshing = false }: PresenceBadgeProps) {
  if (presence === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
        <span>Checking presence…</span>
      </span>
    );
  }

  if (presence === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <div className="w-2 h-2 rounded-full bg-slate-300" />
        <span>Presence unavailable</span>
      </span>
    );
  }

  const availabilityKey = normalize(presence.availability);
  const badgeColor = AVAILABILITY_COLORS[availabilityKey] ?? AVAILABILITY_COLORS.unknown;
  const label = presence.availability ?? 'Unknown';
  const activity = presence.activity ? ` · ${presence.activity}` : '';

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        color: badgeColor,
        backgroundColor: `${badgeColor}15`,
      }}
    >
      <motion.div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: badgeColor }}
        animate={refreshing ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
      />
      <span>{refreshing ? 'Refreshing…' : `${label}${activity}`}</span>
    </motion.span>
  );
}
