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

export function InlineNotification({
  id,
  message,
  type,
  onClose,
  duration = 4000,
}: InlineNotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
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

  const variants = {
    hidden: { opacity: 0, y: -20, height: 0 },
    visible: { 
      opacity: 1, 
      y: 0, 
      height: 'auto',
      transition: {
        opacity: { duration: 0.3, ease: 'easeOut' },
        y: { duration: 0.3, ease: 'easeOut' },
        height: { duration: 0.2, ease: 'easeIn' },
      },
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      height: 0,
      transition: {
        opacity: { duration: 0.2, ease: 'easeIn' },
        y: { duration: 0.2, ease: 'easeIn' },
        height: { duration: 0.2, ease: 'easeIn' },
      },
    },
  };

  return (
    <motion.div
      layout
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      className={`${colors[type]} border rounded-lg px-4 py-3 flex items-start gap-3 overflow-hidden`}
    >
      <Icon className={`${iconColors[type]} flex-shrink-0 mt-0.5`} size={20} />
      <p className="flex-1 text-sm font-medium leading-relaxed break-words">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity p-0.5"
        aria-label="Close notification"
      >
        <X size={18} className={iconColors[type]} />
      </button>
    </motion.div>
  );
}

export interface InlineNotificationContainerProps {
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>;
  onRemove: (id: string) => void;
  maxVisible?: number;
}

export function InlineNotificationContainer({
  notifications,
  onRemove,
  maxVisible = 3,
}: InlineNotificationContainerProps) {
  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <AnimatePresence mode="popLayout">
      {visibleNotifications.length > 0 && (
        <motion.div
          initial={false}
          className="space-y-2"
        >
          {visibleNotifications.map((notification) => (
            <InlineNotification
              key={notification.id}
              id={notification.id}
              message={notification.message}
              type={notification.type}
              onClose={() => onRemove(notification.id)}
              duration={notification.type === 'error' ? 5000 : 4000}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
