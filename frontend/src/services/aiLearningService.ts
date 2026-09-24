import { supabaseKey, supabaseUrl } from '../lib/supabaseClient';
import { learningModes, parseLearningReply, type LearningSession, type LearningMessage, type LearningMode } from '../data/aiLearning';
const key = (userId: string) => `answersbro:ai-learning:v1:${userId}`;
export function loadLearningSessions(userId: string): LearningSession[] {
  try {
    const items: unknown = JSON.parse(localStorage.getItem(key(userId)) || '[]');
    if (!Array.isArray(items)) return [];
    return items.filter((s): s is LearningSession => s && typeof s.id === 'string' && typeof s.title === 'string' && typeof s.updatedAt === 'string' && !isNaN(Date.parse(s.updatedAt)) && learningModes.some(m => m.id === s.mode) && Array.isArray(s.messages) && s.messages.length <= 60 && s.messages.every((m: LearningMessage) => m && typeof m.id === 'string' && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && (!m.reply || Boolean(parseLearningReply(m.reply))))).slice(0, 20);
  } catch { return []; }
}
export function saveLearningSessions(userId: string, sessions: LearningSession[]) {
  localStorage.setItem(key(userId), JSON.stringify(sessions.slice(0, 20)));
}
export async function askLearningAI(options: { mode: LearningMode; messages: LearningMessage[]; file?: File; token: string; signal: AbortSignal }) {
  const form = new FormData();
  form.set('mode', options.mode);
  form.set('messages', JSON.stringify(options.messages.slice(-20).map(m => ({ role: m.role, content: m.reply ? JSON.stringify(m.reply) : m.content }))));
  if (options.file) form.set('file', options.file);
  const response = await fetch(import.meta.env.VITE_AI_LEARNING_ENDPOINT || `${supabaseUrl}/functions/v1/ai-learning`, {
    method: 'POST', headers: { Authorization: `Bearer ${options.token}`, apikey: supabaseKey }, body: form, signal: options.signal,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || (response.status === 401 ? 'Your session expired. Please sign in again.' : response.status === 404 ? 'Study LAB is not connected yet. Please ask your administrator to enable it.' : 'The learning assistant is unavailable. Please try again.'));
  return parseLearningReply(result);
}
