// ---------------------------------------------------------------------------
// ProviderSetupGuide – Step-by-step API key acquisition guide per provider.
// Renders inside a parent view (not a modal) to give steps ample space.
// ---------------------------------------------------------------------------

import { ArrowLeft, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { PROVIDER_CONFIGS, type AIProviderName } from '../../types/aiProviders.types';

// ── Per-provider step data ──────────────────────────────────────────────────

interface ProviderGuideData {
  steps: string[];
  consoleUrl: string;
  pricingUrl: string;
  warning?: string;
  note?: string;
}

const GUIDE_DATA: Record<AIProviderName, ProviderGuideData> = {
  gemini: {
    consoleUrl: 'https://aistudio.google.com/apikey',
    pricingUrl: 'https://ai.google.dev/pricing',
    steps: [
      'Open Google AI Studio by clicking the button below.',
      'Sign in with your Google account if prompted.',
      'In the left sidebar, click "Get API key".',
      'Click "Create API key" and choose a Google Cloud project (or create a new one).',
      'Copy the generated API key (typically starts with "AIza" or "AQ.").',
      'Keep your key secure; do not share it or commit it to version control.',
      'Optionally, review usage quotas and set spending limits in Google Cloud Console.',
      'Return to answersbro AI Learning, paste your key and click Test & Connect.',
    ],
  },

  openai: {
    consoleUrl: 'https://platform.openai.com/api-keys',
    pricingUrl: 'https://openai.com/api/pricing',
    warning:
      '⚠️ A ChatGPT Plus subscription does NOT include API access. The OpenAI API is billed separately based on token usage.',
    steps: [
      'Open the OpenAI Platform by clicking the button below.',
      'Sign in with your OpenAI account (separate from ChatGPT).',
      'Navigate to "API keys" in the left sidebar.',
      'Click "Create new secret key", give it a descriptive name (e.g., "answersbro").',
      'Copy the key immediately — it starts with "sk-" and will not be shown again.',
      'Add a payment method in "Billing" and set a usage spending limit to avoid surprises.',
      'Keep your key secure; do not share it or commit it to version control.',
      'Return to answersbro AI Learning, paste your key and click Test & Connect.',
    ],
  },

  anthropic: {
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    pricingUrl: 'https://www.anthropic.com/pricing',
    note: 'Note: A Claude.ai subscription (claude.ai) is entirely separate from Anthropic API access. API usage is billed independently based on token consumption.',
    steps: [
      'Open the Anthropic Console by clicking the button below.',
      'Sign in or create an Anthropic account if you do not have one.',
      'Go to "Settings" → "API Keys" in the left navigation.',
      'Click "Create Key", provide a name (e.g., "answersbro"), and confirm.',
      'Copy the API key — it starts with "sk-ant-" and is shown only once.',
      'Add a credit card and configure billing limits under "Plans & Billing".',
      'Keep your key secure; do not share it or commit it to version control.',
      'Return to answersbro AI Learning, paste your key and click Test & Connect.',
    ],
  },

  grok: {
    consoleUrl: 'https://console.x.ai/',
    pricingUrl: 'https://x.ai/api',
    steps: [
      'Open the xAI Console by clicking the button below.',
      'Sign in with your X (Twitter) account or create an xAI account.',
      'Navigate to "API Keys" in the left sidebar.',
      'Click "Create API Key", give it a name (e.g., "answersbro"), and confirm.',
      'Copy the generated API key — it starts with "xai-".',
      'Review usage limits and configure billing as needed in the console.',
      'Keep your key secure; do not share it or commit it to version control.',
      'Return to answersbro AI Learning, paste your key and click Test & Connect.',
    ],
  },
};

// ── Props ───────────────────────────────────────────────────────────────────

export interface ProviderSetupGuideProps {
  readonly provider: AIProviderName;
  readonly onBack: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ProviderSetupGuide({ provider, onBack }: Readonly<ProviderSetupGuideProps>) {
  const config = PROVIDER_CONFIGS[provider];
  const guide = GUIDE_DATA[provider];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Back button + heading ── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={15} />}
          onClick={onBack}
          className="shrink-0 -ml-1"
        >
          Back
        </Button>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-on-surface truncate">
            How to get a {config.shortName} API key
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">
            {config.displayName}
          </p>
        </div>
      </div>

      {/* ── Provider description ── */}
      <p className="text-sm text-on-surface-variant leading-relaxed">
        {config.description}
      </p>

      {/* ── Cost notice ── */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-400/30 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-500/20 p-3">
        <AlertCircle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
            AI providers charge for API usage.{' '}
            <a
              href={guide.pricingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Check their pricing page
            </a>{' '}
            before connecting.
          </p>
        </div>
      </div>

      {/* ── Provider-specific warning (e.g. OpenAI ChatGPT Plus caveat) ── */}
      {guide.warning && (
        <div className="flex items-start gap-2.5 rounded-lg border border-error/25 bg-error/5 p-3">
          <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
          <p className="text-xs text-error leading-relaxed">{guide.warning}</p>
        </div>
      )}

      {/* ── Provider-specific note (e.g. Anthropic Claude.ai vs API) ── */}
      {guide.note && (
        <div className="flex items-start gap-2.5 rounded-lg border border-card-border bg-surface-container p-3">
          <AlertCircle size={15} className="text-on-surface-variant shrink-0 mt-0.5" />
          <p className="text-xs text-on-surface-variant leading-relaxed">{guide.note}</p>
        </div>
      )}

      {/* ── Numbered steps ── */}
      <div className="flex flex-col gap-0 rounded-xl border border-card-border bg-surface overflow-hidden">
        {guide.steps.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-3 px-4 py-3 border-b border-card-border/60 last:border-b-0"
          >
            {/* Step number bubble */}
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
              {index + 1}
            </span>
            <p className="text-sm text-on-surface leading-relaxed flex-1 min-w-0">{step}</p>
          </div>
        ))}
      </div>

      {/* ── External console link button ── */}
      <Button
        variant="primary"
        size="md"
        fullWidth
        icon={<ExternalLink size={15} />}
        iconPosition="right"
        onClick={() => window.open(guide.consoleUrl, '_blank', 'noopener,noreferrer')}
      >
        Open {config.shortName} Console
      </Button>

      {/* ── Footer back link ── */}
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-on-surface-variant hover:text-on-surface underline underline-offset-2 transition-colors cursor-pointer text-center"
      >
        ← Back to connect your key
      </button>
    </div>
  );
}

export default ProviderSetupGuide;
