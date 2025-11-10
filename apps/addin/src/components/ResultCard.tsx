import { ChevronRight } from 'lucide-react';
import { PresenceBadge } from './PresenceBadge';
import type { EnhancedUser } from '../types';

interface ResultCardProps {
  user: EnhancedUser;
  isSelected?: boolean;
  onClick: () => void;
  onHover?: () => void;
}

const getInitials = (user: EnhancedUser): string => {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length === 0) {
    return user.displayName.charAt(0).toUpperCase();
  }
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

export function ResultCard({ user, isSelected = false, onClick, onHover }: ResultCardProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={`w-full text-left group relative overflow-hidden animate-stagger ${
        isSelected
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-lg scale-[1.02]'
          : 'bg-white border-2 border-slate-200 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5'
      } rounded-xl p-4 transition-all duration-200 ease-out`}
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 ${!isSelected && 'group-hover:from-blue-500/5 group-hover:to-indigo-500/5'} transition-all duration-300`} />
      
      <div className="relative flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.displayName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-white">
              {getInitials(user)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">{user.displayName}</h3>
            <ChevronRight className={`w-5 h-5 flex-shrink-0 text-slate-400 ${!isSelected && 'group-hover:text-blue-500 group-hover:translate-x-0.5'} transition-all`} />
          </div>
          
          {user.title && (
            <p className="text-sm text-slate-600 truncate mb-1.5">{user.title}</p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            <PresenceBadge presence={user.presence} compact />
            <span className="text-xs text-slate-500 truncate">
              {user.department || user.officeLocation || user.email}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
