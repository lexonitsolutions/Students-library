// ---------------------------------------------------------------------------
// AI Provider type definitions & static configuration
// Used by aiProvidersService.ts and useAIProviders.tsx
// ---------------------------------------------------------------------------

// ── Primitive union types ───────────────────────────────────────────────────

export type AIProviderName = 'gemini' | 'openai' | 'anthropic' | 'grok';

export type ConnectionStatus = 'connected' | 'failed' | 'unknown';

// ── Database / API response shapes ─────────────────────────────────────────

/**
 * What the backend returns for a saved provider row.
 * The actual API key is NEVER included – only a 4-character hint.
 */
export interface UserAIProvider {
  id: string;
  user_id: string;
  provider: AIProviderName;
  /** Last 4 characters of the stored key, e.g. "A7xQ" */
  key_hint: string;
  selected_model: string;
  is_default: boolean;
  connection_status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  last_validated_at: string | null;
}

// ── Static provider configuration ──────────────────────────────────────────

export interface ProviderConfig {
  id: AIProviderName;
  displayName: string;
  shortName: string;
  description: string;
  docsUrl: string;
  pricingUrl: string;
  setupGuideUrl: string;
  /** Ordered list of model IDs to show when no server-supplied list is available */
  defaultModels: string[];
  /** Expected key prefix used for lightweight client-side validation hints */
  keyPrefix: string;
  /** Placeholder text shown inside the API key input field */
  keyPlaceholder: string;
  /** Tailwind color name (without shade) used for accent elements, e.g. 'blue' */
  accentColor: string;
}

// ── Service result types ────────────────────────────────────────────────────

export interface TestConnectionResult {
  success: boolean;
  error?: string;
  /** Model IDs returned by the provider on a successful connectivity test */
  models?: string[];
}

export interface UpsertProviderResult {
  success: boolean;
  provider?: UserAIProvider;
  error?: string;
}

// ── Static configuration map ────────────────────────────────────────────────

/**
 * Compile-time exhaustive map of every supported AI provider.
 * Import this constant wherever you need display names, URLs, or defaults –
 * do NOT import it into React render paths as a component; it is plain data.
 */
export const PROVIDER_CONFIGS: Record<AIProviderName, ProviderConfig> = {
  gemini: {
    id: 'gemini',
    displayName: 'Google Gemini AI',
    shortName: 'Gemini',
    description:
      "Google's multimodal AI models, featuring long context windows and strong reasoning capabilities.",
    docsUrl: 'https://aistudio.google.com/apikey',
    pricingUrl: 'https://ai.google.dev/pricing',
    setupGuideUrl: 'https://aistudio.google.com/apikey',
    defaultModels: [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
    ],
    keyPrefix: '',
    keyPlaceholder: 'AQ... or AIza...',
    accentColor: 'blue',
  },

  openai: {
    id: 'openai',
    displayName: 'OpenAI',
    shortName: 'OpenAI',
    description:
      'Industry-leading GPT models offering a broad range of capabilities from chat to advanced reasoning.',
    docsUrl: 'https://platform.openai.com/api-keys',
    pricingUrl: 'https://openai.com/api/pricing',
    setupGuideUrl: 'https://platform.openai.com/api-keys',
    defaultModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-...',
    accentColor: 'green',
  },

  anthropic: {
    id: 'anthropic',
    displayName: 'Anthropic Claude',
    shortName: 'Claude',
    description:
      "Anthropic's Claude models, designed with a strong focus on safety, helpfulness, and honesty.",
    docsUrl: 'https://console.anthropic.com/settings/keys',
    pricingUrl: 'https://www.anthropic.com/pricing',
    setupGuideUrl: 'https://console.anthropic.com/settings/keys',
    defaultModels: [
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
      'claude-3-opus-latest',
    ],
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-...',
    accentColor: 'orange',
  },

  grok: {
    id: 'grok',
    displayName: 'xAI Grok',
    shortName: 'Grok',
    description:
      "xAI's Grok models, offering real-time knowledge and powerful reasoning via the X platform.",
    docsUrl: 'https://console.x.ai/',
    pricingUrl: 'https://x.ai/api',
    setupGuideUrl: 'https://console.x.ai/',
    defaultModels: ['grok-2-1212', 'grok-2-vision-1212', 'grok-beta'],
    keyPrefix: 'xai-',
    keyPlaceholder: 'xai-...',
    accentColor: 'gray',
  },
} as const;
