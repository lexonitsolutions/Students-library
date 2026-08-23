import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useDarkMode } from '../../hooks/useDarkMode';

export interface SignupPromptModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSignup: () => void;
}

export function SignupPromptModal({ isOpen, onClose, onSignup }: Readonly<SignupPromptModalProps>) {
  const { theme } = useDarkMode();

  const isDark = theme === 'dark';
  const isMid = theme === 'mid';

  const modalBg = isDark
    ? 'bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e1035] border-slate-800 text-white shadow-2xl'
    : isMid
    ? 'bg-gradient-to-br from-[#1e293b] via-[#1e1b4b] to-[#2e1065] border-indigo-500/30 text-white shadow-2xl'
    : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-white/60 text-slate-900 shadow-2xl';

  const closeBtnStyle = isDark
    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
    : isMid
    ? 'bg-white/10 text-indigo-200 hover:bg-white/20 hover:text-white'
    : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900';

  const titleStyle = isDark || isMid ? 'text-white' : 'text-slate-900';

  const descStyle = isDark
    ? 'text-slate-300'
    : isMid
    ? 'text-indigo-200/90'
    : 'text-slate-600';

  const itemBg = isDark
    ? 'bg-slate-800/80 border border-slate-700/60 text-slate-200 shadow-sm'
    : isMid
    ? 'bg-white/10 backdrop-blur-md border border-white/10 text-white shadow-sm'
    : 'bg-white/80 border border-slate-200/80 text-slate-700 shadow-sm';

  const secondaryBtnStyle = isDark
    ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
    : isMid
    ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
    : 'border-slate-300 bg-white/80 text-slate-700 hover:bg-white hover:border-slate-400';

  const footerStyle = isDark
    ? 'text-slate-400'
    : isMid
    ? 'text-indigo-300/70'
    : 'text-slate-500';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <button
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Sign up to unlock content"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-md rounded-3xl p-8 border ${modalBg}`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-all cursor-pointer ${closeBtnStyle}`}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Lock Icon with Glow */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-2xl opacity-60" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-lg">
                  <Lock size={36} className="text-white" />
                </div>
              </div>
            </div>

            {/* Title & Message */}
            <div className="mb-6 text-center">
              <h2 className={`text-2xl font-extrabold tracking-tight mb-2 ${titleStyle}`}>
                Unlock This Content
              </h2>
              <p className={`text-sm leading-relaxed ${descStyle}`}>
                Sign up to access all materials, assignments, test papers, and unlock the full learning experience!
              </p>
            </div>

            {/* Features List */}
            <div className="mb-6 space-y-3">
              <button
                type="button"
                onClick={onSignup}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all cursor-pointer hover:opacity-90 ${itemBg}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 shrink-0">
                  <Sparkles size={16} className="text-indigo-400" />
                </div>
                <span className="text-sm font-semibold">Access 10,000+ study materials</span>
              </button>
              <button
                type="button"
                onClick={onSignup}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all cursor-pointer hover:opacity-90 ${itemBg}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 shrink-0">
                  <Sparkles size={16} className="text-purple-400" />
                </div>
                <span className="text-sm font-semibold">Download PDFs & documents</span>
              </button>
              <button
                type="button"
                onClick={onSignup}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all cursor-pointer hover:opacity-90 ${itemBg}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/20 shrink-0">
                  <Sparkles size={16} className="text-pink-400" />
                </div>
                <span className="text-sm font-semibold">Save favorites & bookmark notes</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.div className="relative group" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur group-hover:opacity-100 transition duration-300" />
                <button
                  type="button"
                  onClick={onSignup}
                  className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg cursor-pointer"
                >
                  <span>Sign Up Now</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>

              <button
                type="button"
                onClick={onClose}
                className={`w-full rounded-2xl border px-6 py-3 text-sm font-semibold transition-all cursor-pointer ${secondaryBtnStyle}`}
              >
                Continue Exploring
              </button>
            </div>

            {/* Footer Note */}
            <p className={`mt-4 text-center text-xs ${footerStyle}`}>
              Free forever for students • No credit card required
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default SignupPromptModal;
