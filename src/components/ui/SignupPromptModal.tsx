import { AnimatePresence, motion } from 'framer-motion';
import { 
  X, 
  ArrowRight, 
  Download, 
  Bookmark, 
  ShieldCheck
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Logo } from './Logo';

export interface SignupPromptModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSignup: () => void;
}

export function SignupPromptModal({ isOpen, onClose, onSignup }: Readonly<SignupPromptModalProps>) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop with frosted glass effect */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-slate-950/50 dark:bg-black/70 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Sign up for Studexa"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[440px] rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-6 sm:p-7 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 overflow-hidden"
          >
            {/* Subtle top ambient accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={17} strokeWidth={2} />
            </button>

            {/* Header / Brand Badge */}
            <div className="flex items-center gap-3 mb-4 pt-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 shrink-0 p-2">
                <Logo variant="icon" imgClassName="h-7 w-7 object-contain" />
              </div>
              <div>
                <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Student Library
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  Get full access on Studexa
                </h2>
              </div>
            </div>

            {/* Explanatory text */}
            <p className="text-[13.5px] leading-relaxed text-slate-600 dark:text-zinc-400 mb-5">
              Create your free student account to read complete documents, download study resources, and organize your semester revision.
            </p>

            {/* Feature Value Props - Clean Linear style */}
            <div className="space-y-2.5 mb-6">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <Download size={15} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-900 dark:text-zinc-100">
                    Full Document Downloads
                  </div>
                  <div className="text-[12px] text-slate-500 dark:text-zinc-400 leading-normal">
                    Download complete PDFs, question papers & lecture slides
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
                  <Bookmark size={15} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-900 dark:text-zinc-100">
                    Personal Saved Library
                  </div>
                  <div className="text-[12px] text-slate-500 dark:text-zinc-400 leading-normal">
                    Bookmark important notes and organize revision lists
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck size={15} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-slate-900 dark:text-zinc-100">
                    Verified Peer Content
                  </div>
                  <div className="text-[12px] text-slate-500 dark:text-zinc-400 leading-normal">
                    Contributions shared by branch peers & faculty
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onSignup}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-[14px] h-11 px-5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <span>Create Free Account</span>
                <ArrowRight size={16} strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium text-[13.5px] h-10 transition-colors cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>

            {/* Footer Trust badge */}
            <p className="mt-4 text-center text-[12px] text-slate-400 dark:text-zinc-500">
              Free forever for students • Instant access
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default SignupPromptModal;
