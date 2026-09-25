// ---------------------------------------------------------------------------
// ProviderSelector
// Senior-developer styled compact floating AI provider & model toolbar.
// Includes active status pulse, brand badges, and smooth select styling.
// ---------------------------------------------------------------------------

import { motion } from 'framer-motion';
import { Settings2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PROVIDER_CONFIGS } from '../../types/aiProviders.types';
import type { AIProviderName, UserAIProvider } from '../../types/aiProviders.types';
import { cn } from '../../lib/cn';
import { ProviderBrandLogo } from './ProviderLogos';

export interface ProviderSelectorProps {
  providers: UserAIProvider[];
  selectedProvider: AIProviderName | null;
  selectedModel: string;
  onProviderChange: (provider: AIProviderName) => void;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

const SELECT_STYLE = [
  'appearance-none rounded-lg border border-card-border bg-surface',
  'px-2.5 py-1 pr-6 text-xs font-semibold text-on-surface',
  'hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10',
  'transition-all duration-150 cursor-pointer shadow-2xs',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

const CHEVRON_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2369707D' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 6px center',
};


export function ProviderSelector({
  providers,
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  disabled = false,
}: Readonly<ProviderSelectorProps>) {
  const activeUserProvider = providers.find((p) => p.provider === selectedProvider);
  const cfg = selectedProvider ? PROVIDER_CONFIGS[selectedProvider] : null;
  const availableModels = cfg?.defaultModels ?? [];

  if (providers.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-300/60 bg-amber-500/5 text-xs text-on-surface">
        <span className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
          <Sparkles size={14} className="text-amber-600 shrink-0" />
          No AI providers connected yet. Connect your API key to activate Study LAB.
        </span>
        <Link 
          to="/settings" 
          className="font-bold text-primary hover:underline shrink-0"
        >
          Setup key →
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-wrap items-center justify-between gap-2.5 p-2 px-3 rounded-xl border border-card-border/80 bg-surface shadow-2xs"
      role="group" 
      aria-label="Active AI provider and model"
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Status indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden sm:inline">Engine Active</span>
        </div>

        {/* Provider selector with official brand logo */}
        <div className="relative flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg border border-card-border bg-surface-container-low shadow-2xs hover:border-primary/40 transition-colors">
          {selectedProvider && (
            <ProviderBrandLogo provider={selectedProvider} size={15} className="shrink-0" />
          )}
          <label htmlFor="provider-select" className="sr-only">
            AI Provider
          </label>
          <select
            id="provider-select"
            value={selectedProvider ?? ''}
            onChange={(e) => onProviderChange(e.target.value as AIProviderName)}
            disabled={disabled}
            className="appearance-none bg-transparent pr-5 text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
            style={CHEVRON_STYLE}
            aria-label="Select AI provider"
          >
            {providers.map((p) => {
              const providerCfg = PROVIDER_CONFIGS[p.provider];
              return (
                <option key={p.provider} value={p.provider} className="bg-surface text-on-surface">
                  {providerCfg.shortName}
                  {p.is_default ? ' (Default)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Model selector */}
        {cfg && (
          <div className="relative flex items-center">
            <label htmlFor="model-select" className="sr-only">
              Model
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={disabled || availableModels.length === 0}
              className={cn(SELECT_STYLE)}
              style={CHEVRON_STYLE}
              aria-label="Select model"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              {activeUserProvider &&
                !availableModels.includes(activeUserProvider.selected_model) &&
                !activeUserProvider.selected_model.includes('2.5') && (
                  <option value={activeUserProvider.selected_model}>
                    {activeUserProvider.selected_model}
                  </option>
                )}
            </select>
          </div>
        )}
      </div>

      {/* Settings shortcut */}
      <Link
        to="/settings"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
        title="Manage your AI API keys in Settings"
      >
        <Settings2 size={13} />
        <span className="hidden md:inline">Manage Keys</span>
      </Link>
    </motion.div>
  );
}

export default ProviderSelector;
