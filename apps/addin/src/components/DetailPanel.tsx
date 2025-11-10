import { motion } from 'framer-motion';
import { 
  Mail, 
  Briefcase, 
  MapPin, 
  Building2, 
  User, 
  RefreshCw,
  Calendar,
  Clock
} from 'lucide-react';
import type { OOOResult, PresenceResult } from '@people-picker/sdk';
import type { EnhancedUser } from '../types';
import { PresenceBadge } from './PresenceBadge';

interface DetailPanelProps {
  user: EnhancedUser;
  photo: string | null | undefined;
  presence: PresenceResult | null | undefined;
  presenceRefreshing: boolean;
  presenceError: string | null;
  ooo: OOOResult | null | undefined;
  oooError: string | null;
  onRefreshPresence: () => void;
}

const formatTimestamp = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function DetailPanel({
  user,
  photo,
  presence,
  presenceRefreshing,
  presenceError,
  ooo,
  oooError,
  onRefreshPresence,
}: DetailPanelProps) {
  const displayPhoto = photo ?? user.photo ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 px-6 py-8">
        <div className="flex items-start gap-4">
          {/* Large Avatar */}
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt={user.displayName}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm
                          flex items-center justify-center text-white font-bold text-2xl
                          ring-4 ring-white/30 shadow-lg">
              {getInitials(user.displayName)}
            </div>
          )}

          {/* User Info */}
          <div className="flex-1 min-w-0 text-white">
            <h2 className="text-2xl font-bold mb-1 text-balance">{user.displayName}</h2>
            {user.title && (
              <p className="text-primary-50 text-sm font-medium mb-2">{user.title}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-primary-100">
              <Mail size={14} />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Presence Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Presence
            </h3>
            <button
              onClick={onRefreshPresence}
              disabled={presenceRefreshing}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              aria-label="Refresh presence"
            >
              <RefreshCw 
                size={16} 
                className={`text-slate-600 ${presenceRefreshing ? 'animate-spin' : ''}`} 
              />
            </button>
          </div>

          {presenceError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {presenceError}
            </div>
          ) : (
            <div className="space-y-2">
              <PresenceBadge presence={presence} refreshing={presenceRefreshing} size="lg" />
              {presence?.fetchedAt && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={12} />
                  Last updated: {formatTimestamp(presence.fetchedAt)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-4">
          {user.title && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Briefcase size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Title</span>
              </div>
              <p className="text-slate-900 font-medium">{user.title}</p>
            </div>
          )}

          {user.department && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Building2 size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Department</span>
              </div>
              <p className="text-slate-900 font-medium">{user.department}</p>
            </div>
          )}

          {user.officeLocation && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <MapPin size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Location</span>
              </div>
              <p className="text-slate-900 font-medium">{user.officeLocation}</p>
            </div>
          )}

          {user.managerEmail && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <User size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Manager</span>
              </div>
              <p className="text-slate-900 font-medium">{user.managerEmail}</p>
            </div>
          )}
        </div>

        {/* Out of Office */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
            Out of Office
          </h3>

          {oooError ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              {oooError}
            </div>
          ) : ooo === undefined ? (
            <div className="text-sm text-slate-500">Checking automatic replies...</div>
          ) : ooo === null || !ooo.isOOO ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
              No automatic replies are enabled.
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-2 text-amber-900 font-semibold">
                <Calendar size={16} />
                <span>Automatic replies active</span>
              </div>
              {ooo.message && (
                <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">
                  {ooo.message}
                </p>
              )}
              {(ooo.startTime || ooo.endTime) && (
                <div className="text-xs text-amber-700 space-y-1">
                  {ooo.startTime && (
                    <div>Starts: {new Date(ooo.startTime).toLocaleString()}</div>
                  )}
                  {ooo.endTime && (
                    <div>Ends: {new Date(ooo.endTime).toLocaleString()}</div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
