// ---------------------------------------------------------------------------
// ConnectProviderModal – Multi-step modal for connecting a new AI provider.
//
// Flow:
//   ENTER_KEY → TESTING → SUCCESS
//                       ↘ ERROR → (retry back to ENTER_KEY)
//
// Security guarantees:
//  • API key is held in local state only while the modal is open.
//  • The key is cleared on close, regardless of step.
//  • The full key is never stored in the browser after the upsert call.
// ---------------------------------------------------------------------------

import { useState, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  BookOpen,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';
import { PROVIDER_CONFIGS, type AIProviderName } from '../../types/aiProviders.types';
import { useAIProviders } from '../../hooks/useAIProviders';
import { ProviderBrandLogo } from './ProviderLogos';
import { ProviderSetupGuide } from './ProviderSetupGuide';

type ModalStep = 'ENTER_KEY' | 'TESTING' | 'SUCCESS' | 'ERROR';

export interface ConnectProviderModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly providerName?: AIProviderName;
  readonly initialProvider?: AIProviderName;
  readonly onSuccess: (result: { selected_model: string; set_as_default: boolean }) => void;
  readonly onShowGuide?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stepVariants() {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function ConnectProviderModal({
  open,
  onClose,
  providerName,
  initialProvider,
  onSuccess,
  onShowGuide,
}: Readonly<ConnectProviderModalProps>) {
  const activeProvider = providerName ?? initialProvider ?? 'gemini';
  const config = PROVIDER_CONFIGS[activeProvider];
  const { upsertProvider } = useAIProviders();

  // ── Form state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<ModalStep>('ENTER_KEY');
  const [showInternalGuide, setShowInternalGuide] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // ── Success-step state ──────────────────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState<string>(config?.defaultModels[0] ?? '');
  const [setAsDefault, setSetAsDefault] = useState(true);

  // ── Error state ──────────────────────────────────────────────────────────
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const keyInputId = useId();
  const modelSelectId = useId();

  // ── Reset on close ───────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    // Intentionally clear the key from memory on every close
    setApiKey('');
    setShowKey(false);
    setKeyError(null);
    setErrorMessage(null);
    setStep('ENTER_KEY');
    setSelectedModel(config.defaultModels[0] ?? '');
    setSetAsDefault(true);
    onClose();
  }, [config.defaultModels, onClose]);

  // ── Submit handler ───────────────────────────────────────────────────────
  const handleTestAndConnect = useCallback(async () => {
    const trimmedKey = apiKey.trim();

    // Client-side lightweight length validation
    if (!trimmedKey) {
      setKeyError('Please enter your API key.');
      return;
    }
    if (trimmedKey.length < 8) {
      setKeyError('Please enter a complete API key.');
      return;
    }

    setKeyError(null);
    setStep('TESTING');

    try {
      const result = await upsertProvider({
        provider: activeProvider,
        api_key: trimmedKey,
        selected_model: selectedModel,
      });

      if (result.success) {
        // Clear the key from local state immediately after a successful save
        setApiKey('');
        setStep('SUCCESS');
      } else {
        setErrorMessage(result.error ?? 'Connection test failed. Please check your API key and try again.');
        setStep('ERROR');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
      );
      setStep('ERROR');
    }
  }, [apiKey, config.keyPrefix, config.shortName, activeProvider, selectedModel, upsertProvider]);

  // ── Retry: go back to key entry ──────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setApiKey('');
    setShowKey(false);
    setErrorMessage(null);
    setKeyError(null);
    setStep('ENTER_KEY');
  }, []);

  // ── Confirm success ──────────────────────────────────────────────────────
  const handleStartLearning = useCallback(async () => {
    onSuccess({ selected_model: selectedModel, set_as_default: setAsDefault });
    handleClose();
  }, [selectedModel, setAsDefault, onSuccess, handleClose]);

  // ── Modal title per step ─────────────────────────────────────────────────
  const modalTitle =
    step === 'ENTER_KEY'
      ? `Connect ${config.shortName}`
      : step === 'TESTING'
        ? 'Verifying connection…'
        : step === 'SUCCESS'
          ? 'Connection successful!'
          : 'Connection failed';

  const modalDescription =
    step === 'ENTER_KEY' ? `Enter your ${config.displayName} API key to get started.` : undefined;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={showInternalGuide ? `${config.displayName} Setup Guide` : modalTitle}
      description={showInternalGuide ? undefined : modalDescription}
    >
      {showInternalGuide ? (
        <ProviderSetupGuide
          provider={activeProvider}
          onBack={() => setShowInternalGuide(false)}
        />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {/* ════════════════════════════════════════════════════════════════
              STEP 1 – ENTER_KEY
              ════════════════════════════════════════════════════════════════ */}
          {step === 'ENTER_KEY' && (
            <motion.div
              key="enter-key"
              variants={stepVariants()}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex flex-col gap-4"
            >
            {/* Provider identity header */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-card-border/80 bg-surface-container-low shadow-2xs">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-card-border shadow-2xs">
                <ProviderBrandLogo provider={activeProvider} size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-on-surface leading-snug">{config.displayName}</p>
                <p className="text-xs text-on-surface-variant truncate">{config.description}</p>
              </div>
            </div>

            {/* API key input */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={keyInputId}
                className="text-label-md text-on-surface-variant"
              >
                API Key
              </label>
              <div className="relative">
                <input
                  id={keyInputId}
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (keyError) setKeyError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleTestAndConnect();
                  }}
                  placeholder={config.keyPlaceholder}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                  data-form-type="other"
                  className={cn(
                    'h-12 w-full rounded-lg bg-surface-soft px-4 pr-11 text-body-md text-on-surface placeholder:text-outline',
                    'border transition-colors duration-150 font-mono',
                    'focus:bg-white focus:border-primary-container focus:outline-none',
                    keyError
                      ? 'border-error/60 bg-error/5 focus:border-error'
                      : 'border-transparent',
                  )}
                />
                {/* Eye toggle */}
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer p-0.5 rounded"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Inline validation error */}
              {keyError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 text-xs font-medium text-error"
                >
                  <AlertCircle size={12} className="shrink-0" />
                  {keyError}
                </motion.p>
              )}
            </div>

            {/* Cost notice */}
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-400/30 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-500/20 p-3">
              <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                AI providers charge for API usage.{' '}
                <a
                  href={config.pricingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:opacity-80 transition-opacity font-medium"
                >
                  Check pricing
                </a>{' '}
                before connecting.
              </p>
            </div>

            {/* How to get a key link */}
            <button
              type="button"
              onClick={onShowGuide ?? (() => setShowInternalGuide(true))}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer underline underline-offset-2 self-start"
            >
              <BookOpen size={12} />
              How do I get a {config.shortName} API key?
            </button>

            {/* Security notice */}
            <div className="flex items-start gap-2 rounded-lg border border-card-border bg-surface-container p-3">
              <ShieldCheck size={14} className="text-on-surface-variant shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Your key is encrypted and stored securely. We never expose it after saving — only
                the last 4 characters are shown as a reference.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-card-border/60 mt-1">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!apiKey.trim()}
                onClick={() => void handleTestAndConnect()}
              >
                Test &amp; Connect
              </Button>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 2 – TESTING
            ════════════════════════════════════════════════════════════════ */}
        {step === 'TESTING' && (
          <motion.div
            key="testing"
            variants={stepVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Loader2 size={28} />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-semibold text-on-surface">
                Testing your {config.shortName} key…
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                We're sending a quick verification request. This usually takes a few seconds.
              </p>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 3 – SUCCESS
            ════════════════════════════════════════════════════════════════ */}
        {step === 'SUCCESS' && (
          <motion.div
            key="success"
            variants={stepVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex flex-col gap-5"
          >
            {/* Success header */}
            <div className="flex flex-col items-center gap-3 py-3">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-card-border shadow-sm">
                <ProviderBrandLogo provider={activeProvider} size={28} />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                  <CheckCircle2 size={12} className="stroke-[3]" />
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-on-surface">
                  {config.displayName} connected!
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Your API key has been verified and saved securely.
                </p>
              </div>
            </div>

            {/* Model selector */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={modelSelectId}
                className="text-label-md text-on-surface-variant"
              >
                Default model
              </label>
              <select
                id={modelSelectId}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={cn(
                  'h-12 w-full rounded-lg bg-surface-soft px-4 text-body-md text-on-surface',
                  'border border-transparent transition-colors duration-150',
                  'focus:bg-white focus:border-primary-container focus:outline-none',
                  'cursor-pointer appearance-none',
                )}
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                {config.defaultModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <span className="text-label-sm text-outline">
                You can change this later in AI Provider settings.
              </span>
            </div>

            {/* Set as default checkbox */}
            <label className="flex items-center gap-3 cursor-pointer select-none rounded-lg border border-card-border bg-surface-container p-3 hover:bg-surface-container-high transition-colors">
              <div className="relative flex shrink-0 items-center">
                <input
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'h-4.5 w-4.5 rounded border-2 flex items-center justify-center transition-colors duration-150',
                    setAsDefault
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-card-border',
                  )}
                >
                  {setAsDefault && (
                    <svg
                      viewBox="0 0 10 10"
                      className="h-2.5 w-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface">Set as default provider</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Use {config.shortName} as the AI for all your learning sessions.
                </p>
              </div>
            </label>

            {/* Start Learning button */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-card-border/60 mt-1">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Done
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Sparkles size={14} />}
                onClick={() => void handleStartLearning()}
              >
                Start Learning
              </Button>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 4 – ERROR
            ════════════════════════════════════════════════════════════════ */}
        {step === 'ERROR' && (
          <motion.div
            key="error"
            variants={stepVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex flex-col gap-4"
          >
            {/* Error header */}
            <div className="flex flex-col items-center gap-3 py-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
                <AlertCircle size={28} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-on-surface">Connection failed</p>
                <p className="mt-1 text-xs text-on-surface-variant max-w-xs mx-auto">
                  We couldn't verify your {config.shortName} API key. Double-check the key and try
                  again.
                </p>
              </div>
            </div>

            {/* Error detail */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/5 p-3">
                <AlertCircle size={14} className="text-error shrink-0 mt-0.5" />
                <p className="text-xs text-error leading-relaxed font-medium">{errorMessage}</p>
              </div>
            )}

            {/* How to get a key link */}
            <button
              type="button"
              onClick={onShowGuide ?? (() => setShowInternalGuide(true))}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer underline underline-offset-2 self-start"
            >
              <BookOpen size={12} />
              Need help getting a {config.shortName} key?
            </button>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-card-border/60 mt-1">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<RefreshCcw size={14} />}
                onClick={handleRetry}
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </Modal>
  );
}

export default ConnectProviderModal;
