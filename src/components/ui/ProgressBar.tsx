import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export interface ProgressBarProps {
  readonly value: number;
  readonly className?: string;
}

export function ProgressBar({ value, className }: Readonly<ProgressBarProps>) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high', className)}
    >
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}

export default ProgressBar;
