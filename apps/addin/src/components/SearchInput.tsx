import { Search, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  isSearching = false,
  placeholder = 'Search people...',
  autoFocus = false,
}: SearchInputProps) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {isSearching ? (
          <Loader2 className="text-primary-500 animate-spin" size={16} />
        ) : (
          <Search className="text-slate-400" size={16} />
        )}
      </div>

      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="search-input-modern w-full pl-10 pr-14 py-2.5 text-sm bg-white/95 border border-white/60 rounded-xl
                   text-slate-900 placeholder:text-slate-400
                   shadow-lg shadow-primary-900/5 hover:shadow-xl
                   focus:border-white focus:ring-4 focus:ring-white/50
                   backdrop-blur-sm transition-all duration-200 outline-none appearance-none"
      />

      {value && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center
                     rounded-full border border-white/70 bg-white text-slate-500
                     shadow-md shadow-primary-900/10 hover:text-slate-700 hover:border-white
                     transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-0"
          aria-label="Clear search"
          title="Clear search"
        >
          <X className="text-current" size={16} />
        </motion.button>
      )}
    </div>
  );
}
