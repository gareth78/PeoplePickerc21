import { motion } from 'framer-motion';
import { Search, Users, Inbox } from 'lucide-react';

interface EmptyStateProps {
  type: 'initial' | 'no-results' | 'no-selection';
  query?: string;
  minQueryLength?: number;
}

export function EmptyState({ type, query = '', minQueryLength = 2 }: EmptyStateProps) {
  const states = {
    initial: {
      icon: Search,
      title: 'Find people in your organization',
      description: `Type at least ${minQueryLength} characters to start searching for colleagues`,
      iconColor: 'text-primary-400',
      bgColor: 'bg-primary-50',
    },
    'no-results': {
      icon: Users,
      title: 'No people found',
      description: `We couldn't find anyone matching "${query}". Try a different name or email address.`,
      iconColor: 'text-slate-400',
      bgColor: 'bg-slate-50',
    },
    'no-selection': {
      icon: Inbox,
      title: 'Select a person to view details',
      description: 'Click on a search result to see their full profile and take actions',
      iconColor: 'text-slate-400',
      bgColor: 'bg-slate-50',
    },
  };

  const state = states[type];
  const Icon = state.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <div className={`${state.bgColor} ${state.iconColor} rounded-full p-6 mb-4`}>
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2 text-balance">
        {state.title}
      </h3>
      <p className="text-sm text-slate-600 max-w-xs text-balance leading-relaxed">
        {state.description}
      </p>
    </motion.div>
  );
}
