import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, CheckCheck, RotateCcw, Sparkles, Bot, User, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AIAskBox, ThinkingIndicator } from './LearningHome';
import { getMode, type LearningSession } from '../../data/aiLearning';
import { MethodSpecificIntake } from './MethodIntakeForms';
import { METHOD_CONFIGS } from './methodConfigs';
import { 
  MethodWorkspaceHeader, 
  InteractiveQuizRunner, 
  InteractiveFlashcardDeck 
} from './MethodWorkspaceViews';

function LearningText({ text }: { text: string }) {
  return (
    <div className="space-y-3.5 text-sm sm:text-base leading-relaxed text-on-surface [overflow-wrap:anywhere]">
      {text.split(/\n\s*\n/).map((block, i) => {
        if (block.startsWith('#')) {
          return (
            <h3 key={i} className="font-bold text-base sm:text-lg text-on-surface mt-3 text-primary">
              {block.replace(/^#+\s*/, '')}
            </h3>
          );
        }
        if (block.startsWith('- ') || block.startsWith('* ')) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5 my-2">
              {block.split('\n').map((line, li) => (
                <li key={li} className="pl-1 text-on-surface">
                  {line.replace(/^[-*]\s*/, '')}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {block}
          </p>
        );
      })}
    </div>
  );
}

function CopyResponseButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1 rounded-md hover:bg-surface-container cursor-pointer"
      title="Copy answer to clipboard"
    >
      {copied ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

export function AILearningWorkspace({ 
  session, 
  busy, 
  error, 
  onSend, 
  onBack, 
  onStop, 
  onRetry 
}: { 
  session: LearningSession; 
  busy: boolean; 
  error: string; 
  onSend: (text: string, file?: File) => Promise<boolean>; 
  onBack: () => void; 
  onStop: () => void; 
  onRetry: () => void;
}) {
  const mode = getMode(session.mode);
  const config = METHOD_CONFIGS[session.mode] || METHOD_CONFIGS.explain;
  const bottom = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [preferFreeform, setPreferFreeform] = useState(false);

  const lastReplyId = session.messages.filter(m => m.role === 'assistant').at(-1)?.id;

  useEffect(() => { 
    setDraft(''); 
  }, [lastReplyId]);

  useEffect(() => { 
    if (session.messages.length) {
      bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); 
    }
  }, [session.messages.length, busy]);

  const hasMessages = session.messages.length > 0;

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Top Navigation Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3 p-2.5 px-4 rounded-xl border border-card-border/80 bg-surface shadow-2xs"
      >
        <button 
          disabled={busy} 
          onClick={onBack} 
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer group disabled:opacity-50"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Learning desk</span>
        </button>

        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.accentBg}`}>
            {config.badge}
          </span>
          <span className="text-xs text-on-surface-variant font-medium">Study LAB</span>
        </div>
      </motion.div>

      {/* When NO messages exist yet: Display the Dedicated Interface for this method */}
      {!hasMessages ? (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface break-words">
              {mode.title}
            </h1>
            <button
              type="button"
              onClick={() => setPreferFreeform(!preferFreeform)}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              {preferFreeform ? 'Switch to guided tool' : 'Use freeform ask box'}
            </button>
          </div>

          {!preferFreeform ? (
            <MethodSpecificIntake 
              mode={session.mode} 
              busy={busy} 
              onSubmit={onSend} 
            />
          ) : (
            <Card hoverable={false} className="!p-5 sm:!p-6 space-y-4 rounded-2xl">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Sparkles size={17} />
                <span>{config.title} Freeform</span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant">{mode.prompt}</p>
              <AIAskBox
                busy={busy}
                onSend={onSend}
                onStop={onStop}
                initialValue={draft}
                placeholder={config.placeholder}
              />
            </Card>
          )}
        </motion.div>
      ) : (
        /* When messages exist: Render the Active Workspace with Method Customizations */
        <>
          <MethodWorkspaceHeader 
            mode={session.mode} 
            isFormOpen={showConfigForm} 
            onToggleForm={() => setShowConfigForm(!showConfigForm)} 
          />

          {/* Collapsible Tool Setup Panel */}
          <AnimatePresence>
            {showConfigForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-card-border p-4 bg-surface-container-low shadow-xs overflow-hidden"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Generate New {config.title} Request
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setShowConfigForm(false)}
                    className="text-xs text-on-surface-variant hover:text-on-surface font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <MethodSpecificIntake 
                  mode={session.mode} 
                  busy={busy} 
                  onSubmit={async (text, file) => {
                    const res = await onSend(text, file);
                    if (res) setShowConfigForm(false);
                    return res;
                  }} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversation history */}
          <div role="log" aria-label="Learning conversation" aria-live="polite" className="space-y-4">
            {session.messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div 
                  className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                    m.role === 'user' 
                      ? 'sm:ml-12 border-primary/20 bg-surface-container/90 shadow-2xs' 
                      : 'border-card-border bg-surface shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${
                        m.role === 'user' 
                          ? 'bg-primary/10 text-primary' 
                          : `${config.accentBg}`
                      }`}>
                        {m.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                        <span>{m.role === 'user' ? 'You' : `${config.title} Tutor`}</span>
                      </span>
                    </div>
                    {m.role === 'assistant' && (
                      <CopyResponseButton text={m.content} />
                    )}
                  </div>

                  <LearningText text={m.content} />

                  {m.attachmentName && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container text-xs text-on-surface-variant font-medium">
                      <span>Attached notes:</span>
                      <span className="font-semibold text-on-surface">{m.attachmentName}</span>
                    </div>
                  )}

                  {/* Method interactive components */}
                  {m.reply?.quiz?.length ? (
                    <div className="mt-4 pt-3 border-t border-card-border/60">
                      <InteractiveQuizRunner 
                        questions={m.reply.quiz} 
                        onPractice={setDraft} 
                      />
                    </div>
                  ) : null}

                  {m.reply?.flashcards?.length ? (
                    <div className="mt-4 pt-3 border-t border-card-border/60">
                      <InteractiveFlashcardDeck 
                        cards={m.reply.flashcards} 
                        onPractice={setDraft} 
                      />
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>

          {busy && <ThinkingIndicator />}

          {/* Gentle Error Card */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              role="alert" 
              className="rounded-2xl border border-error/30 bg-error/5 p-4 sm:p-5 text-on-surface"
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-error">Could not generate response</p>
                  <p className="mt-0.5 text-xs text-on-surface-variant leading-relaxed">{error}</p>
                  <div className="mt-3">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={onRetry} 
                      icon={<RotateCcw size={14} />} 
                    >
                      Retry response
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Mode-Specific Follow-Up Action Chips */}
          {session.messages.at(-1)?.role === 'assistant' && !busy && (
            <motion.div 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 pt-1" 
              aria-label="Suggested follow-up questions"
            >
              <span className="text-xs font-semibold text-on-surface-variant mr-1">Suggested next steps:</span>
              {config.followUps.map(action => (
                <button
                  key={action}
                  type="button"
                  onClick={() => void onSend(action)}
                  className="h-8 rounded-full border border-card-border bg-surface px-3 text-xs font-medium text-on-surface hover:border-primary/50 hover:bg-surface-container transition-all cursor-pointer shadow-2xs"
                >
                  {action}
                </button>
              ))}
              <button
                type="button"
                className="h-8 px-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
                onClick={() => document.getElementById('ai-question')?.focus()}
              >
                Custom follow-up →
              </button>
            </motion.div>
          )}

          {/* Follow-Up Ask Box */}
          <div ref={bottom} className="pt-2">
            <AIAskBox
              key={lastReplyId ?? 'active-session'}
              busy={busy}
              onSend={onSend}
              onStop={onStop}
              initialValue={draft}
              placeholder={config.placeholder}
            />
          </div>
        </>
      )}

      <p className="text-[11px] text-on-surface-variant/70 text-center">
        Study LAB AI can make mistakes. Always verify critical definitions, dates, and formulas with your course syllabus.
      </p>
    </div>
  );
}
