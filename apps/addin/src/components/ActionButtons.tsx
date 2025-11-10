import { motion } from 'framer-motion';
import { FileText, UserPlus, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  onInsert: () => void;
  onAddTo: () => void;
  onAddCc: () => void;
  onAddBcc: () => void;
  isCompose: boolean;
  supportsRecipients: boolean;
  inserting: boolean;
  disabled?: boolean;
}

export function ActionButtons({
  onInsert,
  onAddTo,
  onAddCc,
  onAddBcc,
  isCompose,
  supportsRecipients,
  inserting,
  disabled = false,
}: ActionButtonsProps) {
  if (!isCompose) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center"
      >
        <p className="text-sm text-amber-800 font-medium">
          Actions are only available when composing a message
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      {/* Insert Details Button */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
          Insert Details
        </h4>
        <button
          onClick={onInsert}
          disabled={disabled || inserting}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
                     text-white font-semibold py-3 px-6 rounded-xl
                     transition-all duration-200
                     hover:shadow-lg hover:shadow-primary-200 hover:-translate-y-0.5
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     flex items-center justify-center gap-2"
        >
          {inserting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Inserting...</span>
            </>
          ) : (
            <>
              <FileText size={18} />
              <span>Insert Summary</span>
            </>
          )}
        </button>
      </div>

      {/* Add as Recipient */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">
          Add as Recipient
        </h4>
        {!supportsRecipients ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <p className="text-sm text-slate-600">
              Recipient actions are only available in compose mode
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onAddTo}
              disabled={disabled}
              className="bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-lg
                       border-2 border-slate-200 hover:border-primary-300
                       transition-all duration-200
                       hover:shadow-md hover:-translate-y-0.5
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       flex items-center justify-center gap-1.5"
            >
              <UserPlus size={16} />
              <span>To</span>
            </button>
            <button
              onClick={onAddCc}
              disabled={disabled}
              className="bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-lg
                       border-2 border-slate-200 hover:border-primary-300
                       transition-all duration-200
                       hover:shadow-md hover:-translate-y-0.5
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       flex items-center justify-center gap-1.5"
            >
              <UserPlus size={16} />
              <span>CC</span>
            </button>
            <button
              onClick={onAddBcc}
              disabled={disabled}
              className="bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-lg
                       border-2 border-slate-200 hover:border-primary-300
                       transition-all duration-200
                       hover:shadow-md hover:-translate-y-0.5
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       flex items-center justify-center gap-1.5"
            >
              <UserPlus size={16} />
              <span>BCC</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
