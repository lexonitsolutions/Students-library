// ---------------------------------------------------------------------------
// AIProviderSettings
// Senior-developer redesigned BYOK AI providers management section.
// Simple, pleasant, secure design with clear connection indicators and micro-interactions.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Loader2, WifiOff, ShieldCheck, ChevronRight, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { PROVIDER_CONFIGS } from '../../types/aiProviders.types';
import type { AIProviderName, UserAIProvider } from '../../types/aiProviders.types';
import { useAIProviders } from '../../hooks/useAIProviders';
import { ConnectProviderModal } from './ConnectProviderModal';
import { ManageProviderModal } from './ManageProviderModal';
import { ProviderBrandLogo } from './ProviderLogos';
import { cn } from '../../lib/cn';

const PROVIDER_ORDER: AIProviderName[] = ['gemini', 'openai', 'anthropic', 'grok'];

const PROVIDER_THEMES: Record<
  AIProviderName, 
  { badgeBg: string; badgeText: string; activeBorder: string; activeGlow: string }
> = {
  gemini: {
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    badgeText: 'text-blue-600 dark:text-blue-400',
    activeBorder: 'border-blue-400/40 dark:border-blue-500/30',
    activeGlow: 'bg-blue-500/5',
  },
  openai: {
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    activeBorder: 'border-emerald-400/40 dark:border-emerald-500/30',
    activeGlow: 'bg-emerald-500/5',
  },
  anthropic: {
    badgeBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    badgeText: 'text-orange-600 dark:text-orange-400',
    activeBorder: 'border-orange-400/40 dark:border-orange-500/30',
    activeGlow: 'bg-orange-500/5',
  },
  grok: {
    badgeBg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
    badgeText: 'text-zinc-700 dark:text-zinc-300',
    activeBorder: 'border-zinc-400/40 dark:border-zinc-500/30',
    activeGlow: 'bg-zinc-500/5',
  },
};

interface ProviderCardProps {
  providerKey: AIProviderName;
  savedProvider: UserAIProvider | undefined;
  onConnect: () => void;
  onManage: () => void;
  index: number;
}

function ProviderCard({
  providerKey,
  savedProvider,
  onConnect,
  onManage,
  index,
}: ProviderCardProps) {
  const cfg = PROVIDER_CONFIGS[providerKey];
  const isConnected = !!savedProvider;
  const theme = PROVIDER_THEMES[providerKey];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      whileHover={{ y: -1 }}
      className={cn(
        'flex items-center gap-3.5 rounded-2xl border p-4 transition-all duration-200 shadow-2xs group',
        isConnected
          ? cn('bg-surface', theme.activeBorder, theme.activeGlow)
          : 'bg-surface border-card-border hover:border-card-border/90'
      )}
    >
      {/* Official Brand Logo */}
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-card-border/70 bg-surface shadow-2xs transition-transform duration-200 group-hover:scale-105 p-2"
        aria-hidden="true"
      >
        <ProviderBrandLogo provider={providerKey} size={24} />
      </span>

      {/* Provider Details */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-on-surface">
            {cfg.displayName}
          </p>
          {savedProvider?.is_default && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
              ★ Primary
            </span>
          )}
        </div>

        {isConnected ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
            <span className="text-xs text-on-surface-variant font-mono">
              · {savedProvider.selected_model}
            </span>
            <span className="text-[11px] text-on-surface-variant/70 font-mono">
              (Key: ••••{savedProvider.key_hint})
            </span>
          </div>
        ) : (
          <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-1">
            {cfg.description}
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="shrink-0">
        {isConnected ? (
          <button
            type="button"
            onClick={onManage}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-card-border bg-surface hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer shadow-2xs"
          >
            <span>Manage</span>
            <ChevronRight size={13} className="text-on-surface-variant" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
          >
            <span>Connect</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function AIProviderSettings() {
  const { providers, loading, error, refreshProviders } = useAIProviders();

  const [connectingProvider, setConnectingProvider] = useState<AIProviderName | null>(null);
  const [managingProvider, setManagingProvider] = useState<UserAIProvider | null>(null);

  function getSaved(key: AIProviderName): UserAIProvider | undefined {
    return providers.find((p) => p.provider === key);
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="ai-providers-heading" 
      className="mt-6"
    >
      {/* ── Section Header ─────────────────────────────────────────────── */}
      <div className="mb-3 flex items-start justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">
            <Cpu size={14} className="text-primary" />
            <span id="ai-providers-heading">AI Engines & BYOK API Keys</span>
          </div>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Connect your personal AI provider keys to power Study LAB. Keys are encrypted server-side with AES-256.
          </p>
        </div>

        <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold shrink-0">
          <ShieldCheck size={12} />
          <span>Encrypted Vault</span>
        </div>
      </div>

      {/* ── Loading state ──────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center gap-2 py-8 justify-center text-on-surface-variant rounded-2xl border border-card-border bg-surface">
          <Loader2 size={16} className="animate-spin text-primary" />
          <span className="text-xs font-medium">Loading your AI providers…</span>
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-error/20 bg-error/5 p-4 text-xs text-error">
          <div className="flex items-center gap-2">
            <WifiOff size={15} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void refreshProviders()}
            className="font-bold underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Provider list ──────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="flex flex-col gap-2.5">
          {PROVIDER_ORDER.map((key, i) => (
            <ProviderCard
              key={key}
              index={i}
              providerKey={key}
              savedProvider={getSaved(key)}
              onConnect={() => setConnectingProvider(key)}
              onManage={() => {
                const saved = getSaved(key);
                if (saved) setManagingProvider(saved);
              }}
            />
          ))}
        </div>
      )}

      {/* ── ConnectProviderModal ───────────────────────────────────────── */}
      {connectingProvider && (
        <ConnectProviderModal
          open={!!connectingProvider}
          onClose={() => setConnectingProvider(null)}
          initialProvider={connectingProvider}
          onSuccess={() => {
            setConnectingProvider(null);
            void refreshProviders();
          }}
        />
      )}

      {/* ── ManageProviderModal ────────────────────────────────────────── */}
      {managingProvider && (
        <ManageProviderModal
          open={!!managingProvider}
          onClose={() => setManagingProvider(null)}
          provider={managingProvider}
          onRefresh={() => void refreshProviders()}
        />
      )}
    </motion.section>
  );
}

export default AIProviderSettings;
