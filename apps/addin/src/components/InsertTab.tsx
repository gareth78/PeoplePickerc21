import type { OOOResult, PresenceResult } from '@people-picker/sdk';
import type { EnhancedUser } from '../types';

interface InsertTabProps {
  user: EnhancedUser | null;
  presence: PresenceResult | null | undefined;
  ooo: OOOResult | null | undefined;
  isCompose: boolean;
  supportsRecipients: boolean;
  onInsert(): Promise<void>;
  onAddRecipient(kind: 'to' | 'cc' | 'bcc'): Promise<void>;
  inserting: boolean;
  statusMessage: { tone: 'success' | 'error' | 'info'; text: string } | null;
  recipientMessage: { tone: 'success' | 'error' | 'info'; text: string } | null;
}

export function InsertTab({
  user,
  presence,
  ooo,
  isCompose,
  supportsRecipients,
  onInsert,
  onAddRecipient,
  inserting,
  statusMessage,
  recipientMessage,
}: InsertTabProps) {
  return (
    <div className="tab-panel active" role="tabpanel" aria-labelledby="tab-insert">
      {!isCompose ? (
        <div className="error-state" role="alert">
          This tab is only available while composing a message.
        </div>
      ) : null}

      {!user ? (
        <div className="empty-state">Pick someone first to insert their details into your message.</div>
      ) : (
        <>
          <div className="details-card">
            <h3 style={{ marginTop: 0 }}>{user.displayName}</h3>
            <p className="muted">{user.title || '—'}</p>
            <p className="muted">{user.email}</p>
            <p className="muted" style={{ marginTop: 12, fontSize: '0.85em' }}>
              Summary will include: Name, Job Title, Email
            </p>
          </div>

          <div className="button-row" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className="button"
              onClick={() => onInsert()}
              disabled={!isCompose || !user || inserting}
            >
              {inserting ? 'Inserting…' : 'Insert Summary'}
            </button>
          </div>

          {statusMessage ? (
            <div
              className="details-card"
              role={statusMessage.tone === 'error' ? 'alert' : 'status'}
              style={{
                borderLeft: `4px solid ${
                  statusMessage.tone === 'error'
                    ? '#ef4444'
                    : statusMessage.tone === 'success'
                    ? '#22c55e'
                    : '#1250aa'
                }`,
              }}
            >
              {statusMessage.text}
            </div>
          ) : null}

          <h3 className="section-title">Add as Recipient</h3>
          {!supportsRecipients ? (
            <p className="muted">Recipient commands are only available in compose mode.</p>
          ) : null}
          <div className="button-row">
            <button
              type="button"
              className="button secondary"
              onClick={() => onAddRecipient('to')}
              disabled={!supportsRecipients || !user}
            >
              To
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => onAddRecipient('cc')}
              disabled={!supportsRecipients || !user}
            >
              CC
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => onAddRecipient('bcc')}
              disabled={!supportsRecipients || !user}
            >
              BCC
            </button>
          </div>

          {recipientMessage ? (
            <div
              className="details-card"
              style={{
                marginTop: 12,
                borderLeft: `4px solid ${
                  recipientMessage.tone === 'error'
                    ? '#ef4444'
                    : recipientMessage.tone === 'success'
                    ? '#22c55e'
                    : '#1250aa'
                }`,
              }}
              role={recipientMessage.tone === 'error' ? 'alert' : 'status'}
            >
              {recipientMessage.text}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
