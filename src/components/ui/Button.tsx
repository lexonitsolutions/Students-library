import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: ReactNode;
  readonly iconPosition?: 'left' | 'right';
  readonly fullWidth?: boolean;
  readonly children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:opacity-95 shadow-xs hover:shadow-sm disabled:opacity-50 disabled:text-white/60',
  secondary:
    'bg-surface-container-low text-on-surface border border-card-border hover:bg-surface-container-high hover:border-outline/40 shadow-xs disabled:opacity-50',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50',
  danger: 'bg-error text-white hover:opacity-95 shadow-xs hover:shadow-sm disabled:opacity-50 disabled:text-white/60',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-label-xs font-semibold rounded-lg gap-1.5',
  md: 'h-10 px-4 text-label-sm font-semibold rounded-xl gap-2',
  lg: 'h-12 px-6 text-label-md font-semibold rounded-xl gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth,
  className,
  children,
  ...props
}: Readonly<ButtonProps>) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed select-none',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0 inline-flex">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="shrink-0 inline-flex">{icon}</span>}
    </motion.button>
  );
}

export default Button;
