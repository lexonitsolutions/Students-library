import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import type { AssistantPosition } from './types';

interface AssistantTooltipProps {
  readonly showTooltip: boolean;
  readonly showIntroBubble: boolean;
  readonly position: AssistantPosition;
  readonly onDismissIntro: () => void;
}

export const AssistantTooltip: React.FC<AssistantTooltipProps> = ({
  showTooltip,
  showIntroBubble,
  position,
  onDismissIntro,
}) => {
  // Auto-dismiss the first-time intro speech bubble after 6 seconds
  useEffect(() => {
    if (!showIntroBubble) return;
    const timer = setTimeout(() => {
      onDismissIntro();
    }, 6000);
    return () => clearTimeout(timer);
  }, [showIntroBubble, onDismissIntro]);

  const isLeftEdge = position.edge === 'left';

  return (
    <div className="pointer-events-none select-none">
      {/* 1. First-time User Speech Bubble */}
      <AnimatePresence>
        {showIntroBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10, x: isLeftEdge ? -8 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`absolute bottom-full mb-3 pointer-events-auto z-50 flex items-center gap-2.5 rounded-2xl bg-surface-container-lowest/95 dark:bg-surface-container/95 border border-primary/20 dark:border-primary/30 px-3.5 py-2.5 shadow-xl backdrop-blur-md text-on-surface whitespace-nowrap ${
              isLeftEdge ? 'left-0 origin-bottom-left' : 'right-0 origin-bottom-right'
            }`}
            role="status"
            aria-live="polite"
          >
            {/* Speech bubble arrow/tail pointing to character */}
            <div
              className={`absolute -bottom-1.5 h-3 w-3 rotate-45 border-r border-b border-primary/20 dark:border-primary/30 bg-surface-container-lowest dark:bg-surface-container ${
                isLeftEdge ? 'left-6' : 'right-6'
              }`}
            />

            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles size={13} className="text-primary animate-pulse" />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                Need help studying?
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Ask AI ✨
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismissIntro();
              }}
              className="ml-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
              aria-label="Dismiss message"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Hover Tooltip ("Learn with AI") */}
      <AnimatePresence>
        {showTooltip && !showIntroBubble && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            className={`absolute bottom-full mb-2 z-50 pointer-events-none rounded-lg bg-inverse-surface/90 px-2.5 py-1 text-xs font-medium text-inverse-on-surface shadow-md backdrop-blur-xs whitespace-nowrap ${
              isLeftEdge ? 'left-0' : 'right-0'
            }`}
          >
            Learn with AI
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
