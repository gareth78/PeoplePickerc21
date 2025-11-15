import { Search, X, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-12 py-2.5 text-sm bg-white border border-slate-200 rounded-lg
                   focus:border-primary-400 focus:ring-2 focus:ring-primary-100
                   transition-all duration-200 outline-none
                   placeholder:text-slate-400
                   shadow-sm hover:shadow-md"
      />

      <AnimatePresence>
        {value && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center
                       rounded-full border border-white/80 bg-white/90 text-slate-500 shadow-sm
                       hover:bg-white hover:text-slate-700 hover:shadow transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1"
            aria-label="Clear search"
          >
            <X className="transition-colors" size={14} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
