import { memo } from 'react';
import { Mail, Building2, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { PresenceBadge } from './PresenceBadge';
import type { EnhancedUser } from '../types';

interface UserCardProps {
  user: EnhancedUser;
  isSelected: boolean;
  onSelect: () => void;
  onHover?: () => void;
  index?: number;
}

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

export const UserCard = memo(function UserCard({
  user,
  isSelected,
  onSelect,
  onHover,
  index = 0,
}: UserCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={clsx(
        'w-full text-left p-4 rounded-xl border transition-all duration-200',
        'hover:shadow-medium hover:-translate-y-0.5',
        'focus-ring button-press',
        'animate-slide-up',
        isSelected
          ? 'bg-primary-50 border-primary-300 shadow-medium'
          : 'bg-white border-slate-200 shadow-soft hover:border-slate-300'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.displayName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-soft"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm shadow-soft ring-2 ring-white">
              {getInitials(user.displayName, user.firstName, user.lastName)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">{user.displayName}</h3>
          </div>

          {user.title && (
            <p className="text-sm text-slate-600 mb-2 line-clamp-1">{user.title}</p>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>

            {(user.department || user.officeLocation) && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {user.department ? (
                  <>
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{user.department}</span>
                  </>
                ) : null}
                {user.officeLocation && (
                  <>
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 ml-2" />
                    <span className="truncate">{user.officeLocation}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-2">
            <PresenceBadge presence={user.presence} />
          </div>
        </div>
      </div>
    </button>
  );
});
