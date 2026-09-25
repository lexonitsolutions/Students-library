// ---------------------------------------------------------------------------
// AI Providers Service
// Communicates with the `manage-ai-providers` Supabase Edge Function.
//
// Auth: callers must supply a Clerk JWT (use useClerkAuth().getToken()).
// The actual API keys are NEVER handled or logged by this service.
// ---------------------------------------------------------------------------

import { supabaseKey, supabaseUrl } from '../lib/supabaseClient';
import type {
  AIProviderName,
  TestConnectionResult,
  UpsertProviderResult,
  UserAIProvider,
} from '../types/aiProviders.types';

// ── Shared internals ────────────────────────────────────────────────────────

const ENDPOINT = `${supabaseUrl}/functions/v1/manage-ai-providers`;

/**
 * Builds the shared request headers.
 * `apikey` is the Supabase publishable (anon) key – required by the edge
 * function gateway.  `Authorization` carries the Clerk JWT so the function
 * can identify the caller.
 */
function buildHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    apikey: supabaseKey,
  };
}

/**
 * Fires a POST request to the edge function and returns the parsed JSON body.
 * Throws a normalised Error when the HTTP status is not OK.
 */
async function callEdgeFunction<T>(
  token: string,
  body: Record<string, unknown>,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('Edge function fetch error:', err);
    throw new Error('Could not reach the AI service. Please verify your connection or retry in a moment.');
  }

  const result: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (result as { error?: string } | null)?.error ??
      (response.status === 401
        ? 'Your session expired. Please sign in again.'
        : response.status === 403
          ? 'You do not have permission to perform this action.'
          : response.status === 404
            ? 'The AI providers service is not available. Please contact your administrator.'
            : 'An unexpected error occurred. Please try again.');
    throw new Error(message);
  }

  return result as T;
}

// ── Exported service functions ──────────────────────────────────────────────

/**
 * Returns all AI providers saved by the authenticated user.
 * Resolves to an empty array on any error so callers can render safely.
 */
export async function listUserProviders(
  token: string,
): Promise<UserAIProvider[]> {
  try {
    const result = await callEdgeFunction<{ providers: UserAIProvider[] }>(
      token,
      { action: 'list' },
    );
    return Array.isArray(result?.providers) ? result.providers : [];
  } catch {
    // Non-blocking: UI should show empty state rather than crash
    return [];
  }
}

/**
 * Creates or updates a provider entry for the authenticated user.
 * The `api_key` is sent directly to the edge function and is never logged.
 */
export async function upsertProvider(
  token: string,
  params: {
    provider: AIProviderName;
    api_key: string;
    selected_model: string;
  },
): Promise<UpsertProviderResult> {
  try {
    const result = await callEdgeFunction<{ provider: UserAIProvider }>(
      token,
      { action: 'upsert', ...params },
    );
    return { success: true, provider: result.provider };
  } catch (err) {
    const error =
      err instanceof Error ? err.message : 'Failed to save provider.';
    return { success: false, error };
  }
}

/**
 * Removes a provider entry for the authenticated user.
 */
export async function deleteProvider(
  token: string,
  provider: AIProviderName,
): Promise<{ success: boolean; error?: string }> {
  try {
    await callEdgeFunction<unknown>(token, { action: 'delete', provider });
    return { success: true };
  } catch (err) {
    const error =
      err instanceof Error ? err.message : 'Failed to delete provider.';
    return { success: false, error };
  }
}

/**
 * Marks the specified provider as the user's default for AI features.
 */
export async function setDefaultProvider(
  token: string,
  provider: AIProviderName,
): Promise<{ success: boolean; error?: string }> {
  try {
    await callEdgeFunction<unknown>(token, { action: 'set_default', provider });
    return { success: true };
  } catch (err) {
    const error =
      err instanceof Error ? err.message : 'Failed to set default provider.';
    return { success: false, error };
  }
}

/**
 * Asks the edge function to validate the stored key against the provider's
 * API and returns the connectivity result, optionally with available models.
 */
export async function testProviderConnection(
  token: string,
  provider: AIProviderName,
): Promise<TestConnectionResult> {
  try {
    const result = await callEdgeFunction<TestConnectionResult>(token, {
      action: 'test',
      provider,
    });
    return {
      success: result.success ?? false,
      error: result.error,
      models: Array.isArray(result.models) ? result.models : undefined,
    };
  } catch (err) {
    const error =
      err instanceof Error ? err.message : 'Connection test failed.';
    return { success: false, error };
  }
}
