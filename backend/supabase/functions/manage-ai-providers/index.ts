import { createRemoteJWKSet, jwtVerify } from 'npm:jose@6';
import { createClient } from 'npm:@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
const issuer = (Deno.env.get('CLERK_ISSUER_URL') || '').replace(/\/$/, '');
const allowedOrigins = (Deno.env.get('AI_ALLOWED_ORIGINS') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const jwks = issuer
  ? createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
  : null;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// AI_PROVIDERS_ENCRYPTION_KEY must be a 32-byte value encoded as base64 (44 chars).
const ENCRYPTION_KEY_B64 = Deno.env.get('AI_PROVIDERS_ENCRYPTION_KEY') || '';

// ---------------------------------------------------------------------------
// Rate limiter – 30 req/min per user (best-effort, per-instance)
// ---------------------------------------------------------------------------
const rateLimitStore = new Map<string, { count: number; until: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(subject: string): boolean {
  const now = Date.now();
  for (const [id, usage] of rateLimitStore) {
    if (usage.until <= now) rateLimitStore.delete(id);
  }
  const usage = rateLimitStore.get(subject) ?? { count: 0, until: now + RATE_WINDOW_MS };
  if (++usage.count > RATE_LIMIT) return false;
  rateLimitStore.set(subject, usage);
  return true;
}

// ---------------------------------------------------------------------------
// Valid providers
// ---------------------------------------------------------------------------
type Provider = 'gemini' | 'openai' | 'anthropic' | 'grok';
const VALID_PROVIDERS: Provider[] = ['gemini', 'openai', 'anthropic', 'grok'];

function isValidProvider(p: unknown): p is Provider {
  return typeof p === 'string' && (VALID_PROVIDERS as string[]).includes(p);
}

// ---------------------------------------------------------------------------
// AES-256-GCM encryption helpers
// ---------------------------------------------------------------------------

/** Import the raw 32-byte master key once per cold start. */
let _cryptoKey: CryptoKey | null = null;
async function getMasterKey(): Promise<CryptoKey> {
  if (_cryptoKey) return _cryptoKey;
  const raw = Uint8Array.from(atob(ENCRYPTION_KEY_B64), (c) => c.charCodeAt(0));
  if (raw.length !== 32) {
    throw new Error('AI_PROVIDERS_ENCRYPTION_KEY must be exactly 32 bytes (base64-encoded).');
  }
  _cryptoKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
  return _cryptoKey;
}

/**
 * Encrypts plaintext with AES-256-GCM.
 * Returns a string formatted as `base64iv:base64ciphertext:base64authtag`.
 * The auth tag is embedded at the end of the ciphertext by SubtleCrypto, so we
 * split it off (last 16 bytes) for explicit storage, making the format unambiguous.
 */
async function encryptApiKey(plaintext: string): Promise<string> {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  // SubtleCrypto appends the 16-byte auth tag to the ciphertext buffer.
  const ciphertextWithTag = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded),
  );

  const ciphertext = ciphertextWithTag.slice(0, ciphertextWithTag.length - 16);
  const authTag = ciphertextWithTag.slice(ciphertextWithTag.length - 16);

  const b64 = (buf: Uint8Array) => btoa(String.fromCharCode(...buf));
  return `${b64(iv)}:${b64(ciphertext)}:${b64(authTag)}`;
}

/**
 * Decrypts a stored value produced by encryptApiKey().
 */
async function decryptApiKey(stored: string): Promise<string> {
  const key = await getMasterKey();
  const parts = stored.split(':');
  if (parts.length !== 3) throw new Error('Malformed encrypted key format.');

  const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const iv = fromB64(parts[0]);
  const ciphertext = fromB64(parts[1]);
  const authTag = fromB64(parts[2]);

  // Re-assemble: ciphertext || authTag for SubtleCrypto
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
  return new TextDecoder().decode(decrypted);
}

// ---------------------------------------------------------------------------
// Provider key validation (live API test)
// ---------------------------------------------------------------------------
interface TestResult {
  valid: boolean;
  error?: string;
}

async function testProviderKey(provider: Provider, apiKey: string): Promise<TestResult> {
  try {
    let response: Response;

    switch (provider) {
      case 'gemini': {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
          { method: 'GET', signal: AbortSignal.timeout(15_000) },
        );
        break;
      }
      case 'openai': {
        response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(15_000),
        });
        break;
      }
      case 'anthropic': {
        // Minimal messages payload – will return 400 (invalid_request_error) for bad model
        // but 401 for bad key. A successful auth returns 200 or a non-401 error.
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
          signal: AbortSignal.timeout(15_000),
        });
        // Anthropic returns 200 on success or 400 on bad model (key still valid)
        // 401 means bad key, 403 means insufficient permissions (key works but access limited)
        if (response.status === 401) {
          return { valid: false, error: 'Invalid Anthropic API key. Check your key and try again.' };
        }
        return { valid: true };
      }
      case 'grok': {
        response = await fetch('https://api.x.ai/v1/models', {
          method: 'GET',
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(15_000),
        });
        break;
      }
      default:
        return { valid: false, error: 'Unknown provider.' };
    }

    if (response.ok) return { valid: true };

    if (response.status === 401 || response.status === 403) {
      const providerLabel =
        provider === 'gemini'
          ? 'Google Gemini'
          : provider === 'openai'
          ? 'OpenAI'
          : provider === 'grok'
          ? 'Grok (xAI)'
          : provider;
      return {
        valid: false,
        error: `Invalid ${providerLabel} API key. Please check your key and try again.`,
      };
    }

    if (response.status === 429) {
      return { valid: false, error: 'The provider API is rate-limited. Your key may be valid – try again in a moment.' };
    }

    return { valid: false, error: `Provider returned an unexpected status (${response.status}). Check your key.` };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return { valid: false, error: 'Connection to the provider timed out. Please try again.' };
    }
    console.error('Provider test error:', err instanceof Error ? err.name : 'UnknownError');
    return { valid: false, error: 'Could not reach the provider to validate your key.' };
  }
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

type SupabaseClient = ReturnType<typeof createClient>;

/** LIST – returns safe provider records (no keys). */
async function handleList(supabase: SupabaseClient, userId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('user_ai_providers')
    .select('id, provider, key_hint, selected_model, is_default, connection_status, last_validated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('DB list error:', error.code);
    return jsonError('Could not load your AI providers. Please try again.', 502);
  }

  return json({ providers: data ?? [] });
}

/** UPSERT – validate key, encrypt, store. */
async function handleUpsert(
  supabase: SupabaseClient,
  userId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const { provider, api_key, selected_model } = body;

  if (!isValidProvider(provider)) {
    return jsonError('Please choose a valid provider: gemini, openai, anthropic, or grok.', 400);
  }
  if (typeof api_key !== 'string' || !api_key.trim()) {
    return jsonError('Please provide your API key.', 400);
  }
  if (typeof selected_model !== 'string' || !selected_model.trim()) {
    return jsonError('Please specify a model for this provider.', 400);
  }

  const trimmedKey = api_key.trim();

  // Live test before storing
  const testResult = await testProviderKey(provider, trimmedKey);
  if (!testResult.valid) {
    return jsonError(testResult.error ?? 'API key validation failed.', 422);
  }

  // Encrypt
  let encryptedKey: string;
  try {
    encryptedKey = await encryptApiKey(trimmedKey);
  } catch {
    console.error('Encryption failed');
    return jsonError('Could not securely store your API key. Please try again.', 500);
  }

  const keyHint = trimmedKey.slice(-4);
  const now = new Date().toISOString();

  const { error } = await supabase.from('user_ai_providers').upsert(
    {
      user_id: userId,
      provider,
      encrypted_api_key: encryptedKey,
      key_hint: keyHint,
      selected_model: selected_model.trim(),
      connection_status: 'connected',
      last_validated_at: now,
    },
    { onConflict: 'user_id,provider' },
  );

  if (error) {
    console.error('DB upsert error:', error.code);
    return jsonError('Could not save your API provider settings. Please try again.', 502);
  }

  return json({
    success: true,
    key_hint: keyHint,
    connection_status: 'connected',
    provider: {
      provider,
      key_hint: keyHint,
      selected_model: selected_model.trim(),
      is_default: false,
      connection_status: 'connected',
      last_validated_at: now,
    },
    message: `Your ${provider} API key has been saved successfully.`,
  });
}

/** DELETE – remove provider record. */
async function handleDelete(
  supabase: SupabaseClient,
  userId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const { provider } = body;

  if (!isValidProvider(provider)) {
    return jsonError('Please specify a valid provider to delete.', 400);
  }

  const { error, count } = await supabase
    .from('user_ai_providers')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('provider', provider);

  if (error) {
    console.error('DB delete error:', error.code);
    return jsonError('Could not remove the provider. Please try again.', 502);
  }

  if (count === 0) {
    return jsonError('No matching provider found to delete.', 404);
  }

  return json({ success: true, message: `Your ${provider} API key has been removed.` });
}

/** SET_DEFAULT – mark one provider as default, clear others. */
async function handleSetDefault(
  supabase: SupabaseClient,
  userId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const { provider } = body;

  if (!isValidProvider(provider)) {
    return jsonError('Please specify a valid provider.', 400);
  }

  // Verify the user has this provider stored
  const { data: existing, error: fetchErr } = await supabase
    .from('user_ai_providers')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();

  if (fetchErr) {
    console.error('DB fetch error:', fetchErr.code);
    return jsonError('Could not verify your provider. Please try again.', 502);
  }
  if (!existing) {
    return jsonError(`You don't have a saved ${provider} key yet.`, 404);
  }

  // Clear all defaults for this user
  const { error: clearErr } = await supabase
    .from('user_ai_providers')
    .update({ is_default: false })
    .eq('user_id', userId);

  if (clearErr) {
    console.error('DB clear default error:', clearErr.code);
    return jsonError('Could not update your default provider. Please try again.', 502);
  }

  // Set the chosen provider as default
  const { error: setErr } = await supabase
    .from('user_ai_providers')
    .update({ is_default: true })
    .eq('user_id', userId)
    .eq('provider', provider);

  if (setErr) {
    console.error('DB set default error:', setErr.code);
    return jsonError('Could not set the default provider. Please try again.', 502);
  }

  return json({ success: true, message: `${provider} is now your default AI provider.` });
}

/** TEST – validate an already-stored key (re-decrypt and test). */
async function handleTest(
  supabase: SupabaseClient,
  userId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const { provider } = body;

  if (!isValidProvider(provider)) {
    return jsonError('Please specify a valid provider to test.', 400);
  }

  const { data, error } = await supabase
    .from('user_ai_providers')
    .select('encrypted_api_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();

  if (error) {
    console.error('DB fetch for test error:', error.code);
    return jsonError('Could not retrieve your stored key. Please try again.', 502);
  }
  if (!data) {
    return jsonError(`No saved ${provider} key found. Please add one first.`, 404);
  }

  let plainKey: string;
  try {
    plainKey = await decryptApiKey(data.encrypted_api_key);
  } catch {
    console.error('Decryption failed during test');
    return jsonError('Could not read your stored key. It may be corrupted – please re-add it.', 500);
  }

  const testResult = await testProviderKey(provider, plainKey);
  const now = new Date().toISOString();
  const newStatus = testResult.valid ? 'connected' : 'error';

  // Update connection_status and last_validated_at in DB
  await supabase
    .from('user_ai_providers')
    .update({ connection_status: newStatus, last_validated_at: now })
    .eq('user_id', userId)
    .eq('provider', provider);

  if (!testResult.valid) {
    return json({ success: false, connection_status: newStatus, error: testResult.error }, 422);
  }

  return json({
    success: true,
    connection_status: newStatus,
    message: `Your ${provider} API key is working correctly.`,
  });
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
function json(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders ?? {}) },
  });
}

function jsonError(message: string, status: number): Response {
  return json({ error: message }, status);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '*';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
    'Content-Type': 'application/json',
  };

  /** Attach CORS headers to any Response before returning. */
  const withCors = (res: Response): Response => {
    const out = new Response(res.body, { status: res.status, headers: res.headers });
    for (const [k, v] of Object.entries(corsHeaders)) out.headers.set(k, v);
    return out;
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: corsHeaders });
  const respondError = (message: string, status: number) =>
    respond({ error: message }, status);

  const isAllowedOrigin =
    !origin ||
    origin === '*' ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    allowedOrigins.length === 0 ||
    allowedOrigins.some((o) => o.replace(/\/$/, '') === origin.replace(/\/$/, ''));

  if (!isAllowedOrigin) {
    return respondError('Origin is not allowed.', 403);
  }

  if (req.method !== 'POST') return respondError('Method not allowed.', 405);

  // Configuration guard
  if (!jwks || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ENCRYPTION_KEY_B64) {
    return respondError('AI provider management is not configured. Please contact your administrator.', 503);
  }

  // ---------------------------------------------------------------------------
  // Clerk JWT verification
  // ---------------------------------------------------------------------------
  let subject: string;
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new Error('Missing authorization token');
    const { payload } = await jwtVerify(token, jwks, { issuer, algorithms: ['RS256'] });
    if (!payload.sub || !payload.exp) {
      throw new Error('Invalid session: missing sub or exp');
    }
    if (payload.azp && allowedOrigins.length > 0) {
      const azpNorm = String(payload.azp).replace(/\/$/, '');
      const match = allowedOrigins.some((o) => o.replace(/\/$/, '') === azpNorm) || azpNorm.includes('clerk.accounts.dev');
      if (!match) {
        console.warn(`JWT azp '${payload.azp}' not in allowed origins`, allowedOrigins);
      }
    }
    subject = payload.sub;
  } catch (err) {
    console.error('Clerk JWT verification error in manage-ai-providers:', err instanceof Error ? err.message : err);
    return respondError('Your session expired. Please sign in again.', 401);
  }

  // ---------------------------------------------------------------------------
  // Rate limit
  // ---------------------------------------------------------------------------
  if (!checkRateLimit(subject)) {
    return respondError('Too many requests. Please wait a minute before trying again.', 429);
  }

  // ---------------------------------------------------------------------------
  // Parse body
  // ---------------------------------------------------------------------------
  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new Error('Not an object');
    }
  } catch {
    return respondError('Invalid request body. Please send a JSON object.', 400);
  }

  const action = body.action;
  if (typeof action !== 'string' || !action) {
    return respondError('Missing required field: action.', 400);
  }

  // ---------------------------------------------------------------------------
  // Supabase admin client (bypasses RLS for server-side operations)
  // ---------------------------------------------------------------------------
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // ---------------------------------------------------------------------------
  // Dispatch
  // ---------------------------------------------------------------------------
  try {
    let actionRes: Response;
    switch (action) {
      case 'list':
        actionRes = await handleList(supabase, subject);
        break;

      case 'upsert':
        actionRes = await handleUpsert(supabase, subject, body);
        break;

      case 'delete':
        actionRes = await handleDelete(supabase, subject, body);
        break;

      case 'set_default':
        actionRes = await handleSetDefault(supabase, subject, body);
        break;

      case 'test':
        actionRes = await handleTest(supabase, subject, body);
        break;

      default:
        actionRes = respondError(`Unknown action: "${action}". Valid actions are: list, upsert, delete, set_default, test.`, 400);
        break;
    }
    return withCors(actionRes);
  } catch (err) {
    console.error('manage-ai-providers unhandled error:', err instanceof Error ? err.name : 'UnknownError');
    return respondError('An unexpected error occurred. Please try again.', 500);
  }
});
