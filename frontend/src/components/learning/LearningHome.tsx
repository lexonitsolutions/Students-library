import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Brain, CalendarDays, ChevronDown, ChevronUp, CircleHelp, FileText, History, Layers, Lightbulb, LoaderCircle, Paperclip, Search, Send, Sparkles, Target, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { getMode, greeting, learningModes, type LearningMode, type LearningSession } from '../../data/aiLearning';
const icons = { explain: BookOpen, research: Search, exam: Target, planner: CalendarDays, summarize: FileText, quiz: CircleHelp, flashcards: Layers, doubt: Lightbulb, practice: Brain, brainstorm: Sparkles };
export function GreetingHeader({ name }: { name: string }) {
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => { const timer = setInterval(() => setHour(new Date().getHours()), 60000); return () => clearInterval(timer); }, []);
  return <header><div className="mb-3 flex items-center gap-2 text-label-sm font-semibold text-primary"><Sparkles size={16} /> Study LAB</div><h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-on-surface break-words">{greeting(hour)}, {name.trim().split(/\s+/)[0] || 'Student'} <span aria-hidden="true">👋</span></h1><p className="mt-2 text-body-sm sm:text-body-md text-on-surface-variant">What would you like to learn today?</p></header>;
}
export function AIAskBox({ onSend, busy, initialValue = '', placeholder = 'Ask anything you want to learn...', onStop }: { onSend: (text: string, file?: File) => Promise<boolean>; busy: boolean; initialValue?: string; placeholder?: string; onStop?: () => void }) {
  const [text, setText] = useState(initialValue);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const submitting = useRef(false);
  useEffect(() => { setText(initialValue); if (initialValue) textarea.current?.focus(); }, [initialValue]);
  async function submit() {
    if (busy || submitting.current || !text.trim()) return;
    submitting.current = true;
    try { if (await onSend(text.trim(), file)) { setText(''); setFile(undefined); } } finally { submitting.current = false; }
  }
  return <Card hoverable={false} className="!p-4 sm:!p-5 focus-within:border-primary/50">
    <form onSubmit={e => { e.preventDefault(); void submit(); }}>
      <label className="sr-only" htmlFor="ai-question">Your learning question</label>
      <textarea ref={textarea} id="ai-question" value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} maxLength={12000} rows={3} disabled={busy} className="w-full min-w-0 resize-y min-h-24 max-h-72 bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none disabled:opacity-60" onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) { e.preventDefault(); void submit(); } }} />
      {file && <div className="mb-3 flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 text-body-sm text-on-surface"><FileText size={16} className="shrink-0" /><span className="truncate min-w-0 flex-1">{file.name}</span><button type="button" disabled={busy} aria-label="Remove attachment" onClick={() => setFile(undefined)} className="p-2 rounded-lg hover:bg-surface-container-high"><X size={16} /></button></div>}
      {error && <p role="alert" className="mb-3 text-body-sm text-error">{error}</p>}
      <div className="flex items-center justify-between gap-2 border-t border-card-border pt-3">
        <input ref={input} type="file" accept=".pdf,.txt,.md" className="hidden" aria-label="Attach study notes" onChange={e => { const next = e.target.files?.[0]; e.target.value = ''; setError(''); if (!next) return; if (!/\.(pdf|txt|md)$/i.test(next.name)) { setError('Choose a PDF, TXT, or Markdown file.'); return; } if (next.size > 5 * 1024 * 1024) { setError('Choose a file smaller than 5 MB.'); return; } setFile(next); }} />
        <Button type="button" variant="ghost" disabled={busy} onClick={() => input.current?.click()} icon={<Paperclip size={17} />} aria-label="Attach notes (PDF, TXT or Markdown, up to 5 MB)"><span className="hidden sm:inline">Attach notes</span></Button>
        {busy ? <Button key="stop" type="button" variant="ghost" onClick={e => { e.preventDefault(); onStop?.(); }} icon={<X size={16} />}>Stop</Button> : <Button key="send" type="submit" disabled={!text.trim()} icon={<Send size={16} />}>Ask AI</Button>}
      </div>
      <p className="mt-2 text-xs text-on-surface-variant">PDF, TXT or Markdown · Up to 5 MB · Attachments are sent with your question.</p>
    </form>
  </Card>;
}
const quickPrompts: { label: string; mode: LearningMode }[] = [{ label: 'Explain a topic', mode: 'explain' }, { label: 'Prepare for an exam', mode: 'exam' }, { label: 'Research something', mode: 'research' }, { label: 'Summarize my notes', mode: 'summarize' }, { label: 'Create a study plan', mode: 'planner' }, { label: 'Quiz me', mode: 'quiz' }];
export function QuickPrompts({ onSelect }: { onSelect: (mode: LearningMode) => void }) {
  return <div aria-label="Quick prompts" className="flex flex-wrap gap-2">{quickPrompts.map(p => <button key={p.mode} onClick={() => onSelect(p.mode)} className="min-h-10 rounded-full border border-card-border px-3 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors focus-visible:outline-2 focus-visible:outline-primary">{p.label}</button>)}</div>;
}
export function LearningModeCard({ mode, onSelect, className = '' }: { mode: typeof learningModes[number]; onSelect: (mode: LearningMode) => void; className?: string }) {
  const Icon = icons[mode.id];
  return <button onClick={() => onSelect(mode.id)} className={`group h-full w-full text-left rounded-xl border border-card-border bg-surface-container-low p-5 shadow-xs hover:border-primary/40 hover:shadow-card-hover transition-colors focus-visible:outline-2 focus-visible:outline-primary ${className}`}><div className="flex items-center justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-primary"><Icon size={20} /></span><span className="text-xs text-on-surface-variant">{mode.label}</span></div><h3 className="mt-4 text-body-md font-semibold text-on-surface">{mode.title}</h3><p className="mt-1.5 text-body-sm text-on-surface-variant leading-relaxed">{mode.description}</p><span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">Get started <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></span></button>;
}
export function LearningModes({ onSelect }: { onSelect: (mode: LearningMode) => void }) {
  const [all, setAll] = useState(false);
  return <section aria-labelledby="learning-tools"><div className="flex flex-wrap items-center justify-between gap-2 mb-4"><div><h2 id="learning-tools" className="text-headline-md text-on-surface">Learn with AI</h2><p className="mt-1 text-body-sm text-on-surface-variant">A different way in, for every kind of learning.</p></div><Button variant="ghost" aria-expanded={all} aria-controls="learning-mode-grid" onClick={() => setAll(!all)} icon={all ? <ChevronUp size={16} /> : <ChevronDown size={16} />} className="lg:hidden">{all ? 'Show fewer' : 'View all tools'}</Button></div><div id="learning-mode-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">{learningModes.map((mode, index) => <LearningModeCard key={mode.id} mode={mode} onSelect={onSelect} className={index >= 6 && !all ? 'hidden lg:block' : 'block'} />)}</div></section>;
}
export function RecentLearningCard({ session, onContinue }: { session: LearningSession; onContinue: (s: LearningSession) => void }) {
  const Icon = icons[session.mode];
  return <Card hoverable={false} className="!p-4 flex items-center gap-3"><span className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary"><Icon size={19} /></span><div className="flex-1 min-w-0"><h3 className="truncate text-body-sm font-semibold text-on-surface">{session.title}</h3><p className="mt-1 text-xs text-on-surface-variant">{getMode(session.mode).title} · <time dateTime={session.updatedAt}>{new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></p></div><Button variant="ghost" aria-label={`Continue ${session.title}`} onClick={() => onContinue(session)} icon={<ArrowRight size={16} />}><span className="hidden sm:inline">Continue</span></Button></Card>;
}
export function ContinueLearning({ sessions, onContinue }: { sessions: LearningSession[]; onContinue: (s: LearningSession) => void }) {
  const [all, setAll] = useState(false);
  return <section aria-labelledby="continue-learning"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 id="continue-learning" className="text-headline-md text-on-surface">Continue Learning</h2><span className="text-xs text-on-surface-variant">Saved on this device</span></div>{sessions.length ? <><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{sessions.slice(0, all ? 20 : 4).map(s => <RecentLearningCard key={s.id} session={s} onContinue={onContinue} />)}</div>{sessions.length > 4 && <Button variant="ghost" onClick={() => setAll(!all)} className="mt-3">{all ? 'Show fewer sessions' : 'View all sessions'}</Button>}</> : <Card hoverable={false} className="!p-6 sm:!p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"><span className="rounded-xl p-3 bg-surface-container text-on-surface-variant"><History size={23} /></span><div><h3 className="text-body-md font-semibold text-on-surface">Your next discovery starts here</h3><p className="mt-1 text-body-sm text-on-surface-variant">Ask a question or choose a tool. Your learning sessions will appear here.</p></div></Card>}</section>;
}
export function ThinkingIndicator() { return <div role="status" className="flex items-center gap-2 text-body-sm text-on-surface-variant"><LoaderCircle size={17} className="animate-spin" /> Preparing your learning response…</div>; }

