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
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-lg
                   focus:border-primary-400 focus:ring-2 focus:ring-primary-100
                   transition-all duration-200 outline-none
                   placeholder:text-slate-400
                   shadow-sm hover:shadow-md"
      />

      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full
                     hover:bg-slate-100 active:bg-slate-200
                     transition-all duration-200 flex items-center justify-center
                     focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1
                     group"
          aria-label="Clear search"
        >
          <X className="text-slate-400 group-hover:text-slate-600 transition-colors" size={14} />
        </motion.button>
      )}
    </div>
  );
}
