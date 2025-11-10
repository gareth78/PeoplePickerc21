import { useState, useRef, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PublicConfig } from '../types';

interface SettingsDropdownProps {
  config: PublicConfig;
  onClose?: () => void;
}

export function SettingsDropdown({ config, onClose }: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon"
        aria-label="Settings"
        aria-expanded={isOpen}
      >
        <Settings className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-40 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Settings</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn-icon p-1"
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Organization
                  </p>
                  <p className="text-sm text-slate-900 font-medium">{config.orgName}</p>
                  <p className="text-xs text-slate-500 mt-1">{config.appName}</p>
                </div>

                {config.orgLogoUrl && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      Logo
                    </p>
                    <img
                      src={config.orgLogoUrl}
                      alt={`${config.orgName} logo`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    People Picker v0.1.0
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
