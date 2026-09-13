import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Send, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';

export interface RejectMaterialModalProps {
  readonly isOpen: boolean;
  readonly itemTitle: string;
  readonly onClose: () => void;
  readonly onConfirm: (reason: string) => void;
}

const PRESET_REASONS = [
  'Incomplete or missing pages',
  'Low scan quality or unreadable text',
  'Wrong subject or course categorized',
  'Duplicate material already uploaded',
  'Violates community or copyright guidelines',
];

export function RejectMaterialModal({
  isOpen,
  itemTitle,
  onClose,
  onConfirm,
}: Readonly<RejectMaterialModalProps>) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: string) => {
    setReason(preset);
    setError(null);
  };

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Please provide a reason so the student understands why it was rejected.');
      return;
    }
    onConfirm(trimmed);
    setReason('');
    setError(null);
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <button
          type="button"
          aria-label="Close rejection dialog"
          className="absolute inset-0 bg-transparent cursor-default"
          onClick={handleClose}
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-[min(90vw,512px)] rounded-2xl bg-surface-container-low dark:bg-[#0f141c] border border-card-border p-6 shadow-2xl z-10"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 id="reject-modal-title" className="text-title-md font-bold text-on-surface">
                  Reject Material
                </h3>
                <p className="text-body-xs text-on-surface-variant truncate max-w-xs sm:max-w-sm">
                  &ldquo;{itemTitle}&rdquo;
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <p className="mt-4 text-body-sm text-on-surface-variant leading-relaxed">
            Please provide a specific reason for rejection. This reason will be displayed directly to the student in their uploads dashboard and notifications so they can correct and re-upload.
          </p>

          {/* Quick presets */}
          <div className="mt-3.5">
            <span className="text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Quick Suggestions:
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-body-xs rounded-lg px-2.5 py-1 border transition-all cursor-pointer ${
                    reason === preset
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40 font-semibold'
                      : 'bg-surface-container-high text-on-surface-variant border-card-border hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="mt-4">
            <label htmlFor="rejection-reason" className="block text-label-sm font-semibold text-on-surface mb-1.5">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="rejection-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Pages 3 to 5 are missing, or text is too blurry to read..."
              className="w-full rounded-xl border border-card-border bg-white dark:bg-surface-container px-3.5 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all resize-none"
            />
            {error && (
              <p className="mt-1.5 text-label-sm text-rose-600 dark:text-rose-400">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="md" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirm}
              icon={<Send size={15} />}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-xs"
            >
              Reject & Send Reason
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

export default RejectMaterialModal;
