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
  primary: 'bg-primary text-on-primary hover:bg-primary-container/90 disabled:opacity-50',
  secondary:
    'bg-white text-on-surface border border-card-border hover:border-primary/40 hover:bg-surface-soft disabled:opacity-50',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container disabled:opacity-50',
  danger: 'bg-error text-on-error hover:bg-error/90 disabled:opacity-50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-label-sm gap-1.5',
  md: 'h-11 px-5 text-label-md gap-2',
  lg: 'h-13 px-6 text-body-md gap-2.5',
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
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
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
