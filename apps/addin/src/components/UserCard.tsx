import { motion } from 'framer-motion';
import type { EnhancedUser } from '../types';

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
      className={`w-full text-left bg-white rounded-lg p-3 border transition-all duration-200
                  group hover:shadow-md hover:-translate-y-0.5
                  ${
                    isSelected
                      ? 'border-primary-500 shadow-md shadow-primary-100 ring-2 ring-primary-50'
                      : 'border-slate-200 hover:border-primary-300'
                  }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {user.photo ? (
            <img
              src={user.photo}
              alt={user.displayName}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600
                          flex items-center justify-center text-white font-semibold text-xs
                          ring-1 ring-slate-200">
              {getInitials(user)}
            </div>
          )}
        </div>

        {/* Content - 4 line compact layout */}
        <div className="flex-1 min-w-0 space-y-0.5">
          {/* Line 1: Name */}
          <h3 className="font-semibold text-sm text-slate-900 truncate group-hover:text-primary-700 transition-colors">
            {user.displayName}
          </h3>

          {/* Line 2: Title */}
          {user.title && (
            <p className="text-xs text-slate-600 truncate">
              {user.title}
            </p>
          )}

          {/* Line 3: Department */}
          {user.department && (
            <p className="text-xs text-slate-500 truncate">
              {user.department}
            </p>
          )}

          {/* Line 4: Company/Organization */}
          {user.organization && (
            <p className="text-xs text-slate-500 truncate">
              {user.organization}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
