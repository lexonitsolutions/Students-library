import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { useAIProviders } from '../hooks/useAIProviders';
import {
  AIAskBox,
  ContinueLearning,
  GreetingHeader,
  LearningModes,
  QuickPrompts,
} from '../components/learning/LearningHome';
import { AILearningWorkspace } from '../components/learning/AILearningWorkspace';
import { NoProviderSetup } from '../components/ai-providers/NoProviderSetup';
import { ProviderSelector } from '../components/ai-providers/ProviderSelector';
import { getMode, type LearningMode, type LearningSession, type LearningMessage } from '../data/aiLearning';
import { askLearningAI, byokAskLearningAI, loadLearningSessions, saveLearningSessions } from '../services/aiLearningService';
import type { AIProviderName } from '../types/aiProviders.types';
import { PROVIDER_CONFIGS } from '../types/aiProviders.types';

// ---------------------------------------------------------------------------
// LearningDesk — inner component (mounted once per authenticated user)
// ---------------------------------------------------------------------------
function LearningDesk({ userId, name }: { userId: string; name: string }) {
  const { getToken } = useClerkAuth();
  const { providers, defaultProvider, loading: providersLoading, refreshProviders } = useAIProviders();

  const [sessions, setSessions] = useState(() => loadLearningSessions(userId));
  const [session, setSession] = useState<LearningSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState('');

  // Provider/model selection (persisted per user in localStorage)
  const [selectedProvider, setSelectedProvider] = useState<AIProviderName | null>(() => {
    try {
      return (localStorage.getItem(`answersbro:ai-selected-provider:${userId}`) as AIProviderName | null) ?? null;
    } catch { return null; }
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(`answersbro:ai-selected-model:${userId}`) ?? '';
      if (stored.includes('2.5')) return 'gemini-2.0-flash';
      return stored;
    } catch { return ''; }
  });

  const controller = useRef<AbortController | null>(null);
  const retryRequest = useRef<{ session: LearningSession; text: string; file?: File } | null>(null);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);

  useEffect(() => {
    try { saveLearningSessions(userId, sessions); setStorageError(''); }
    catch { setStorageError('Your browser could not save this session. Keep this tab open to continue.'); }
  }, [sessions, userId]);

  // When providers load, auto-select the default (if no manual override)
  useEffect(() => {
    if (!providersLoading && providers.length > 0) {
      const activeP = selectedProvider ?? defaultProvider?.provider ?? providers[0].provider;
      setSelectedProvider(activeP);
      const cfg = PROVIDER_CONFIGS[activeP];
      const provRow = providers.find(p => p.provider === activeP);
      let targetModel = selectedModel || provRow?.selected_model || cfg.defaultModels[0] || '';
      if (targetModel.includes('2.5') || !cfg.defaultModels.includes(targetModel)) {
        targetModel = cfg.defaultModels[0];
      }
      setSelectedModel(targetModel);
      try {
        localStorage.setItem(`answersbro:ai-selected-provider:${userId}`, activeP);
        localStorage.setItem(`answersbro:ai-selected-model:${userId}`, targetModel);
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providersLoading, providers.length]);

  // Persist provider/model selection
  const handleProviderChange = (provider: AIProviderName) => {
    setSelectedProvider(provider);
    const prov = providers.find(p => p.provider === provider);
    const cfg = PROVIDER_CONFIGS[provider];
    const model = prov?.selected_model || cfg.defaultModels[0] || '';
    setSelectedModel(model);
    try {
      localStorage.setItem(`answersbro:ai-selected-provider:${userId}`, provider);
      localStorage.setItem(`answersbro:ai-selected-model:${userId}`, model);
    } catch { /* ignore */ }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    try { localStorage.setItem(`answersbro:ai-selected-model:${userId}`, model); }
    catch { /* ignore */ }
  };

  const persist = (next: LearningSession) => {
    setSession(next);
    setSessions(prev => [next, ...prev.filter(s => s.id !== next.id)].slice(0, 20));
  };

  function createSession(mode: LearningMode): LearningSession {
    return { id: crypto.randomUUID(), title: getMode(mode).title, mode, updatedAt: new Date().toISOString(), messages: [] };
  }

  function select(mode: LearningMode) { setError(''); setSession(createSession(mode)); retryRequest.current = null; }

  async function send(text: string, file?: File, base = session ?? createSession('explain')): Promise<boolean> {
    if (controller.current) return false;
    if (base.messages.length >= 60) { setError('This session is full. Start a new session from your learning desk.'); return false; }

    const request = new AbortController(); controller.current = request;
    setBusy(true); setError('');
    retryRequest.current = { session: base, text, file };

    const message: LearningMessage = { id: crypto.randomUUID(), role: 'user', content: text, attachmentName: file?.name };
    const next = { ...base, title: base.messages.length ? base.title : text.slice(0, 80), updatedAt: new Date().toISOString(), messages: [...base.messages, message] };
    persist(next);

    const timeout = setTimeout(() => request.abort('timeout'), 90000);
    try {
      const token = await getToken();
      if (!token) throw new Error('Please sign in to use Study LAB.');

      let reply;
      if (selectedProvider && providers.some(p => p.provider === selectedProvider)) {
        // BYOK path — student's own API key
        reply = await byokAskLearningAI({
          mode: base.mode,
          messages: next.messages,
          file,
          token,
          signal: request.signal,
          provider: selectedProvider,
          model: selectedModel || PROVIDER_CONFIGS[selectedProvider].defaultModels[0] || '',
        });
      } else {
        // Fallback to shared Gemini key (requires GEMINI_API_KEY secret set)
        reply = await askLearningAI({ mode: base.mode, messages: next.messages, file, token, signal: request.signal });
      }

      if (!mounted.current || request.signal.aborted) return false;
      persist({
        ...next,
        updatedAt: new Date().toISOString(),
        messages: [...next.messages, { id: crypto.randomUUID(), role: 'assistant', content: reply.text, reply }],
      });
      retryRequest.current = null;
      return true;
    } catch (err) {
      if (mounted.current) {
        setError(
          request.signal.aborted
            ? request.signal.reason === 'timeout'
              ? 'The response took too long. Please retry.'
              : 'Response stopped. You can retry when ready.'
            : err instanceof Error
              ? err.message
              : 'Could not connect. Please try again.',
        );
      }
      return false;
    } finally {
      clearTimeout(timeout);
      controller.current = null;
      if (mounted.current) setBusy(false);
    }
  }

  function goBack() { if (busy) return; setSession(null); setError(''); retryRequest.current = null; }

  // Show first-time setup if no providers connected and loading is done
  const hasProviders = !providersLoading && providers.length > 0;
  const stillLoadingProviders = providersLoading && providers.length === 0;

  if (!hasProviders && !stillLoadingProviders) {
    return (
      <div className="w-full min-w-0 pb-4">
        <NoProviderSetup onConnected={refreshProviders} />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5 pb-6">
      {storageError && (
        <motion.p 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="status" 
          className="text-xs text-error font-medium p-2.5 rounded-lg bg-error/10 border border-error/20"
        >
          {storageError}
        </motion.p>
      )}

      {/* Provider / model selector — always visible when providers exist */}
      {hasProviders && (
        <ProviderSelector
          providers={providers}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
          disabled={busy}
        />
      )}

      <AnimatePresence mode="wait">
        {session ? (
          <motion.div
            key="active-workspace"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <AILearningWorkspace
              key={session.id}
              session={session}
              busy={busy}
              error={error}
              onSend={(text, file) => send(text, file)}
              onBack={goBack}
              onStop={() => controller.current?.abort()}
              onRetry={() => { const retry = retryRequest.current; if (retry) void send(retry.text, retry.file, retry.session); }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="learning-desk"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-5 sm:space-y-6"
          >
            <GreetingHeader name={name} />
            <div className="space-y-3">
              <AIAskBox busy={busy} onSend={(text, file) => send(text, file)} />
              <QuickPrompts onSelect={select} />
            </div>
            <LearningModes onSelect={select} />
            <ContinueLearning sessions={sessions} onContinue={s => { setSession(s); setError(''); }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AILearningPage — route-level component
// ---------------------------------------------------------------------------
export function AILearningPage() {
  const { user, isExploring } = useAuth();
  if (!user || isExploring) return <p className="text-on-surface">Please sign in to use Study LAB.</p>;
  return <LearningDesk key={user.id} userId={user.id} name={user.name || user.username || 'Student'} />;
}
