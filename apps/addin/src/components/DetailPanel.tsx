import { X, Mail, Building2, User, RefreshCw, FileText, UserPlus } from 'lucide-react';
import { clsx } from 'clsx';
import { PresenceBadge } from './PresenceBadge';
import type { EnhancedUser } from '../types';
import type { OOOResult, PresenceResult } from '@people-picker/sdk';

interface DetailPanelProps {
  user: EnhancedUser | null;
  photo: string | null | undefined;
  presence: PresenceResult | null | undefined;
  presenceError: string | null;
  presenceRefreshing: boolean;
  ooo: OOOResult | null | undefined;
  oooError: string | null;
  isCompose: boolean;
  supportsRecipients: boolean;
  onClose: () => void;
  onRefreshPresence?: () => void;
  onInsert?: () => Promise<void>;
  onAddRecipient?: (kind: 'to' | 'cc' | 'bcc') => Promise<void>;
  inserting?: boolean;
}

const formatTimestamp = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const getInitials = (displayName: string, firstName?: string | null, lastName?: string | null): string => {
  const parts = [firstName, lastName].filter(Boolean);
  if (parts.length === 0) {
    return displayName.charAt(0).toUpperCase();
  }
  return parts
    .map((part) => part!.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

export function DetailPanel({
  user,
  photo,
  presence,
  presenceError,
  presenceRefreshing,
  ooo,
  oooError,
  isCompose,
  supportsRecipients,
  onClose,
  onRefreshPresence,
  onInsert,
  onAddRecipient,
  inserting = false,
}: DetailPanelProps) {
  if (!user) return null;

  const displayPhoto = photo ?? user.photo ?? null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={clsx(
          'fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-large z-50',
          'flex flex-col overflow-hidden',
          'animate-slide-in-right'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-primary-50 to-white">
          <h2 className="text-lg font-semibold text-slate-900">Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors focus-ring"
            aria-label="Close panel"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-200">
            {displayPhoto ? (
              <img
                src={displayPhoto}
                alt={user.displayName}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-large mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-2xl shadow-large mb-4 ring-4 ring-white">
                {getInitials(user.displayName, user.firstName, user.lastName)}
              </div>
            )}

            <h3 className="text-xl font-semibold text-slate-900 mb-1">{user.displayName}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>

            <div className="mb-4">
              <PresenceBadge presence={presence} refreshing={presenceRefreshing} />
            </div>

            {presence?.fetchedAt && (
              <p className="text-xs text-slate-500">
                Last updated: {formatTimestamp(presence.fetchedAt)}
              </p>
            )}

            {presenceError && (
              <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                {presenceError}
              </div>
            )}

            {onRefreshPresence && (
              <button
                onClick={onRefreshPresence}
                disabled={presenceRefreshing}
                className="mt-4 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring flex items-center gap-2"
              >
                <RefreshCw className={clsx('w-4 h-4', presenceRefreshing && 'animate-spin')} />
                {presenceRefreshing ? 'Refreshing...' : 'Refresh presence'}
              </button>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            {user.title && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  <User className="w-3.5 h-3.5" />
                  Title
                </div>
                <p className="text-sm text-slate-900">{user.title}</p>
              </div>
            )}

            {(user.department || user.officeLocation) && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Organization
                </div>
                <p className="text-sm text-slate-900">
                  {[user.department, user.officeLocation].filter(Boolean).join(' · ')}
                </p>
              </div>
            )}

            {user.managerEmail && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  <User className="w-3.5 h-3.5" />
                  Manager
                </div>
                <p className="text-sm text-slate-900">{user.managerEmail}</p>
              </div>
            )}
          </div>

          {/* Out of Office Section */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Out of Office</h4>
            {oooError ? (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                {oooError}
              </div>
            ) : ooo === undefined ? (
              <p className="text-xs text-slate-500">Checking automatic replies…</p>
            ) : ooo === null ? (
              <p className="text-xs text-slate-500">No automatic replies enabled</p>
            ) : ooo.isOOO ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-900 mb-2">Automatic replies active</p>
                {ooo.message && (
                  <p className="text-xs text-amber-800 whitespace-pre-wrap mb-2">{ooo.message}</p>
                )}
                <div className="text-xs text-amber-700">
                  {ooo.startTime && `Starts: ${new Date(ooo.startTime).toLocaleString()}`}
                  {ooo.endTime && ` · Ends: ${new Date(ooo.endTime).toLocaleString()}`}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Actions Footer */}
        {isCompose && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
            {onInsert && (
              <button
                onClick={onInsert}
                disabled={inserting}
                className={clsx(
                  'w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white',
                  'rounded-lg font-semibold text-sm',
                  'hover:from-primary-700 hover:to-primary-800',
                  'transition-all duration-200 shadow-medium hover:shadow-large',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'button-press focus-ring',
                  'flex items-center justify-center gap-2'
                )}
              >
                <FileText className="w-4 h-4" />
                {inserting ? 'Inserting...' : 'Insert Summary'}
              </button>
            )}

            {supportsRecipients && onAddRecipient && (
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Add as Recipient</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['to', 'cc', 'bcc'] as const).map((kind) => (
                    <button
                      key={kind}
                      onClick={() => onAddRecipient(kind)}
                      className={clsx(
                        'px-3 py-2.5 bg-white border border-slate-300 text-slate-700',
                        'rounded-lg font-medium text-xs uppercase tracking-wide',
                        'hover:bg-slate-50 hover:border-slate-400',
                        'transition-all duration-200 shadow-soft hover:shadow-medium',
                        'button-press focus-ring',
                        'flex items-center justify-center gap-1.5'
                      )}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {kind}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
