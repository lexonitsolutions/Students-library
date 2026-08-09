import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  readonly children?: ReactNode;
  readonly hoverable?: boolean;
  readonly padded?: boolean;
}

export function Card({ children, className, hoverable = true, padded = true, ...props }: Readonly<CardProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={hoverable ? { y: -2 } : undefined}
      className={cn(
        'rounded-xl medium-liquid-glass transition-shadow duration-200 overflow-hidden',
        hoverable && 'hover:shadow-card-hover',
        padded && 'p-6',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default Card;
