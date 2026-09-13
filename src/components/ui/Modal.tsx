import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';

export interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly description?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Modal({ open, onClose, title, description, className, children }: Readonly<ModalProps>) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            aria-label="Close dialog"
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] cursor-default transition-opacity"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-surface border border-card-border p-4 sm:p-6 shadow-xl z-10 max-h-[90vh] overflow-y-auto',
              className,
            )}
          >
            <div className={cn('flex items-start justify-between gap-3', title ? 'mb-4 pb-3 border-b border-card-border/60' : 'mb-2')}>
              {title ? (
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-on-surface">{title}</h2>
                  {description && (
                    <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>
                  )}
                </div>
              ) : <div />}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-on-surface-variant/70 hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer ml-auto shrink-0"
              >
                <X size={16} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default Modal;
