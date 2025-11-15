import type { PresenceResult, OOOResult } from '@people-picker/sdk';
import { Circle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PresenceBadgeProps {
  presence: PresenceResult | null | undefined;
  ooo?: OOOResult | null | undefined;
  refreshing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const AVAILABILITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  available: { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    dot: 'fill-emerald-500 text-emerald-500' 
  },
  busy: { 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    dot: 'fill-red-500 text-red-500' 
  },
  do_not_disturb: { 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    dot: 'fill-red-500 text-red-500' 
  },
  away: { 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    dot: 'fill-amber-500 text-amber-500' 
  },
  be_right_back: { 
    bg: 'bg-amber-50', 
    text: 'text-amber-700', 
    dot: 'fill-amber-500 text-amber-500' 
  },
  offline: { 
    bg: 'bg-slate-50', 
    text: 'text-slate-600', 
    dot: 'fill-slate-400 text-slate-400' 
  },
  unknown: { 
    bg: 'bg-slate-50', 
    text: 'text-slate-600', 
    dot: 'fill-slate-400 text-slate-400' 
  },
};

const normalize = (value: string | null | undefined): string => {
  if (!value) return 'unknown';
  return value.toLowerCase().replace(/\s+/g, '_');
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export function PresenceBadge({
  presence,
  ooo,
  refreshing = false,
  size = 'md',
  showLabel = true
}: PresenceBadgeProps) {
  if (presence === undefined) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full ${SIZE_CLASSES[size]} bg-slate-50 text-slate-600`}>
        {showLabel && <span>Checking presence...</span>}
      </span>
    );
  }

  if (presence === null) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full ${SIZE_CLASSES[size]} bg-slate-50 text-slate-600`}>
        {showLabel && <span>Presence unavailable</span>}
      </span>
    );
  }

  const availabilityKey = normalize(presence.availability);
  const colors = AVAILABILITY_COLORS[availabilityKey] ?? AVAILABILITY_COLORS.unknown;
  const label = presence.availability ?? 'Unknown';
  const hasOutOfOffice = ooo?.isOOO === true;

  // Build the display text based on OOO status
  let displayText = label;

  if (hasOutOfOffice) {
    // Always show both presence and OOO indicator when OOO is active
    displayText = `${label} · Out of Office`;
  } else if (presence.activity && presence.activity.toLowerCase() !== label.toLowerCase()) {
    // Only show activity if it's different from availability to avoid duplicates like "Offline · Offline"
    displayText = `${label} · ${presence.activity}`;
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full ${SIZE_CLASSES[size]} ${colors.bg} ${colors.text} font-medium`}
    >
      <Circle
        size={size === 'sm' ? 8 : size === 'md' ? 10 : 12}
        className={`${colors.dot} ${availabilityKey === 'available' ? 'presence-dot-animated' : ''}`}
      />
      {showLabel && (
        <span>
          {refreshing ? 'Refreshing...' : displayText}
        </span>
      )}
    </motion.span>
  );
}
