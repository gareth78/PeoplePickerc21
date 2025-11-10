import { useState } from 'react';
import { Plus, FileText, Mail, MailPlus, MailMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EnhancedUser } from '../types';

interface ActionButtonsProps {
  user: EnhancedUser | null;
  isCompose: boolean;
  supportsRecipients: boolean;
  onInsert: () => Promise<void>;
  onAddRecipient: (kind: 'to' | 'cc' | 'bcc') => Promise<void>;
  inserting: boolean;
}

export function ActionButtons({
  user,
  isCompose,
  supportsRecipients,
  onInsert,
  onAddRecipient,
  inserting,
}: ActionButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user || !isCompose) return null;

  const actions = [
    {
      label: 'Insert Summary',
      icon: FileText,
      onClick: onInsert,
      disabled: inserting,
      primary: true,
    },
    ...(supportsRecipients
      ? [
          {
            label: 'Add to To',
            icon: Mail,
            onClick: () => onAddRecipient('to'),
            disabled: false,
            primary: false,
          },
          {
            label: 'Add to CC',
            icon: MailPlus,
            onClick: () => onAddRecipient('cc'),
            disabled: false,
            primary: false,
          },
          {
            label: 'Add to BCC',
            icon: MailMinus,
            onClick: () => onAddRecipient('bcc'),
            disabled: false,
            primary: false,
          },
        ]
      : []),
  ];

  return (
    <div className="fixed bottom-6 right-6 z-30">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-3 flex flex-col gap-2 items-end"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  disabled={action.disabled}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      action.primary
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center
          transition-colors duration-200 ${
            isOpen
              ? 'bg-slate-700 text-white'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        aria-label="Actions"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </div>
  );
}
