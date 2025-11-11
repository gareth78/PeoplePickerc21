import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Building2,
  User,
  UserPlus,
  Calendar,
  Clock,
  FileText,
  Loader2
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
  // Action handlers
  isCompose: boolean;
  supportsRecipients: boolean;
  inserting: boolean;
  onInsert: () => void;
  onAddTo: () => void;
  onAddCc: () => void;
  onAddBcc: () => void;
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
  isCompose,
  supportsRecipients,
  inserting,
  onInsert,
  onAddTo,
  onAddCc,
  onAddBcc,
}: DetailPanelProps) {
  const displayPhoto = photo ?? user.photo ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-0"
    >
      {/* Blue Hero Card - Full Width, Centered Content */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 -mx-4 px-4 py-6">
        <div className="flex flex-col items-center text-center text-white space-y-3">
          {/* Avatar */}
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt={user.displayName}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white/30 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm
                          flex items-center justify-center text-white font-bold text-xl
                          ring-2 ring-white/30 shadow-lg">
              {getInitials(user.displayName)}
            </div>
          )}

          {/* User Info - Centered */}
          <div className="space-y-1">
            <h2 className="text-lg font-bold">{user.displayName}</h2>
            {user.title && (
              <p className="text-primary-50 text-xs">{user.title}</p>
            )}
            {user.department && (
              <p className="text-primary-100 text-xs">{user.department}</p>
            )}
          </div>
        </div>
      </div>

      {/* Presence Section - Compact, Centered, No Label */}
      <div className="bg-white px-4 py-3 text-center border-b border-slate-200">
        {presenceError ? (
          <div className="text-xs text-red-600">{presenceError}</div>
        ) : (
          <div className="inline-flex flex-col items-center gap-1">
            <PresenceBadge presence={presence} refreshing={presenceRefreshing} size="md" />
            {presence?.fetchedAt && (
              <p className="text-xs text-slate-500">
                {formatTimestamp(presence.fetchedAt)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add as Recipient Section */}
      {isCompose && supportsRecipients && (
        <div className="bg-white px-4 py-3 border-b border-slate-200">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center">
            Add as Recipient
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onAddTo}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-2 px-3 rounded-lg
                       border border-slate-200 hover:border-primary-300
                       transition-all duration-200
                       hover:shadow-sm
                       flex items-center justify-center gap-1 text-xs"
            >
              <UserPlus size={14} />
              <span>To</span>
            </button>
            <button
              onClick={onAddCc}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-2 px-3 rounded-lg
                       border border-slate-200 hover:border-primary-300
                       transition-all duration-200
                       hover:shadow-sm
                       flex items-center justify-center gap-1 text-xs"
            >
              <UserPlus size={14} />
              <span>CC</span>
            </button>
            <button
              onClick={onAddBcc}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-2 px-3 rounded-lg
                       border border-slate-200 hover:border-primary-300
                       transition-all duration-200
                       hover:shadow-sm
                       flex items-center justify-center gap-1 text-xs"
            >
              <UserPlus size={14} />
              <span>BCC</span>
            </button>
          </div>
        </div>
      )}

      {/* Contact Details - Multi-line with Alternating Backgrounds */}
      <div className="bg-white border-b border-slate-200">
        {/* Build array of contact details that exist */}
        {[
          user.email && {
            icon: <Mail size={14} className="text-slate-400 flex-shrink-0" />,
            label: 'Email:',
            value: user.email,
          },
          user.mobilePhone && {
            icon: <Phone size={14} className="text-slate-400 flex-shrink-0" />,
            label: 'Phone:',
            value: user.mobilePhone,
          },
          user.title && {
            icon: <Briefcase size={14} className="text-slate-400 flex-shrink-0" />,
            label: 'Title:',
            value: user.title,
          },
          user.department && {
            icon: <Building2 size={14} className="text-slate-400 flex-shrink-0" />,
            label: 'Department:',
            value: user.department,
          },
          user.officeLocation && {
            icon: <MapPin size={14} className="text-slate-400 flex-shrink-0" />,
            label: 'Location:',
            value: user.officeLocation,
          },
          user.managerEmail && {
            icon: <User size={14} className="text-slate-400 flex-shrink-0" />,
            label: 'Manager:',
            value: user.managerEmail,
          },
          user.organization && {
            icon: <Building2 size={14} className="text-slate-400 flex-shrink-0" />,
            label: 'Company:',
            value: user.organization,
          },
        ]
          .filter((item): item is { icon: JSX.Element; label: string; value: string } => Boolean(item))
          .map((detail, index) => (
            <div
              key={index}
              className={`px-4 py-2.5 ${
                index % 2 === 0 ? 'bg-slate-50' : 'bg-white'
              }`}
            >
              {/* Line 1: Icon + Label */}
              <div className="flex items-center gap-2 mb-1">
                {detail.icon}
                <span className="text-xs text-slate-600 font-medium">{detail.label}</span>
              </div>
              {/* Line 2: Full value with NO truncation */}
              <div className="text-xs text-slate-900 break-words pl-6">
                {detail.value}
              </div>
            </div>
          ))}
      </div>

      {/* Out of Office */}
      <div className="bg-white px-4 py-3 border-b border-slate-200">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center">
          Out of Office
        </h4>

        {oooError ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 text-center">
            {oooError}
          </div>
        ) : ooo === undefined ? (
          <div className="text-xs text-slate-500 text-center">Checking...</div>
        ) : ooo === null || !ooo.isOOO ? (
          <div className="text-xs text-slate-600 text-center">No automatic replies enabled</div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
              <Calendar size={14} />
              <span>Automatic replies active</span>
            </div>
            {ooo.message && (
              <p className="text-xs text-amber-800 leading-relaxed">
                {ooo.message}
              </p>
            )}
            {(ooo.startTime || ooo.endTime) && (
              <div className="text-xs text-amber-700 space-y-0.5">
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

      {/* Insert Summary Button */}
      {isCompose && (
        <div className="bg-white px-4 py-3">
          <button
            onClick={onInsert}
            disabled={inserting}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                     text-white font-semibold py-2.5 px-4 rounded-lg
                     transition-all duration-200
                     hover:shadow-lg hover:shadow-primary-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 text-sm"
          >
            {inserting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Inserting...</span>
              </>
            ) : (
              <>
                <FileText size={16} />
                <span>Insert Summary</span>
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
