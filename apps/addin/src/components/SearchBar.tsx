import { Search } from 'lucide-react';
import { clsx } from 'clsx';

interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  minQueryLength: number;
  isSearching?: boolean;
}

export function SearchBar({ query, onQueryChange, minQueryLength, isSearching }: SearchBarProps) {
  const showHint = query.trim().length < minQueryLength && !isSearching;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by name, title, or email..."
          className={clsx(
            'w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl',
            'text-slate-900 placeholder:text-slate-400',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'hover:border-slate-300',
            'shadow-soft'
          )}
          autoFocus
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {showHint && (
        <p className="mt-2 text-xs text-slate-500 px-1">
          Enter at least {minQueryLength} characters to search
        </p>
      )}
    </div>
  );
}
