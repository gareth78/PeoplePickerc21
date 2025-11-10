import { useMemo } from 'react';
import { Search, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PresenceBadge } from './PresenceBadge';
import type { EnhancedUser } from '../types';

interface UnifiedSearchProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: EnhancedUser[];
  isSearching: boolean;
  error: string | null;
  selectedEmail: string | null;
  minQueryLength: number;
  onSelect: (user: EnhancedUser) => void;
  onHover?: (email: string) => void;
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

export function UnifiedSearch({
  query,
  onQueryChange,
  results,
  isSearching,
  error,
  selectedEmail,
  minQueryLength,
  onSelect,
  onHover,
}: UnifiedSearchProps) {
  const trimmed = query.trim();
  const showEmptyState = !isSearching && trimmed.length >= minQueryLength && results.length === 0 && !error;
  const showPrompt = trimmed.length < minQueryLength && !isSearching && !error;

  const orderedResults = useMemo(() => {
    return results.slice().sort((a, b) => 
      a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
    );
  }, [results]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by name, title, or email..."
          className="input pl-11 pr-4"
          autoFocus
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-600 animate-spin" />
        )}
      </div>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
            role="alert"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4">
        {/* Empty States */}
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Start typing to search</p>
            <p className="text-sm text-slate-500">
              Enter at least {minQueryLength} characters to find people
            </p>
          </motion.div>
        )}

        {showEmptyState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">No results found</p>
            <p className="text-sm text-slate-500">
              Try a different name or email address
            </p>
          </motion.div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card p-4 animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded skeleton w-3/4" />
                    <div className="h-3 bg-slate-200 rounded skeleton w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results List */}
        <AnimatePresence mode="popLayout">
          {!isSearching && orderedResults.length > 0 && (
            <div className="space-y-2">
              {orderedResults.map((user, index) => {
                const isActive = user.email === selectedEmail;
                const handleHover = () => onHover?.(user.email);

                return (
                  <motion.button
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    type="button"
                    onClick={() => onSelect(user)}
                    onMouseEnter={handleHover}
                    onFocus={handleHover}
                    className={`w-full text-left card p-4 transition-all duration-200 ${
                      isActive
                        ? 'border-primary-500 bg-primary-50 shadow-medium'
                        : 'card-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {user.photo ? (
                        <img
                          src={user.photo}
                          alt={user.displayName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="avatar w-12 h-12 text-sm">
                          {getInitials(user)}
                        </div>
                      )}

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-900 truncate">
                            {user.displayName}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600 truncate mb-1">
                          {user.title ? `${user.title} · ` : ''}
                          {user.department || user.officeLocation || user.email}
                        </p>
                        <PresenceBadge presence={user.presence} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
