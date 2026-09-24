import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export interface TabsProps {
  readonly tabs: readonly string[];
  readonly active: string;
  readonly onChange: (tab: string) => void;
  readonly className?: string;
}

export function Tabs({ tabs, active, onChange, className }: Readonly<TabsProps>) {
  return (
    <div role="tablist" className={cn('flex items-center gap-1 border-b border-card-border', className)}>
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={cn(
              'relative px-4 py-3 text-label-md transition-colors duration-150 cursor-pointer',
              isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface',
            )}
          >
            {tab}
            {isActive && (
              <motion.div
                layoutId="tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
