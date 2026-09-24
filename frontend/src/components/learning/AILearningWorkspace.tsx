import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AIAskBox, ThinkingIndicator } from './LearningHome';
import { getMode, type Flashcard, type LearningSession, type QuizQuestion } from '../../data/aiLearning';
function LearningText({ text }: { text: string }) {
  return <div className="space-y-3 text-body-sm sm:text-body-md leading-relaxed text-on-surface [overflow-wrap:anywhere]">{text.split(/\n\s*\n/).map((block, i) => block.startsWith('#') ? <h3 key={i} className="font-semibold text-body-md">{block.replace(/^#+\s*/, '')}</h3> : <p key={i} className="whitespace-pre-wrap">{block}</p>)}</div>;
}
function Quiz({ questions, onPractice }: { questions: QuizQuestion[]; onPractice: (prompt: string) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const complete = questions.every((_, i) => answers[i] !== undefined);
  const score = questions.filter((q, i) => q.answer === answers[i]).length;
  return <div className="mt-5 space-y-4">{questions.map((q, i) => <fieldset key={i} className="rounded-xl border border-card-border p-4"><legend className="px-1 text-body-sm font-semibold text-on-surface">{i + 1}. {q.question}</legend><div className="grid gap-2">{q.options.map((option, j) => <button key={j} disabled={answers[i] !== undefined} aria-pressed={answers[i] === j} onClick={() => setAnswers(prev => ({ ...prev, [i]: j }))} className={`flex items-center gap-2 text-left rounded-lg border px-3 py-3 text-body-sm transition-colors ${answers[i] === j ? 'border-primary bg-primary-container text-on-primary-container' : 'border-card-border text-on-surface hover:bg-surface-container'}`}><span className="shrink-0 font-semibold">{String.fromCharCode(65 + j)}.</span>{' '}{option}</button>)}</div>{answers[i] !== undefined && <p role="status" className="mt-3 text-body-sm text-on-surface"><strong>{answers[i] === q.answer ? 'Correct!' : `Correct answer: ${q.options[q.answer]}.`}</strong> {q.explanation}</p>}</fieldset>)}{complete && <div className="flex flex-wrap items-center gap-3"><p className="text-body-sm font-semibold text-on-surface">You got {score} of {questions.length} correct.</p><Button variant="secondary" onClick={() => onPractice(`I scored ${score}/${questions.length}. My answers were: ${questions.map((q,i) => `${q.question}: ${q.options[answers[i]]}`).join('; ')}. Give me another short practice quiz, ${score / questions.length >= 0.8 ? 'slightly harder' : 'with more help on the concepts I missed'}.`)}>Practice next level</Button></div>}</div>;
}
function Flashcards({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState<number[]>([]);
  return <div className="mt-5 rounded-xl border border-card-border p-4 sm:p-5"><div className="mb-4 flex justify-between gap-2 text-xs text-on-surface-variant"><span>Card {index + 1} of {cards.length}</span><span>{known.length} remembered</span></div><p className="text-body-md font-semibold text-on-surface">{cards[index].question}</p>{revealed ? <p className="mt-4 whitespace-pre-wrap text-body-sm text-on-surface">{cards[index].answer}</p> : <Button variant="secondary" className="mt-4" onClick={() => setRevealed(true)}>Reveal answer</Button>}<div className="mt-5 flex flex-wrap items-center justify-between gap-2"><Button variant="ghost" aria-label="Previous flashcard" disabled={index === 0} onClick={() => { setIndex(index - 1); setRevealed(false); }} icon={<ChevronLeft size={16} />} /><Button variant="ghost" disabled={!revealed || known.includes(index)} onClick={() => setKnown([...known, index])} icon={<Check size={16} />}>{known.includes(index) ? 'Remembered' : 'Got it'}</Button><Button variant="ghost" aria-label="Next flashcard" disabled={index === cards.length - 1} onClick={() => { setIndex(index + 1); setRevealed(false); }} icon={<ChevronRight size={16} />} /></div></div>;
}
const actions = ['Explain simpler', 'Give an example', 'Explain step-by-step', 'Summarize', 'Quiz me', 'Give practice questions'];
export function AILearningWorkspace({ session, busy, error, onSend, onBack, onStop, onRetry }: { session: LearningSession; busy: boolean; error: string; onSend: (text: string, file?: File) => Promise<boolean>; onBack: () => void; onStop: () => void; onRetry: () => void }) {
  const mode = getMode(session.mode);
  const bottom = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const lastReplyId = session.messages.filter(m => m.role === 'assistant').at(-1)?.id;
  useEffect(() => { setDraft(''); }, [lastReplyId]);
  useEffect(() => { if (session.messages.length) bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [session.messages.length, busy]);
  return <div className="flex flex-col gap-5 min-w-0"><div className="flex flex-wrap items-center gap-3"><Button variant="ghost" disabled={busy} onClick={onBack} icon={<ArrowLeft size={16} />}>Learning desk</Button><span className="rounded-full bg-primary-container text-on-primary-container px-3 py-1.5 text-xs font-semibold">{mode.title}</span></div><header><h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface break-words">{session.messages.length ? session.title : mode.title}</h1><p className="mt-2 text-body-sm text-on-surface-variant">Understand it. Try it. Make it stick.</p></header>
    {!session.messages.length && <Card hoverable={false}><Sparkles className="text-primary mb-3" size={24} /><h2 className="text-headline-md text-on-surface">Let’s learn together</h2><p className="mt-2 text-body-sm text-on-surface-variant">{mode.prompt}</p></Card>}
    <div role="log" aria-label="Learning conversation" aria-live="polite" className="space-y-4">{session.messages.map(m => <Card key={m.id} hoverable={false} className={`!p-4 sm:!p-6 ${m.role === 'user' ? 'sm:ml-12 !bg-surface-container' : ''}`}><p className="mb-3 text-xs font-semibold text-primary">{m.role === 'user' ? 'You' : 'Learning assistant'}</p><LearningText text={m.content} />{m.attachmentName && <p className="mt-3 text-xs text-on-surface-variant break-all">Attached: {m.attachmentName}</p>}{m.reply?.quiz?.length ? <Quiz questions={m.reply.quiz} onPractice={setDraft} /> : null}{m.reply?.flashcards?.length ? <Flashcards cards={m.reply.flashcards} /> : null}</Card>)}</div>
    {busy && <ThinkingIndicator />}
    {error && <div role="alert" className="rounded-xl border border-error/30 bg-surface-container-low p-4"><p className="text-body-sm text-error">{error}</p><Button variant="ghost" onClick={onRetry} icon={<RotateCcw size={15} />} className="mt-2">Retry response</Button></div>}
    {session.messages.at(-1)?.role === 'assistant' && !busy && <div className="flex flex-wrap gap-2" aria-label="Continue studying">{actions.map(action => <button key={action} onClick={() => void onSend(action)} className="min-h-10 rounded-full border border-card-border px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container-high">{action}</button>)}<button className="min-h-10 px-3 text-xs font-semibold text-primary" onClick={() => document.getElementById('ai-question')?.focus()}>Ask follow-up</button></div>}
    <div ref={bottom}><AIAskBox key={lastReplyId ?? 'new'} busy={busy} onSend={onSend} onStop={onStop} initialValue={draft} placeholder={session.messages.length ? 'Ask a follow-up or try an answer...' : mode.prompt} /></div><p className="text-xs text-on-surface-variant">AI can make mistakes. Check important facts and references with your course materials.</p>
  </div>;
}

