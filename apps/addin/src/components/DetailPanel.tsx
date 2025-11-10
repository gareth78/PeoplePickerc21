import { X, Mail, Briefcase, MapPin, User, RefreshCw, UserPlus } from 'lucide-react';
import { PresenceBadge } from './PresenceBadge';
import type { EnhancedUser } from '../types';
import type { OOOResult, PresenceResult } from '@people-picker/sdk';

interface DetailPanelProps {
  user: EnhancedUser | null;
  photo: string | null | undefined;
  presence: PresenceResult | null | undefined;
  presenceRefreshing: boolean;
  ooo: OOOResult | null | undefined;
  isCompose: boolean;
  supportsRecipients: boolean;
  onClose: () => void;
  onRefreshPresence: () => void;
  onInsert: () => void;
  onAddRecipient: (kind: 'to' | 'cc' | 'bcc') => void;
  inserting: boolean;
}

export function DetailPanel({
  user,
  photo,
  presence,
  presenceRefreshing,
  ooo,
  isCompose,
  supportsRecipients,
  onClose,
  onRefreshPresence,
  onInsert,
  onAddRecipient,
  inserting,
}: DetailPanelProps) {
  if (!user) return null;

  const displayPhoto = photo ?? user.photo ?? null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Contact Details</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Header */}
          <div className="flex items-center gap-4">
            {displayPhoto ? (
              <img
                src={displayPhoto}
                alt={user.displayName}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl ring-4 ring-white/30 shadow-lg">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold truncate mb-1">{user.displayName}</h3>
              <div className="flex items-center gap-2">
                <PresenceBadge presence={presence} refreshing={presenceRefreshing} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          {isCompose && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onInsert}
                  disabled={inserting}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Mail className="w-4 h-4" />
                  {inserting ? 'Inserting...' : 'Insert Details'}
                </button>
                {supportsRecipients && (
                  <button
                    onClick={() => onAddRecipient('to')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:border-blue-300 hover:bg-blue-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add to To
                  </button>
                )}
              </div>
              {supportsRecipients && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onAddRecipient('cc')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                  >
                    Add to CC
                  </button>
                  <button
                    onClick={() => onAddRecipient('bcc')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                  >
                    Add to BCC
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Contact Information</h4>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <p className="text-sm text-slate-900 font-medium break-all">{user.email}</p>
                </div>
              </div>

              {user.title && (
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">Job Title</p>
                    <p className="text-sm text-slate-900 font-medium">{user.title}</p>
                  </div>
                </div>
              )}

              {(user.department || user.officeLocation) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">Location</p>
                    <p className="text-sm text-slate-900 font-medium">
                      {[user.department, user.officeLocation].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              )}

              {user.managerEmail && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">Manager</p>
                    <p className="text-sm text-slate-900 font-medium">{user.managerEmail}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Presence Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Availability</h4>
              <button
                onClick={onRefreshPresence}
                disabled={presenceRefreshing}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Refresh presence"
              >
                <RefreshCw className={`w-4 h-4 ${presenceRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <PresenceBadge presence={presence} refreshing={presenceRefreshing} />
              {presence?.fetchedAt && (
                <p className="text-xs text-slate-500 mt-2">
                  Updated {new Date(presence.fetchedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Out of Office */}
          {ooo !== undefined && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Out of Office</h4>
              {ooo === null || !ooo.isOOO ? (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm text-slate-600">No automatic replies enabled</p>
                </div>
              ) : (
                <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
                  <p className="text-sm font-semibold text-amber-900 mb-2">🏖️ Out of Office</p>
                  {ooo.message && (
                    <p className="text-sm text-amber-800 mb-3 whitespace-pre-wrap">{ooo.message}</p>
                  )}
                  {(ooo.startTime || ooo.endTime) && (
                    <div className="text-xs text-amber-700 space-y-1">
                      {ooo.startTime && (
                        <p>Starts: {new Date(ooo.startTime).toLocaleString()}</p>
                      )}
                      {ooo.endTime && (
                        <p>Ends: {new Date(ooo.endTime).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
