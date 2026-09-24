import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  readonly children: ReactNode;
  readonly label: string;
  readonly variant?: 'default' | 'filled';
  readonly size?: number;
}

export function IconButton({
  children,
  label,
  variant = 'default',
  size = 40,
  className,
  ...props
}: Readonly<IconButtonProps>) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer',
        'hover:scale-105 active:scale-95',
        variant === 'default'
          ? 'text-on-surface-variant hover:bg-surface-container-high'
          : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high',
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default IconButton;
