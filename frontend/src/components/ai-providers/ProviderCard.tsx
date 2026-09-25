// ---------------------------------------------------------------------------
// ProviderCard – Displays a single AI provider's connection status.
//
// Security note: The full API key is NEVER displayed. Only the 4-character
// key_hint returned by the backend is shown. There is intentionally no
// "reveal key" or "show full key" option.
// ---------------------------------------------------------------------------

import { CheckCircle2, Plug, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';
import { PROVIDER_CONFIGS, type AIProviderName, type UserAIProvider } from '../../types/aiProviders.types';

import { ProviderBrandLogo } from './ProviderLogos';

/** Tailwind color tokens per provider accent */
const ACCENT_CLASSES: Record<AIProviderName, { icon: string; badge: string }> = {
  gemini: {
    icon: 'text-blue-500 dark:text-blue-400',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500/20',
  },
  openai: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/20',
  },
  anthropic: {
    icon: 'text-orange-500 dark:text-orange-400',
    badge: 'bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-500/20',
  },
  grok: {
    icon: 'text-on-surface-variant',
    badge: 'bg-surface-container text-on-surface-variant border-card-border',
  },
};

// ── Props ────────────────────────────────────────────────────────────────────

export interface ProviderCardProps {
  readonly providerName: AIProviderName;
  readonly connectedProvider: UserAIProvider | null;
  readonly onConnect: () => void;
  readonly onManage: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ProviderCard({
  providerName,
  connectedProvider,
  onConnect,
  onManage,
}: Readonly<ProviderCardProps>) {
  const config = PROVIDER_CONFIGS[providerName];
  const accent = ACCENT_CLASSES[providerName];
  const isConnected = connectedProvider !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'rounded-xl border bg-surface transition-all duration-200 overflow-hidden shadow-xs',
        isConnected
          ? 'border-emerald-400/40 dark:border-emerald-500/30 hover:border-emerald-400/60'
          : 'border-card-border hover:border-primary/30 hover:shadow-card-hover',
      )}
    >
      <div className="p-4 flex items-start gap-3.5">
        {/* ── Provider icon ── */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-surface-container shadow-2xs',
            isConnected
              ? 'border-emerald-300/50 dark:border-emerald-500/30'
              : 'border-card-border',
          )}
        >
          <ProviderBrandLogo provider={providerName} size={22} />
        </div>

        {/* ── Text content ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-on-surface">{config.displayName}</span>

            {/* Connected badge */}
            {isConnected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60 dark:bg-emerald-950/40 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                <CheckCircle2 size={10} />
                Connected
              </span>
            )}

            {/* Default badge */}
            {isConnected && connectedProvider!.is_default && (
              <span
                className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-semibold',
                  accent.badge,
                )}
              >
                Default
              </span>
            )}
          </div>

          {/* Description OR key hint depending on state */}
          {isConnected ? (
            <p className="mt-0.5 text-xs text-on-surface-variant font-mono tracking-wide">
              Key:{' '}
              <span className="text-on-surface">
                ••••••••{connectedProvider!.key_hint}
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-on-surface-variant leading-snug line-clamp-2">
              {config.description}
            </p>
          )}
        </div>

        {/* ── Action button ── */}
        <div className="shrink-0 ml-auto">
          {isConnected ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings2 size={14} />}
              onClick={onManage}
              className="text-on-surface-variant"
            >
              Manage
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<Plug size={14} />}
              onClick={onConnect}
            >
              Connect
            </Button>
          )}
        </div>
      </div>

      {/* ── Connected model chip ── */}
      {isConnected && connectedProvider!.selected_model && (
        <div className="px-4 pb-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-on-surface-variant bg-surface-container border border-card-border rounded-md px-2 py-0.5">
            Model: {connectedProvider!.selected_model}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default ProviderCard;
