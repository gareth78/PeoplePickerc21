import type { OOOResult, PresenceResult } from '@people-picker/sdk';
import { PresenceBadge } from './PresenceBadge';
import type { EnhancedUser } from '../types';

interface DetailsTabProps {
  user: EnhancedUser | null;
  photo: string | null | undefined;
  presence: PresenceResult | null | undefined;
  presenceError: string | null;
  presenceRefreshing: boolean;
  ooo: OOOResult | null | undefined;
  oooError: string | null;
  onRefreshPresence?: () => void;
}

const formatTimestamp = (value: string | null | undefined) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return `${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
};

const stripHtml = (html: string | null | undefined): string => {
  if (!html) return '';
  // Remove HTML tags and decode HTML entities
  return html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&')  // Replace &amp; with &
    .replace(/&lt;/g, '<')   // Replace &lt; with <
    .replace(/&gt;/g, '>')   // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'")  // Replace &#39; with '
    .trim();
};

export function DetailsTab({
  user,
  photo,
  presence,
  presenceError,
  presenceRefreshing,
  ooo,
  oooError,
  onRefreshPresence,
}: DetailsTabProps) {
  if (!user) {
    return (
      <div className="tab-panel active" role="tabpanel" aria-labelledby="tab-details">
        <div className="empty-state">Select someone from search to view their details.</div>
      </div>
    );
  }

  const displayPhoto = photo ?? user.photo ?? null;

  return (
    <div className="tab-panel active" role="tabpanel" aria-labelledby="tab-details">
      <div className="details-card">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt={user.displayName}
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span className="avatar" style={{ width: 72, height: 72, fontSize: '1.4rem' }} aria-hidden>
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h2 style={{ margin: 0 }}>{user.displayName}</h2>
            <span className="muted">{user.email}</span>
            <PresenceBadge presence={presence} ooo={ooo} refreshing={presenceRefreshing} />
            <small className="muted">Last updated: {formatTimestamp(presence?.fetchedAt)}</small>
          </div>
        </div>

        {presenceError ? (
          <div className="error-state" role="alert">
            {presenceError}
          </div>
        ) : null}

        <div className="details-grid">
          {user.title ? (
            <div>
              <p className="section-title">Title</p>
              <p>{user.title}</p>
            </div>
          ) : null}

          {user.department || user.officeLocation ? (
            <div>
              <p className="section-title">Organization</p>
              <p>{[user.department, user.officeLocation].filter(Boolean).join(' · ')}</p>
            </div>
          ) : null}

          {user.managerEmail ? (
            <div>
              <p className="section-title">Manager</p>
              <p>{user.managerEmail}</p>
            </div>
          ) : null}
        </div>

        {typeof onRefreshPresence === 'function' ? (
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="button secondary"
              onClick={() => onRefreshPresence()}
              disabled={presenceRefreshing}
            >
              {presenceRefreshing ? 'Refreshing…' : 'Refresh presence'}
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="section-title">Out of Office</h3>
        {oooError ? (
          <div className="error-state" role="alert">
            {oooError}
          </div>
        ) : null}
        {ooo === undefined ? (
          <div className="muted">Checking automatic replies…</div>
        ) : null}
        {ooo === null ? (
          <div className="muted">No automatic replies are enabled.</div>
        ) : null}
        {ooo?.isOOO ? (
          <div className="details-card" style={{ marginTop: 12 }}>
            <p style={{ marginTop: 0, fontWeight: 600 }}>Automatic replies active</p>
            {ooo.message ? <p style={{ whiteSpace: 'pre-wrap' }}>{stripHtml(ooo.message)}</p> : null}
            <small className="muted">
              {ooo.startTime ? `Starts: ${new Date(ooo.startTime).toLocaleString()}` : ''}
              {ooo.endTime ? ` · Ends: ${new Date(ooo.endTime).toLocaleString()}` : ''}
            </small>
          </div>
        ) : null}
      </div>
    </div>
  );
}
