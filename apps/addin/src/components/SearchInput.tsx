import { useCallback, useRef } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && value) {
      event.preventDefault();
      handleClear();
    }
  };

  const hasQuery = Boolean(value);

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {isSearching ? (
          <Loader2 className="text-primary-500 animate-spin" size={16} />
        ) : (
          <Search className="text-slate-400" size={16} />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        role="searchbox"
        inputMode="search"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-lg
                   focus:border-primary-400 focus:ring-2 focus:ring-primary-100
                   transition-all duration-200 outline-none
                   placeholder:text-slate-400
                   shadow-sm hover:shadow-md"
      />

      <button
        type="button"
        onClick={handleClear}
        className="absolute right-3 top-1/2 p-1.5 rounded-md
                   hover:bg-slate-100 active:bg-slate-200
                   transition-all duration-200 flex items-center justify-center
                   focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1"
        style={{
          opacity: hasQuery ? 1 : 0,
          transform: hasQuery
            ? 'translateY(-50%) scale(1)'
            : 'translateY(-50%) scale(0.95)',
          pointerEvents: hasQuery ? 'auto' : 'none',
        }}
        aria-label="Clear search"
      >
        <X className="text-slate-500 hover:text-slate-700 transition-colors" size={16} />
      </button>
    </div>
  );
}
