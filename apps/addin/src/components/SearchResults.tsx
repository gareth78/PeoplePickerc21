import { useMemo } from 'react';
import { Users, SearchX } from 'lucide-react';
import { UserCard } from './UserCard';
import type { EnhancedUser } from '../types';

interface SearchResultsProps {
  results: EnhancedUser[];
  isSearching: boolean;
  error: string | null;
  query: string;
  minQueryLength: number;
  selectedEmail: string | null;
  onSelect: (user: EnhancedUser) => void;
  onHover?: (email: string) => void;
}

export function SearchResults({
  results,
  isSearching,
  error,
  query,
  minQueryLength,
  selectedEmail,
  onSelect,
  onHover,
}: SearchResultsProps) {
  const orderedResults = useMemo(() => {
    return results.slice().sort((a, b) => 
      a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
    );
  }, [results]);

  const trimmed = query.trim();
  const showEmptyState = !isSearching && trimmed.length >= minQueryLength && results.length === 0 && !error;
  const showInitialState = trimmed.length < minQueryLength && !isSearching;

  // Loading skeleton
  if (isSearching) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-white border border-slate-200 shadow-soft animate-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <SearchX className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-sm font-medium text-slate-900 mb-1">Search failed</p>
        <p className="text-xs text-slate-500 text-center">{error}</p>
      </div>
    );
  }

  // Empty state
  if (showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <SearchX className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900 mb-1">No results found</p>
        <p className="text-xs text-slate-500 text-center">
          Try a different name or email address
        </p>
      </div>
    );
  }

  // Initial state
  if (showInitialState) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-primary-600" />
        </div>
        <p className="text-sm font-medium text-slate-900 mb-1">Start searching</p>
        <p className="text-xs text-slate-500 text-center">
          Enter at least {minQueryLength} characters to find people
        </p>
      </div>
    );
  }

  // Results
  return (
    <div className="space-y-3">
      {orderedResults.map((user, index) => (
        <UserCard
          key={user.id}
          user={user}
          isSelected={user.email === selectedEmail}
          onSelect={() => onSelect(user)}
          onHover={() => onHover?.(user.email)}
          index={index}
        />
      ))}
    </div>
  );
}
