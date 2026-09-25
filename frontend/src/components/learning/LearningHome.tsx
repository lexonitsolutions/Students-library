import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  BookOpen, 
  Brain, 
  CalendarDays, 
  ChevronDown, 
  ChevronUp, 
  CircleHelp, 
  FileText, 
  History, 
  Layers, 
  Lightbulb, 
  Paperclip, 
  Search, 
  Send, 
  Sparkles, 
  Target, 
  X, 
  Sun, 
  Moon, 
  Sunset,
  Bot
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { getMode, greeting, learningModes, type LearningMode, type LearningSession } from '../../data/aiLearning';

const icons = { 
  explain: BookOpen, 
  research: Search, 
  exam: Target, 
  planner: CalendarDays, 
  summarize: FileText, 
  quiz: CircleHelp, 
  flashcards: Layers, 
  doubt: Lightbulb, 
  practice: Brain, 
  brainstorm: Sparkles 
};

const MODE_ACCENTS: Record<string, { bg: string; text: string; border: string }> = {
  explain: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'hover:border-blue-500/40' },
  research: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'hover:border-indigo-500/40' },
  exam: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'hover:border-amber-500/40' },
  planner: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'hover:border-emerald-500/40' },
  summarize: { bg: 'bg-teal-500/10 dark:bg-teal-500/20', text: 'text-teal-600 dark:text-teal-400', border: 'hover:border-teal-500/40' },
  quiz: { bg: 'bg-violet-500/10 dark:bg-violet-500/20', text: 'text-violet-600 dark:text-violet-400', border: 'hover:border-violet-500/40' },
  flashcards: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', border: 'hover:border-purple-500/40' },
  doubt: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', border: 'hover:border-orange-500/40' },
  practice: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', border: 'hover:border-rose-500/40' },
  brainstorm: { bg: 'bg-pink-500/10 dark:bg-pink-500/20', text: 'text-pink-600 dark:text-pink-400', border: 'hover:border-pink-500/40' },
};

// ── Greeting Header with Day/Night context and subtle animation ─────────────
export function GreetingHeader({ name }: { name: string }) {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const timer = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  const greetingText = greeting(hour);
  const firstName = name.trim().split(/\s+/)[0] || 'Student';

  const TimeIcon = hour < 12 ? Sun : hour < 18 ? Sunset : Moon;

  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl border border-card-border bg-gradient-to-br from-surface to-surface-container-low p-6 sm:p-7 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2.5">
            <Sparkles size={13} className="animate-pulse" />
            <span>Study LAB · Autonomous Tutor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface flex items-center gap-2 flex-wrap">
            <span>{greetingText}, {firstName}</span>
            <span className="inline-block hover:rotate-12 transition-transform cursor-default">👋</span>
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-on-surface-variant max-w-xl">
            Choose a learning tool or ask any topic to generate tailored explanations, quizzes, and flashcards.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container/60 border border-card-border/80 text-on-surface-variant shrink-0">
          <TimeIcon size={20} className="text-amber-500 shrink-0" />
          <div className="text-left text-xs">
            <p className="font-semibold text-on-surface">Study Session</p>
            <p className="text-[11px] text-on-surface-variant/80">Active & Ready</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

// ── Supercharged Modern AI Ask Box ──────────────────────────────────────────
export function AIAskBox({ 
  onSend, 
  busy, 
  initialValue = '', 
  placeholder = 'Ask anything you want to learn, or attach your study notes...', 
  onStop 
}: { 
  onSend: (text: string, file?: File) => Promise<boolean>; 
  busy: boolean; 
  initialValue?: string; 
  placeholder?: string; 
  onStop?: () => void;
}) {
  const [text, setText] = useState(initialValue);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const submitting = useRef(false);

  useEffect(() => { 
    setText(initialValue); 
    if (initialValue) textarea.current?.focus(); 
  }, [initialValue]);

  async function submit() {
    if (busy || submitting.current || !text.trim()) return;
    submitting.current = true;
    try { 
      if (await onSend(text.trim(), file)) { 
        setText(''); 
        setFile(undefined); 
      } 
    } finally { 
      submitting.current = false; 
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card 
        hoverable={false} 
        className="!p-4 sm:!p-5 border border-card-border/90 bg-surface shadow-xs transition-all duration-200 focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/10 rounded-2xl"
      >
        <form onSubmit={e => { e.preventDefault(); void submit(); }}>
          <label className="sr-only" htmlFor="ai-question">Your learning question</label>
          <textarea 
            ref={textarea} 
            id="ai-question" 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder={placeholder} 
            maxLength={12000} 
            rows={3} 
            disabled={busy} 
            className="w-full min-w-0 resize-y min-h-[96px] max-h-72 bg-transparent text-sm sm:text-base text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none disabled:opacity-60 leading-relaxed font-normal" 
            onKeyDown={e => { 
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) { 
                e.preventDefault(); 
                void submit(); 
              } 
            }} 
          />

          {/* Attached file preview */}
          <AnimatePresence>
            {file && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-surface-container/80 border border-card-border px-3.5 py-2 text-xs font-medium text-on-surface"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <FileText size={15} />
                  </div>
                  <span className="truncate">{file.name}</span>
                  <span className="text-[11px] text-on-surface-variant shrink-0 font-mono">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button 
                  type="button" 
                  disabled={busy} 
                  aria-label="Remove attachment" 
                  onClick={() => setFile(undefined)} 
                  className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <X size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert" 
              className="mb-3 text-xs text-error font-medium"
            >
              {error}
            </motion.p>
          )}

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border/70 pt-3">
            <div className="flex items-center gap-2">
              <input 
                ref={input} 
                type="file" 
                accept=".pdf,.txt,.md" 
                className="hidden" 
                aria-label="Attach study notes" 
                onChange={e => { 
                  const next = e.target.files?.[0]; 
                  e.target.value = ''; 
                  setError(''); 
                  if (!next) return; 
                  if (!/\.(pdf|txt|md)$/i.test(next.name)) { 
                    setError('Choose a PDF, TXT, or Markdown file.'); 
                    return; 
                  } 
                  if (next.size > 5 * 1024 * 1024) { 
                    setError('Choose a file smaller than 5 MB.'); 
                    return; 
                  } 
                  setFile(next); 
                }} 
              />
              <button 
                type="button" 
                disabled={busy} 
                onClick={() => input.current?.click()} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
                aria-label="Attach notes"
              >
                <Paperclip size={15} />
                <span>Attach notes</span>
                <span className="text-[10px] text-on-surface-variant/60 hidden sm:inline">(PDF, TXT)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-on-surface-variant/70 hidden sm:inline font-mono">
                Ctrl + ↵ to send
              </span>
              {busy ? (
                <Button 
                  key="stop" 
                  type="button" 
                  variant="secondary" 
                  size="sm"
                  onClick={e => { e.preventDefault(); onStop?.(); }} 
                  icon={<X size={15} />}
                >
                  Stop
                </Button>
              ) : (
                <Button 
                  key="send" 
                  type="submit" 
                  disabled={!text.trim()} 
                  size="sm"
                  icon={<Send size={14} />}
                  className="rounded-xl shadow-xs"
                >
                  Ask AI
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}

// ── Quick Prompt Chips with Micro-Interactions ──────────────────────────────
const quickPrompts: { label: string; mode: LearningMode; icon: any }[] = [
  { label: 'Explain a topic', mode: 'explain', icon: BookOpen },
  { label: 'Prepare for an exam', mode: 'exam', icon: Target },
  { label: 'Research concept', mode: 'research', icon: Search },
  { label: 'Summarize my notes', mode: 'summarize', icon: FileText },
  { label: 'Create study plan', mode: 'planner', icon: CalendarDays },
  { label: 'Generate quiz', mode: 'quiz', icon: CircleHelp },
];

export function QuickPrompts({ onSelect }: { onSelect: (mode: LearningMode) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      aria-label="Quick prompts" 
      className="flex flex-wrap items-center gap-2 pt-1"
    >
      <span className="text-xs font-semibold text-on-surface-variant/80 mr-1 flex items-center gap-1">
        <Sparkles size={12} className="text-primary" />
        Quick starts:
      </span>
      {quickPrompts.map((p) => {
        const Icon = p.icon;
        return (
          <motion.button 
            key={p.mode} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(p.mode)} 
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-card-border bg-surface hover:bg-surface-container text-xs font-medium text-on-surface hover:text-primary transition-all duration-150 cursor-pointer shadow-2xs"
          >
            <Icon size={13} className="text-primary/70" />
            <span>{p.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

// ── Learning Mode Card with Modern Hover Elevate & Icons ────────────────────
export function LearningModeCard({ 
  mode, 
  onSelect, 
  className = '' 
}: { 
  mode: typeof learningModes[number]; 
  onSelect: (mode: LearningMode) => void; 
  className?: string;
}) {
  const Icon = icons[mode.id];
  const accent = MODE_ACCENTS[mode.id] || MODE_ACCENTS.explain;

  return (
    <motion.button 
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(mode.id)} 
      className={`group relative flex flex-col justify-between text-left rounded-2xl border border-card-border/90 bg-surface p-5 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer overflow-hidden ${accent.border} ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.bg} ${accent.text} transition-transform duration-200 group-hover:scale-105`}>
            <Icon size={22} />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70 px-2 py-0.5 rounded-md bg-surface-container">
            {mode.label}
          </span>
        </div>
        <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
          {mode.title}
        </h3>
        <p className="mt-1.5 text-xs sm:text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
          {mode.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-card-border/60 flex items-center justify-between">
        <span className="text-xs font-semibold text-primary inline-flex items-center gap-1">
          Start session
          <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </motion.button>
  );
}

// ── Learning Modes Grid with Filter Tabs & Expand ───────────────────────────
export function LearningModes({ onSelect }: { onSelect: (mode: LearningMode) => void }) {
  const [all, setAll] = useState(false);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      aria-labelledby="learning-tools" 
      className="mt-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 id="learning-tools" className="text-lg sm:text-xl font-bold text-on-surface tracking-tight">
            Specialized Learning Tools
          </h2>
          <p className="text-xs text-on-surface-variant">
            Structured frameworks designed to accelerate comprehension and recall.
          </p>
        </div>
        <button 
          onClick={() => setAll(!all)} 
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline lg:hidden cursor-pointer"
        >
          <span>{all ? 'Show fewer' : 'View all 10 tools'}</span>
          {all ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div id="learning-mode-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {learningModes.map((mode, index) => (
          <LearningModeCard 
            key={mode.id} 
            mode={mode} 
            onSelect={onSelect} 
            className={index >= 6 && !all ? 'hidden lg:flex' : 'flex'} 
          />
        ))}
      </div>
    </motion.section>
  );
}

// ── Recent Learning Session Card ────────────────────────────────────────────
export function RecentLearningCard({ 
  session, 
  onContinue 
}: { 
  session: LearningSession; 
  onContinue: (s: LearningSession) => void;
}) {
  const Icon = icons[session.mode] || BookOpen;
  const accent = MODE_ACCENTS[session.mode] || MODE_ACCENTS.explain;

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="flex items-center gap-3.5 p-4 rounded-xl border border-card-border bg-surface hover:bg-surface-container-low transition-all duration-150 shadow-2xs group"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent.bg} ${accent.text}`}>
        <Icon size={19} />
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="truncate text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
          {session.title || 'Untitled Session'}
        </h3>
        <p className="mt-0.5 text-xs text-on-surface-variant">
          {getMode(session.mode).title} · <time dateTime={session.updatedAt}>{new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="sm"
        aria-label={`Continue ${session.title}`} 
        onClick={() => onContinue(session)} 
        icon={<ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
      >
        <span className="hidden sm:inline">Resume</span>
      </Button>
    </motion.div>
  );
}

// ── Continue Learning Section ───────────────────────────────────────────────
export function ContinueLearning({ 
  sessions, 
  onContinue 
}: { 
  sessions: LearningSession[]; 
  onContinue: (s: LearningSession) => void;
}) {
  const [all, setAll] = useState(false);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
      aria-labelledby="continue-learning"
      className="mt-6"
    >
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <h2 id="continue-learning" className="text-lg sm:text-xl font-bold text-on-surface tracking-tight">
          Recent Learning Sessions
        </h2>
        <span className="text-xs text-on-surface-variant/80">Stored locally in your browser</span>
      </div>

      {sessions.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sessions.slice(0, all ? 20 : 4).map(s => (
              <RecentLearningCard key={s.id} session={s} onContinue={onContinue} />
            ))}
          </div>
          {sessions.length > 4 && (
            <div className="mt-3 text-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setAll(!all)}
              >
                {all ? 'Show fewer sessions' : `View all ${sessions.length} sessions`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-card-border bg-surface-container-low/50 p-6 sm:p-8 flex items-center gap-4 text-left">
          <span className="rounded-xl p-3 bg-surface-container text-on-surface-variant shrink-0">
            <History size={22} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Your learning journey begins here</h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Ask a question above or choose any specialized tool. Your interactive sessions will be saved here for quick review.
            </p>
          </div>
        </div>
      )}
    </motion.section>
  );
}

// ── Senior Dev Thinking Animation ───────────────────────────────────────────
export function ThinkingIndicator() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      role="status" 
      className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm text-on-surface w-fit"
    >
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
        <Bot size={18} className="text-primary animate-pulse ml-1" />
      </div>
      <span className="font-medium text-xs sm:text-sm">
        AI Tutor is analyzing and structuring your lesson materials...
      </span>
    </motion.div>
  );
}
