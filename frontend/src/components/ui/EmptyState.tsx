import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';

export interface EmptyStateProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: Readonly<EmptyStateProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-card-border bg-surface-soft px-6 py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-low text-outline">
        {icon}
      </div>
      <h3 className="text-headline-md text-on-surface">{title}</h3>
      {description && <p className="max-w-sm text-body-sm text-on-surface-variant">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

export default EmptyState;
