import { useEffect, useRef, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { AIAskBox, ContinueLearning, GreetingHeader, LearningModes, QuickPrompts } from '../components/learning/LearningHome';
import { AILearningWorkspace } from '../components/learning/AILearningWorkspace';
import { getMode, type LearningMode, type LearningSession, type LearningMessage } from '../data/aiLearning';
import { askLearningAI, loadLearningSessions, saveLearningSessions } from '../services/aiLearningService';
function LearningDesk({ userId, name }: { userId: string; name: string }) {
  const { getToken } = useClerkAuth();
  const [sessions, setSessions] = useState(() => loadLearningSessions(userId));
  const [session, setSession] = useState<LearningSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const retryRequest = useRef<{ session: LearningSession; text: string; file?: File } | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  useEffect(() => { try { saveLearningSessions(userId, sessions); setStorageError(''); } catch { setStorageError('Your browser could not save this session. Keep this tab open to continue.'); } }, [sessions, userId]);
  const persist = (next: LearningSession) => { setSession(next); setSessions(prev => [next, ...prev.filter(s => s.id !== next.id)].slice(0, 20)); };
  function createSession(mode: LearningMode): LearningSession { return { id: crypto.randomUUID(), title: getMode(mode).title, mode, updatedAt: new Date().toISOString(), messages: [] }; }
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
      const reply = await askLearningAI({ mode: base.mode, messages: next.messages, file, token, signal: request.signal });
      if (!mounted.current || request.signal.aborted) return false;
      persist({ ...next, updatedAt: new Date().toISOString(), messages: [...next.messages, { id: crypto.randomUUID(), role: 'assistant', content: reply.text, reply }] });
      retryRequest.current = null;
      return true;
    } catch (err) {
      if (mounted.current) setError(request.signal.aborted ? request.signal.reason === 'timeout' ? 'The response took too long. Please retry.' : 'Response stopped. You can retry when ready.' : err instanceof Error ? err.message : 'Could not connect. Please try again.');
      return false;
    } finally { clearTimeout(timeout); controller.current = null; if (mounted.current) setBusy(false); }
  }
  function goBack() { if (busy) return; setSession(null); setError(''); retryRequest.current = null; }
  return <div className="w-full min-w-0 space-y-7 sm:space-y-8 pb-4">{storageError && <p role="status" className="text-body-sm text-error">{storageError}</p>}{session ? <AILearningWorkspace key={session.id} session={session} busy={busy} error={error} onSend={(text, file) => send(text, file)} onBack={goBack} onStop={() => controller.current?.abort()} onRetry={() => { const retry = retryRequest.current; if (retry) void send(retry.text, retry.file, retry.session); }} /> : <><GreetingHeader name={name} /><div className="space-y-3"><AIAskBox busy={busy} onSend={(text, file) => send(text, file)} /><QuickPrompts onSelect={select} /></div><LearningModes onSelect={select} /><ContinueLearning sessions={sessions} onContinue={s => { setSession(s); setError(''); }} /></>}</div>;
}
export function AILearningPage() {
  const { user, isExploring } = useAuth();
  if (!user || isExploring) return <p className="text-on-surface">Please sign in to use Study LAB.</p>;
  return <LearningDesk key={user.id} userId={user.id} name={user.name || user.username || 'Student'} />;
}
