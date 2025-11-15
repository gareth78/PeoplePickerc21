import { motion, AnimatePresence, Variants } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

export interface OverlayToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
  index: number;
  maxVisible?: number;
}

export function OverlayToast({
  id,
  message,
  type,
  onClose,
  duration = 3000,
  index,
  maxVisible = 3,
}: OverlayToastProps) {
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

  // Slide in from top (-100px), fade out and slide up on exit
  const variants: Variants = {
    hidden: { 
      opacity: 0, 
      y: -100,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  // Stack offset: each toast offset by 8px down from previous (newest on top)
  // Newest toast (index 0) appears at top: 60px, subsequent toasts stack below
  const topOffset = 60 + (index * 8);
  // Higher z-index for newer toasts so they appear above older ones
  const zIndex = 30 + (maxVisible - index);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      style={{
        position: 'absolute',
        top: `${topOffset}px`,
        left: '16px',
        right: '16px',
        width: 'calc(100% - 32px)',
        zIndex: zIndex,
      }}
      className={`${colors[type]} border rounded-lg px-4 py-3 flex items-start gap-3 shadow-lg backdrop-blur-sm`}
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

export interface OverlayToastContainerProps {
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>;
  onRemove: (id: string) => void;
  maxVisible?: number;
}

export function OverlayToastContainer({
  notifications,
  onRemove,
  maxVisible = 3,
}: OverlayToastContainerProps) {
  // Show newest notifications first (reverse order for stacking)
  const visibleNotifications = notifications.slice(0, maxVisible).reverse();

  return (
    <>
      {/* Semi-transparent backdrop when notifications are visible */}
      {visibleNotifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            top: '60px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            pointerEvents: 'none',
            zIndex: 25,
          }}
        />
      )}

      {/* Toast notifications */}
      <AnimatePresence>
        {visibleNotifications.map((notification, index) => (
          <OverlayToast
            key={notification.id}
            id={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => onRemove(notification.id)}
            duration={notification.type === 'error' ? 5000 : 3000}
            index={index}
            maxVisible={maxVisible}
          />
        ))}
      </AnimatePresence>
    </>
  );
}

// Keep old exports for backward compatibility during migration
export interface InlineNotificationProps extends OverlayToastProps {}
export const InlineNotification = OverlayToast;
export interface InlineNotificationContainerProps extends OverlayToastContainerProps {}
export const InlineNotificationContainer = OverlayToastContainer;
