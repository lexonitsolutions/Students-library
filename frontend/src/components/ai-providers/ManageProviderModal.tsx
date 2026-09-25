// ---------------------------------------------------------------------------
// ManageProviderModal
// Full management modal for an already-connected BYOK AI provider.
// Shows key hint, inline key replacement, model selector, default toggle,
// connection test, and a confirmed remove flow.
// ---------------------------------------------------------------------------

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { PROVIDER_CONFIGS } from '../../types/aiProviders.types';
import type { AIProviderName, UserAIProvider } from '../../types/aiProviders.types';
import { ProviderBrandLogo } from './ProviderLogos';
import { useAIProviders } from '../../hooks/useAIProviders';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/cn';

// ── Props ────────────────────────────────────────────────────────────────────

export interface ManageProviderModalProps {
  open: boolean;
  onClose: () => void;
  provider: UserAIProvider;
  onRefresh: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Console URL to manage/revoke the key at the upstream provider. */
function getConsoleUrl(name: AIProviderName): string {
  return PROVIDER_CONFIGS[name].docsUrl;
}

/** Human-readable console label for the "revoke key" link. */
function getConsoleName(name: AIProviderName): string {
  const labels: Record<AIProviderName, string> = {
    gemini: 'Google AI Studio',
    openai: 'OpenAI Platform',
    anthropic: 'Anthropic Console',
    grok: 'xAI Console',
  };
  return labels[name];
}

// ── Inline status banner ─────────────────────────────────────────────────────

type BannerState =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

function StatusBanner({ state }: { state: BannerState }) {
  if (state.kind === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        key={state.kind}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs',
          state.kind === 'testing' &&
            'border-primary/20 bg-primary-container/30 text-on-primary-container',
          state.kind === 'success' &&
            'border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
          state.kind === 'error' &&
            'border-error/20 bg-error-container/20 text-error',
        )}
      >
        {state.kind === 'testing' && (
          <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin" />
        )}
        {state.kind === 'success' && (
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
        )}
        {state.kind === 'error' && (
          <XCircle size={14} className="mt-0.5 shrink-0" />
        )}
        <span>
          {state.kind === 'testing'
            ? 'Testing connection…'
            : state.message}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Remove confirmation sub-dialog ──────────────────────────────────────────

interface RemoveConfirmProps {
  open: boolean;
  providerName: AIProviderName;
  onCancel: () => void;
  onConfirm: () => void;
  isRemoving: boolean;
}

function RemoveConfirmDialog({
  open,
  providerName,
  onCancel,
  onConfirm,
  isRemoving,
}: RemoveConfirmProps) {
  const cfg = PROVIDER_CONFIGS[providerName];
  const consoleName = getConsoleName(providerName);
  const consoleUrl = getConsoleUrl(providerName);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={`Remove ${cfg.displayName}`}
      description="This cannot be undone."
      className="sm:max-w-sm"
    >
      <div className="flex flex-col gap-4">
        {/* Warning */}
        <div className="flex items-start gap-2.5 rounded-lg bg-error-container/20 border border-error/25 px-3 py-2.5">
          <AlertTriangle
            size={16}
            className="shrink-0 mt-0.5 text-error"
          />
          <p className="text-xs leading-relaxed text-error">
            Remove <span className="font-semibold">{cfg.displayName}</span> from
            your AI Learning workspace? Your API key will be deleted from
            answersbro.
          </p>
        </div>

        {/* Clarification note */}
        <p className="text-xs text-on-surface-variant leading-relaxed">
          This does not revoke the key at {cfg.displayName} — you can do that
          from their console.{' '}
          <a
            href={consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Open {consoleName}
            <ExternalLink size={11} />
          </a>
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-card-border/60">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={isRemoving}>
            Keep it
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            onClick={onConfirm}
            disabled={isRemoving}
          >
            {isRemoving ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ManageProviderModal({
  open,
  onClose,
  provider,
  onRefresh,
}: ManageProviderModalProps) {
  const cfg = PROVIDER_CONFIGS[provider.provider];

  const {
    upsertProvider,
    deleteProvider,
    setDefaultProvider,
    testProvider,
  } = useAIProviders();

  // ── Local state ──────────────────────────────────────────────────────────

  const [selectedModel, setSelectedModel] = useState(provider.selected_model);
  const [showReplaceKey, setShowReplaceKey] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newKeyError, setNewKeyError] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [testBanner, setTestBanner] = useState<BannerState>({ kind: 'idle' });
  const [opError, setOpError] = useState('');

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Replace the stored API key inline. */
  async function handleReplaceKey() {
    const trimmed = newKey.trim();
    if (!trimmed) {
      setNewKeyError('Please enter your new API key.');
      return;
    }
    if (trimmed.length < 8) {
      setNewKeyError('Please enter a complete API key.');
      return;
    }
    setIsSavingKey(true);
    setNewKeyError('');
    setOpError('');

    const result = await upsertProvider({
      provider: provider.provider,
      api_key: trimmed,
      selected_model: selectedModel,
    });

    setIsSavingKey(false);

    if (result.success) {
      setShowReplaceKey(false);
      setNewKey('');
      onRefresh();
    } else {
      setNewKeyError(result.error ?? 'Failed to update the key. Please try again.');
    }
  }

  /** Persist model change. */
  async function handleModelChange(model: string) {
    setSelectedModel(model);
    setIsSavingModel(true);
    setOpError('');

    // We do not have the raw key here, so we pass an empty string — the
    // backend upsert accepts an empty key as "keep existing key".
    const result = await upsertProvider({
      provider: provider.provider,
      api_key: '',
      selected_model: model,
    });

    setIsSavingModel(false);
    if (!result.success) {
      setOpError(result.error ?? 'Could not update the model.');
      setSelectedModel(provider.selected_model); // revert
    } else {
      onRefresh();
    }
  }

  /** Promote to default provider. */
  async function handleSetDefault() {
    setIsSettingDefault(true);
    setOpError('');
    const result = await setDefaultProvider(provider.provider);
    setIsSettingDefault(false);
    if (!result.success) {
      setOpError(result.error ?? 'Could not set as default.');
    } else {
      onRefresh();
    }
  }

  /** Test live connectivity. */
  async function handleTest() {
    setTestBanner({ kind: 'testing' });
    const result = await testProvider(provider.provider);
    if (result.success) {
      setTestBanner({
        kind: 'success',
        message: `Connection to ${cfg.displayName} is working correctly.`,
      });
    } else {
      setTestBanner({
        kind: 'error',
        message: result.error ?? 'Connection test failed.',
      });
    }
    onRefresh();
    // Auto-clear success banner after 6 s
    if (result.success) {
      setTimeout(() => setTestBanner({ kind: 'idle' }), 6000);
    }
  }

  /** Remove the provider entirely. */
  async function handleRemoveConfirm() {
    setIsRemoving(true);
    const result = await deleteProvider(provider.provider);
    setIsRemoving(false);
    if (result.success) {
      setShowRemoveDialog(false);
      onClose();
      onRefresh();
    } else {
      setOpError(result.error ?? 'Failed to remove the provider.');
      setShowRemoveDialog(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={cfg.displayName}
        description="Manage your connected AI provider"
        className="sm:max-w-md"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-card-border/80 bg-surface shadow-2xs">
              <ProviderBrandLogo provider={provider.provider} size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-on-surface">
                  {cfg.displayName}
                </span>
                {provider.is_default && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-2 py-0.5 text-[11px] font-semibold text-on-primary-container">
                    <Star size={10} className="fill-current" />
                    Default
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {cfg.shortName} · Added{' '}
                {new Date(provider.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* ── API key hint (never show full key) ──────────────────────── */}
          <div className="rounded-lg border border-card-border bg-surface-container-low px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldCheck size={15} className="shrink-0 text-on-surface-variant" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">
                    API Key
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-on-surface tracking-widest">
                    {'••••••••'}
                    <span className="tracking-normal">{provider.key_hint}</span>
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReplaceKey((v) => !v);
                  setNewKey('');
                  setNewKeyError('');
                }}
                className="shrink-0 text-xs"
              >
                {showReplaceKey ? 'Cancel' : 'Replace Key'}
              </Button>
            </div>

            {/* ── Inline key replacement form ──────────────────────────── */}
            <AnimatePresence>
              {showReplaceKey && (
                <motion.div
                  key="replace-key-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex flex-col gap-2 border-t border-card-border/60 pt-3">
                    <Input
                      label="New API Key"
                      type="password"
                      placeholder={cfg.keyPlaceholder}
                      value={newKey}
                      onChange={(e) => {
                        setNewKey(e.target.value);
                        setNewKeyError('');
                      }}
                      autoComplete="off"
                      data-1p-ignore="true"
                      data-lpignore="true"
                      className="font-mono"
                    />
                    {newKeyError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 text-xs font-medium text-error"
                      >
                        <AlertTriangle size={12} className="shrink-0" />
                        {newKeyError}
                      </motion.p>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      icon={
                        isSavingKey ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : undefined
                      }
                      disabled={isSavingKey || !newKey.trim()}
                      onClick={handleReplaceKey}
                      className="self-end"
                    >
                      {isSavingKey ? 'Saving…' : 'Save New Key'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Model selector ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md text-on-surface-variant">
              Active Model
            </label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={isSavingModel}
                className={cn(
                  'w-full appearance-none rounded-lg border border-card-border bg-surface-container-low px-4 py-2.5',
                  'pr-10 text-sm text-on-surface focus:border-primary/50 focus:outline-none',
                  'transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
                )}
              >
                {cfg.defaultModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                {isSavingModel ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ChevronDown size={15} />
                )}
              </div>
            </div>
          </div>

          {/* ── Test connection banner ───────────────────────────────────── */}
          <StatusBanner state={testBanner} />

          {/* ── Generic operation error ──────────────────────────────────── */}
          {opError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-xs font-medium text-error"
            >
              <AlertTriangle size={12} className="shrink-0" />
              {opError}
            </motion.p>
          )}

          {/* ── Action buttons row ───────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Test connection */}
            <Button
              variant="secondary"
              size="sm"
              icon={
                testBanner.kind === 'testing' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RefreshCw size={13} />
                )
              }
              disabled={testBanner.kind === 'testing'}
              onClick={handleTest}
            >
              Test Connection
            </Button>

            {/* Set as default */}
            {!provider.is_default && (
              <Button
                variant="ghost"
                size="sm"
                icon={
                  isSettingDefault ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Star size={13} />
                  )
                }
                disabled={isSettingDefault}
                onClick={handleSetDefault}
              >
                {isSettingDefault ? 'Setting…' : 'Set as Default'}
              </Button>
            )}
          </div>

          {/* ── Danger zone: remove provider ─────────────────────────────── */}
          <div className="border-t border-card-border/60 pt-4">
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={() => setShowRemoveDialog(true)}
              className="bg-transparent border border-error/30 text-error hover:bg-error hover:text-white"
            >
              Remove API Key
            </Button>
          </div>
        </div>
      </Modal>

      {/* Separate remove-confirmation dialog rendered via portal */}
      <RemoveConfirmDialog
        open={showRemoveDialog}
        providerName={provider.provider}
        onCancel={() => setShowRemoveDialog(false)}
        onConfirm={handleRemoveConfirm}
        isRemoving={isRemoving}
      />
    </>
  );
}

export default ManageProviderModal;
