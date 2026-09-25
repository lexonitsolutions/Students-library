// ---------------------------------------------------------------------------
// NoProviderSetup
// First-time onboarding screen shown when a student opens AI Learning
// with no BYOK AI provider configured yet.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { PROVIDER_CONFIGS } from '../../types/aiProviders.types';
import type { AIProviderName } from '../../types/aiProviders.types';
import { cn } from '../../lib/cn';
import { ProviderBrandLogo } from './ProviderLogos';

// ── Props ────────────────────────────────────────────────────────────────────

export interface NoProviderSetupProps {
  /** Called after a provider is successfully connected. */
  onConnected: () => void;
}

// ── Provider card ────────────────────────────────────────────────────────────

const PROVIDER_ORDER: AIProviderName[] = ['gemini', 'openai', 'anthropic', 'grok'];

/** Illustrative accent ring colour per provider (matches brand palette). */
const ACCENT_RING: Record<AIProviderName, string> = {
  gemini: 'hover:border-blue-400/50 hover:shadow-blue-100 dark:hover:shadow-blue-900/20',
  openai: 'hover:border-emerald-400/50 hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20',
  anthropic: 'hover:border-orange-400/50 hover:shadow-orange-100 dark:hover:shadow-orange-900/20',
  grok: 'hover:border-slate-400/50 hover:shadow-slate-100 dark:hover:shadow-slate-900/20',
};


interface ProviderPickCardProps {
  providerKey: AIProviderName;
  onClick: () => void;
}

function ProviderPickCard({ providerKey, onClick }: ProviderPickCardProps) {
  const cfg = PROVIDER_CONFIGS[providerKey];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full text-left rounded-xl border border-card-border bg-surface-container-low',
        'p-4 shadow-xs transition-all duration-200 cursor-pointer',
        'hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary',
        ACCENT_RING[providerKey],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-card-border/80 bg-surface shadow-2xs">
          <ProviderBrandLogo provider={providerKey} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-on-surface leading-tight">
            {cfg.displayName}
          </p>
          <p className="mt-1.5 text-xs text-on-surface-variant leading-relaxed line-clamp-3">
            {cfg.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant border border-card-border/60">
              {cfg.defaultModels[0]}
            </span>
            <span className="text-[11px] text-primary font-semibold group-hover:underline">
              Connect →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function NoProviderSetup({ onConnected }: Readonly<NoProviderSetupProps>) {
  const [connectingProvider, setConnectingProvider] = useState<AIProviderName | null>(null);

  // Lazy import so ConnectProviderModal is code-split from this first-run screen
  const [ConnectModal, setConnectModal] = useState<React.ComponentType<{
    open: boolean;
    onClose: () => void;
    initialProvider?: AIProviderName;
    onSuccess: () => void;
  }> | null>(null);

  async function openConnect(provider: AIProviderName) {
    setConnectingProvider(provider);
    // Dynamic import to keep the initial bundle light
    if (!ConnectModal) {
      const mod = await import('./ConnectProviderModal');
      setConnectModal(
        () => mod.ConnectProviderModal as React.ComponentType<{
          open: boolean;
          onClose: () => void;
          initialProvider?: AIProviderName;
          onSuccess: () => void;
        }>,
      );
    }
  }

  function handleClose() {
    setConnectingProvider(null);
  }

  function handleSuccess() {
    setConnectingProvider(null);
    onConnected();
  }

  return (
    <div className="flex flex-col items-center py-10 px-4">
      {/* ── Hero icon ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container text-primary shadow-sm"
      >
        <Sparkles size={32} />
      </motion.div>

      {/* ── Heading ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="mb-2 text-center"
      >
        <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">
          Connect your AI
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
          Use your own AI provider to power your personal learning workspace.
          Your key stays private — we never use it for anything else.
        </p>
      </motion.div>

      {/* ── Provider grid ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.16 }}
        className="mt-8 w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {PROVIDER_ORDER.map((key) => (
          <ProviderPickCard
            key={key}
            providerKey={key}
            onClick={() => openConnect(key)}
          />
        ))}
      </motion.div>

      {/* ── "More coming soon" note ────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-xs text-on-surface-variant"
      >
        + More providers coming soon
      </motion.p>

      {/* ── Cost / privacy notice ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-8 rounded-xl border border-card-border bg-surface-container-low px-5 py-4 max-w-md w-full"
      >
        <p className="text-[11px] text-on-surface-variant leading-relaxed text-center">
          <span className="font-semibold text-on-surface">Bring Your Own Key</span>
          {' '}— you pay your AI provider directly for usage. answersbro never
          stores your full key and never charges for AI usage.
        </p>
      </motion.div>

      {/* ── ConnectProviderModal (lazy-loaded) ─────────────────────────── */}
      {ConnectModal && connectingProvider && (
        <ConnectModal
          open={!!connectingProvider}
          onClose={handleClose}
          initialProvider={connectingProvider}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default NoProviderSetup;
