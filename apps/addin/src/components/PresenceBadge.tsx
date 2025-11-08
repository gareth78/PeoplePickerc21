import type { PresenceResult } from '@people-picker/sdk';

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
  if (!value) {
    return 'unknown';
  }
  return value.toLowerCase().replace(/\s+/g, '_');
};

export function PresenceBadge({ presence, refreshing = false }: PresenceBadgeProps) {
  if (presence === undefined) {
    return <span className="muted">Presence pending…</span>;
  }

  if (presence === null) {
    return <span className="muted">Presence unavailable</span>;
  }

  const availabilityKey = normalize(presence.availability);
  const badgeColor = AVAILABILITY_COLORS[availabilityKey] ?? AVAILABILITY_COLORS.unknown;
  const label = presence.availability ?? 'Unknown';
  const activity = presence.activity ? ` · ${presence.activity}` : '';

  return (
    <span
      className="presence-badge"
      style={{
        color: badgeColor,
        backgroundColor: `${badgeColor}1a`,
      }}
    >
      <span
        className="presence-dot"
        style={{
          backgroundColor: badgeColor,
        }}
      />
      {refreshing ? 'Refreshing…' : `${label}${activity}`}
    </span>
  );
}
