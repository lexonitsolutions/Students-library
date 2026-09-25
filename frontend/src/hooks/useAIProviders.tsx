// ---------------------------------------------------------------------------
// useAIProviders – React hook
// Manages the full lifecycle of BYOK AI provider state for the current user.
//
// Auth: resolves the Clerk JWT via useClerkAuth().getToken() before every
// mutating call.  When the user is unauthenticated every method is a no-op
// that returns a safe empty result.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';
import {
  deleteProvider as svcDelete,
  listUserProviders,
  setDefaultProvider as svcSetDefault,
  testProviderConnection,
  upsertProvider as svcUpsert,
} from '../services/aiProvidersService';
import type {
  AIProviderName,
  TestConnectionResult,
  UpsertProviderResult,
  UserAIProvider,
} from '../types/aiProviders.types';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

// ── Public interface ────────────────────────────────────────────────────────

export interface UseAIProvidersReturn {
  /** All providers saved by the current user */
  providers: UserAIProvider[];
  /** Convenience: the provider with is_default === true, or null */
  defaultProvider: UserAIProvider | null;
  /** True while the initial fetch (or a refresh) is in-flight */
  loading: boolean;
  /** Human-readable error from the last failed operation, or null */
  error: string | null;
  /** Manually re-fetches the provider list from the edge function */
  refreshProviders: () => Promise<void>;
  /** Saves (create or update) a provider for the current user */
  upsertProvider: (params: {
    provider: AIProviderName;
    api_key: string;
    selected_model: string;
  }) => Promise<UpsertProviderResult>;
  /** Removes a saved provider */
  deleteProvider: (
    provider: AIProviderName,
  ) => Promise<{ success: boolean; error?: string }>;
  /** Marks a provider as the user's default */
  setDefaultProvider: (
    provider: AIProviderName,
  ) => Promise<{ success: boolean; error?: string }>;
  /** Validates the stored key against the provider's live API */
  testProvider: (provider: AIProviderName) => Promise<TestConnectionResult>;
}

// ── Empty / unauthenticated result ──────────────────────────────────────────

const EMPTY_STATE: Pick<
  UseAIProvidersReturn,
  'providers' | 'defaultProvider' | 'loading' | 'error'
> = {
  providers: [],
  defaultProvider: null,
  loading: false,
  error: null,
};

// ── Hook implementation ─────────────────────────────────────────────────────

export function useAIProviders(): UseAIProvidersReturn {
  const { getToken, isSignedIn, isLoaded } = useClerkAuth();

  const [providers, setProviders] = useState<UserAIProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived state ─────────────────────────────────────────────────────────

  const defaultProvider: UserAIProvider | null =
    providers.find((p) => p.is_default) ?? null;

  // ── Core fetch ────────────────────────────────────────────────────────────

  const refreshProviders = useCallback(async (): Promise<void> => {
    if (!isLoaded || !isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError('Unable to retrieve authentication token. Please sign in again.');
        return;
      }

      const fetched = await listUserProviders(token);
      setProviders(fetched);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load your AI providers.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  // Fetch on mount and whenever auth state resolves
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void refreshProviders();
    } else if (isLoaded && !isSignedIn) {
      // User signed out: clear any cached state
      setProviders([]);
      setError(null);
    }
  }, [isLoaded, isSignedIn, refreshProviders]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const upsertProvider = useCallback(
    async (params: {
      provider: AIProviderName;
      api_key: string;
      selected_model: string;
    }): Promise<UpsertProviderResult> => {
      if (!isLoaded || !isSignedIn) {
        return { success: false, error: 'You must be signed in to add a provider.' };
      }

      try {
        const token = await getToken();
        if (!token) {
          return { success: false, error: 'Unable to retrieve authentication token.' };
        }

        const result = await svcUpsert(token, params);

        if (result.success) {
          // Optimistic local update: replace or append
          setProviders((prev) => {
            const exists = prev.some((p) => p.provider === params.provider);
            if (exists && result.provider) {
              return prev.map((p) =>
                p.provider === params.provider ? result.provider! : p,
              );
            }
            return result.provider ? [...prev, result.provider] : prev;
          });
        }

        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err.message : 'Failed to save provider.';
        return { success: false, error };
      }
    },
    [isLoaded, isSignedIn, getToken],
  );

  const deleteProvider = useCallback(
    async (
      provider: AIProviderName,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isLoaded || !isSignedIn) {
        return { success: false, error: 'You must be signed in to delete a provider.' };
      }

      try {
        const token = await getToken();
        if (!token) {
          return { success: false, error: 'Unable to retrieve authentication token.' };
        }

        const result = await svcDelete(token, provider);

        if (result.success) {
          setProviders((prev) => prev.filter((p) => p.provider !== provider));
        }

        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err.message : 'Failed to delete provider.';
        return { success: false, error };
      }
    },
    [isLoaded, isSignedIn, getToken],
  );

  const setDefaultProvider = useCallback(
    async (
      provider: AIProviderName,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!isLoaded || !isSignedIn) {
        return { success: false, error: 'You must be signed in to change the default provider.' };
      }

      try {
        const token = await getToken();
        if (!token) {
          return { success: false, error: 'Unable to retrieve authentication token.' };
        }

        const result = await svcSetDefault(token, provider);

        if (result.success) {
          // Optimistic: flip is_default flags locally
          setProviders((prev) =>
            prev.map((p) => ({ ...p, is_default: p.provider === provider })),
          );
        }

        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err.message : 'Failed to set default provider.';
        return { success: false, error };
      }
    },
    [isLoaded, isSignedIn, getToken],
  );

  const testProvider = useCallback(
    async (provider: AIProviderName): Promise<TestConnectionResult> => {
      if (!isLoaded || !isSignedIn) {
        return { success: false, error: 'You must be signed in to test a provider.' };
      }

      try {
        const token = await getToken();
        if (!token) {
          return { success: false, error: 'Unable to retrieve authentication token.' };
        }

        const result = await testProviderConnection(token, provider);

        // Reflect updated connection_status in local state
        if (result.success) {
          setProviders((prev) =>
            prev.map((p) =>
              p.provider === provider
                ? { ...p, connection_status: 'connected' as const }
                : p,
            ),
          );
        } else {
          setProviders((prev) =>
            prev.map((p) =>
              p.provider === provider
                ? { ...p, connection_status: 'failed' as const }
                : p,
            ),
          );
        }

        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err.message : 'Connection test failed.';
        return { success: false, error };
      }
    },
    [isLoaded, isSignedIn, getToken],
  );

  // ── Return value ──────────────────────────────────────────────────────────

  // Not yet loaded: return neutral state (loading spinner can use `loading`)
  if (!isLoaded) {
    return {
      ...EMPTY_STATE,
      loading: true,
      refreshProviders,
      upsertProvider,
      deleteProvider,
      setDefaultProvider,
      testProvider,
    };
  }

  // Unauthenticated: return empty state with no-op-like stubs already defined
  if (!isSignedIn) {
    return {
      ...EMPTY_STATE,
      refreshProviders,
      upsertProvider,
      deleteProvider,
      setDefaultProvider,
      testProvider,
    };
  }

  return {
    providers,
    defaultProvider,
    loading,
    error,
    refreshProviders,
    upsertProvider,
    deleteProvider,
    setDefaultProvider,
    testProvider,
  };
}
