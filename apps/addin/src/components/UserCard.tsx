import { motion } from 'framer-motion';
import { Mail, Briefcase, MapPin } from 'lucide-react';
import type { EnhancedUser } from '../types';
import { PresenceBadge } from './PresenceBadge';

interface UserCardProps {
  user: EnhancedUser;
  isSelected: boolean;
  onClick: () => void;
  onHover?: () => void;
  index: number;
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

export function UserCard({ user, isSelected, onClick, onHover, index }: UserCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={`w-full text-left bg-white rounded-xl p-4 border-2 transition-all duration-200
                  group hover:shadow-lg hover:-translate-y-0.5 
                  ${
                    isSelected
                      ? 'border-primary-500 shadow-lg shadow-primary-100 ring-4 ring-primary-50'
                      : 'border-slate-200 hover:border-primary-300'
                  }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.displayName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 
                          flex items-center justify-center text-white font-semibold text-sm
                          ring-2 ring-slate-100">
              {getInitials(user)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate group-hover:text-primary-700 transition-colors">
            {user.displayName}
          </h3>
          
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
            {user.title && (
              <span className="flex items-center gap-1 truncate">
                <Briefcase size={12} className="flex-shrink-0" />
                {user.title}
              </span>
            )}
            {user.title && (user.department || user.officeLocation) && (
              <span className="text-slate-300">•</span>
            )}
            {(user.department || user.officeLocation) && (
              <span className="flex items-center gap-1 truncate">
                <MapPin size={12} className="flex-shrink-0" />
                {user.department || user.officeLocation}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <Mail size={12} />
            <span className="truncate">{user.email}</span>
          </div>

          {user.presence && (
            <div className="mt-2">
              <PresenceBadge presence={user.presence} size="sm" />
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
