import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, EyeOff, RotateCcw, Sparkles } from 'lucide-react';
import type { AssistantPosition, AssistantSize } from './types';

interface AssistantMenuProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly currentSize: AssistantSize;
  readonly onSelectSize: (size: AssistantSize) => void;
  readonly onResetPosition: () => void;
  readonly onHideAssistant: () => void;
  readonly position: AssistantPosition;
}

export const AssistantMenu: React.FC<AssistantMenuProps> = ({
  isOpen,
  onClose,
  currentSize,
  onSelectSize,
  onResetPosition,
  onHideAssistant,
  position,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen, onClose]);

  const isLeft = position.edge === 'left';
  const isBottom = position.yRatio > 0.65;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop invisible touch catcher */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />

          {/* Contextual Popup Menu */}
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9, y: isBottom ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: isBottom ? 6 : -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`absolute z-50 w-52 rounded-2xl border border-card-border/80 bg-surface-container-lowest/95 dark:bg-surface-container/95 p-1.5 shadow-2xl backdrop-blur-md text-on-surface ${
              isLeft ? 'left-full ml-3' : 'right-full mr-3'
            } ${isBottom ? 'bottom-0 origin-bottom' : 'top-0 origin-top'}`}
            role="menu"
            aria-label="AI Assistant Settings"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-on-surface border-b border-card-border/50">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles size={12} />
              </span>
              <span>AI Assistant</span>
            </div>

            {/* Size Options */}
            <div className="py-1">
              <div className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                Size
              </div>
              {(['small', 'medium', 'large'] as const).map((size) => {
                const isSelected = currentSize === size;
                const label = size.charAt(0).toUpperCase() + size.slice(1);
                return (
                  <button
                    key={size}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    onClick={() => {
                      onSelectSize(size);
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-on-surface hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && <Check size={14} className="text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="my-1 border-t border-card-border/50" />

            {/* Actions */}
            <div className="py-0.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onResetPosition();
                  onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <RotateCcw size={13} className="text-on-surface-variant" />
                <span>Reset position</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onHideAssistant();
                  onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-error hover:bg-error/10 transition-colors cursor-pointer"
              >
                <EyeOff size={13} className="text-error" />
                <span>Hide assistant</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
