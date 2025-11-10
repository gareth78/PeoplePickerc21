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
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        {isSearching ? (
          <Loader2 className="text-primary-500 animate-spin" size={20} />
        ) : (
          <Search className="text-slate-400" size={20} />
        )}
      </div>

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-12 pr-12 py-4 text-base bg-white border-2 border-slate-200 rounded-2xl
                   focus:border-primary-500 focus:ring-4 focus:ring-primary-100 
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
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full
                     hover:bg-slate-100 transition-colors"
          aria-label="Clear search"
        >
          <X className="text-slate-400" size={18} />
        </motion.button>
      )}
    </div>
  );
}
