import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface ChipProps {
  readonly children: ReactNode;
  readonly active?: boolean;
  readonly onClick?: () => void;
  readonly className?: string;
}

export function Chip({ children, active, onClick, className }: Readonly<ChipProps>) {
  const isInteractive = Boolean(onClick);
  const Tag = isInteractive ? 'button' : 'span';

  return (
    <Tag
      type={isInteractive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-label-sm font-medium transition-colors duration-150',
        active
          ? 'bg-primary text-on-primary'
          : 'bg-surface-container-low text-slate hover:bg-surface-container',
        isInteractive && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export default Chip;
