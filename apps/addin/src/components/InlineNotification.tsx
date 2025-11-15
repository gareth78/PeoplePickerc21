import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

export interface InlineNotificationProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export function InlineNotification({ message, type, onClose, duration = 4000 }: InlineNotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
  };

  const iconColors = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-amber-500',
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: undefined }}
      exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
      transition={{
        opacity: { duration: 0.3, ease: [0, 0, 0.2, 1] },
        y: { duration: 0.3, ease: [0, 0, 0.2, 1] },
        height: { duration: 0.2, ease: [0.4, 0, 1, 1] },
        marginBottom: { duration: 0.2, ease: [0.4, 0, 1, 1] },
      }}
      className={`${colors[type]} border rounded-lg px-4 py-3 flex items-start gap-3 shadow-sm overflow-hidden`}
    >
      <Icon className={`${iconColors[type]} flex-shrink-0 mt-0.5`} size={20} />
      <p className="flex-1 text-sm font-medium leading-relaxed break-words">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity p-0.5 -mt-0.5 -mr-0.5"
        aria-label="Close notification"
      >
        <X size={18} className={iconColors[type]} />
      </button>
    </motion.div>
  );
}

interface InlineNotificationContainerProps {
  notifications: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>;
  onClose: (id: string) => void;
  maxVisible?: number;
}

export function InlineNotificationContainer({
  notifications,
  onClose,
  maxVisible = 3,
}: InlineNotificationContainerProps) {
  const visibleNotifications = notifications.slice(0, maxVisible);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => (
          <InlineNotification
            key={notification.id}
            id={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => onClose(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
