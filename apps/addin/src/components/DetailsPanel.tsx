import { X, RefreshCw, Mail, MapPin, Briefcase, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { PresenceBadge } from './PresenceBadge';
import type { EnhancedUser } from '../types';
import type { OOOResult, PresenceResult } from '@people-picker/sdk';

interface DetailsPanelProps {
  user: EnhancedUser | null;
  photo: string | null | undefined;
  presence: PresenceResult | null | undefined;
  presenceError: string | null;
  presenceRefreshing: boolean;
  ooo: OOOResult | null | undefined;
  oooError: string | null;
  onClose: () => void;
  onRefreshPresence?: () => void;
}

const formatTimestamp = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export function DetailsPanel({
  user,
  photo,
  presence,
  presenceError,
  presenceRefreshing,
  ooo,
  oooError,
  onClose,
  onRefreshPresence,
}: DetailsPanelProps) {
  if (!user) return null;

  const displayPhoto = photo ?? user.photo ?? null;
  const getInitials = () => {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    if (parts.length === 0) return user.displayName.charAt(0).toUpperCase();
    return parts.map((p) => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl flex flex-col"
    >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Details</h2>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            {displayPhoto ? (
              <img
                src={displayPhoto}
                alt={user.displayName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
              />
            ) : (
              <div className="avatar w-20 h-20 text-xl">
                {getInitials()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-slate-900 mb-1 truncate">
                {user.displayName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <PresenceBadge presence={presence} refreshing={presenceRefreshing} />
              {presence?.fetchedAt && (
                <p className="text-xs text-slate-500 mt-2">
                  Last updated: {formatTimestamp(presence.fetchedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Presence Error */}
          {presenceError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {presenceError}
            </div>
          )}

          {/* Refresh Button */}
          {onRefreshPresence && (
            <button
              onClick={onRefreshPresence}
              disabled={presenceRefreshing}
              className="btn btn-secondary w-full"
            >
              <RefreshCw className={`w-4 h-4 ${presenceRefreshing ? 'animate-spin' : ''}`} />
              {presenceRefreshing ? 'Refreshing...' : 'Refresh Presence'}
            </button>
          )}

          {/* Details Grid */}
          <div className="space-y-4">
            {user.title && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Title
                  </p>
                  <p className="text-sm text-slate-900">{user.title}</p>
                </div>
              </div>
            )}

            {(user.department || user.officeLocation) && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Organization
                  </p>
                  <p className="text-sm text-slate-900">
                    {[user.department, user.officeLocation].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
            )}

            {user.managerEmail && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Manager
                  </p>
                  <p className="text-sm text-slate-900">{user.managerEmail}</p>
                </div>
              </div>
            )}
          </div>

          {/* Out of Office */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Out of Office
            </h4>
            {oooError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {oooError}
              </div>
            ) : ooo === undefined ? (
              <div className="text-sm text-slate-500">Checking automatic replies…</div>
            ) : ooo === null ? (
              <div className="text-sm text-slate-500">No automatic replies enabled</div>
            ) : ooo.isOOO ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="font-semibold text-amber-900 mb-2">Automatic replies active</p>
                {ooo.message && (
                  <p className="text-sm text-amber-800 whitespace-pre-wrap mb-3">{ooo.message}</p>
                )}
                <div className="text-xs text-amber-700">
                  {ooo.startTime && `Starts: ${new Date(ooo.startTime).toLocaleString()}`}
                  {ooo.endTime && ` · Ends: ${new Date(ooo.endTime).toLocaleString()}`}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
  );
}
