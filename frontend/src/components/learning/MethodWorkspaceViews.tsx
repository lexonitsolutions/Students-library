import { useState } from 'react';
import { 
  Check, CircleHelp, Layers, RotateCcw, ChevronLeft, ChevronRight, Sliders
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { Flashcard, LearningMode, QuizQuestion } from '../../data/aiLearning';
import { METHOD_CONFIGS } from './methodConfigs';

/* Interactive Flashcard Deck Component with Flip & Tracking */
export function InteractiveFlashcardDeck({ cards, onPractice }: { cards: Flashcard[]; onPractice?: (prompt: string) => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [remembered, setRemembered] = useState<number[]>([]);
  const [needsReview, setNeedsReview] = useState<number[]>([]);

  if (!cards.length) return null;
  const currentCard = cards[index];

  function markRemembered() {
    if (!remembered.includes(index)) {
      setRemembered([...remembered, index]);
      setNeedsReview(needsReview.filter(i => i !== index));
    }
    if (index < cards.length - 1) {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  function markNeedsReview() {
    if (!needsReview.includes(index)) {
      setNeedsReview([...needsReview, index]);
      setRemembered(remembered.filter(i => i !== index));
    }
    if (index < cards.length - 1) {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  function resetDeck() {
    setIndex(0);
    setFlipped(false);
    setRemembered([]);
    setNeedsReview([]);
  }

  const progressPercent = Math.round(((index + 1) / cards.length) * 100);

  return (
    <div className="mt-5 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-50/50 via-surface-container-low to-surface-container-low dark:from-blue-950/20 p-4 sm:p-6 shadow-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Layers size={16} />
          </span>
          <span className="text-body-sm font-bold text-on-surface">Flashcard Deck</span>
          <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs text-on-surface-variant font-medium">
            Card {index + 1} of {cards.length}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{remembered.length} Mastered</span>
          <span className="text-on-surface-variant">·</span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold">{needsReview.length} Review</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-5">
        <div 
          className="bg-blue-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Flip Card Visual Area */}
      <div 
        onClick={() => setFlipped(!flipped)}
        className="cursor-pointer min-h-[180px] sm:min-h-[220px] rounded-xl border border-card-border bg-surface p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-blue-400/60 transition-all select-none relative group"
      >
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {flipped ? 'Answer / Solution' : 'Question / Concept'}
          </span>
          <span className="text-xs text-on-surface-variant group-hover:text-primary transition-colors">
            Click anywhere to {flipped ? 'see question' : 'reveal answer'} ↻
          </span>
        </div>

        <div className="my-auto py-4">
          <p className="text-body-md sm:text-lg font-semibold text-on-surface leading-relaxed whitespace-pre-wrap">
            {flipped ? currentCard.answer : currentCard.question}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-card-border/50">
          <span>Card ID #{index + 1}</span>
          <span className="text-primary font-medium">
            {flipped ? 'Press to flip back' : 'Click to flip'}
          </span>
        </div>
      </div>

      {/* Navigation and Mastery Controls */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            disabled={index === 0}
            onClick={() => { setIndex(index - 1); setFlipped(false); }}
            icon={<ChevronLeft size={16} />}
            aria-label="Previous card"
          >
            Prev
          </Button>
          <Button
            variant="ghost"
            disabled={index === cards.length - 1}
            onClick={() => { setIndex(index + 1); setFlipped(false); }}
            icon={<ChevronRight size={16} />}
            aria-label="Next card"
          >
            Next
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markNeedsReview}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              needsReview.includes(index)
                ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
            }`}
          >
            Still Learning
          </button>
          <button
            type="button"
            onClick={markRemembered}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              remembered.includes(index)
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
            }`}
          >
            <Check size={14} /> Got It
          </button>
        </div>
      </div>

      {/* Deck Completion State */}
      {index === cards.length - 1 && (
        <div className="mt-5 pt-4 border-t border-card-border flex flex-wrap items-center justify-between gap-3">
          <div className="text-body-sm font-semibold text-on-surface">
            Finished Deck! {remembered.length} of {cards.length} mastered.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={resetDeck} icon={<RotateCcw size={15} />}>
              Study Again
            </Button>
            {onPractice && (
              <Button
                variant="secondary"
                onClick={() => onPractice(`I reviewed the flashcard deck on this topic. I mastered ${remembered.length} of ${cards.length} cards. Please generate 5 more advanced flashcards to test deeper retention.`)}
              >
                Generate 5 More Cards
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Interactive Quiz Runner */
export function InteractiveQuizRunner({ 
  questions, 
  onPractice 
}: { 
  questions: QuizQuestion[]; 
  onPractice: (prompt: string) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const complete = questions.every((_, i) => answers[i] !== undefined);
  const score = questions.filter((q, i) => q.answer === answers[i]).length;
  const percentage = Math.round((score / questions.length) * 100);

  return (
    <div className="mt-5 space-y-4">
      {/* Quiz Overview Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <CircleHelp size={18} className="text-purple-600 dark:text-purple-400" />
          <span className="text-body-sm font-bold text-on-surface">Interactive Quiz</span>
          <span className="text-xs text-on-surface-variant font-medium">({questions.length} questions)</span>
        </div>
        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
          {Object.keys(answers).length} / {questions.length} Answered
        </span>
      </div>

      {questions.map((q, i) => {
        const userAnswer = answers[i];
        const isAnswered = userAnswer !== undefined;
        const isCorrect = isAnswered && userAnswer === q.answer;

        return (
          <fieldset 
            key={i} 
            className={`rounded-xl border p-4 sm:p-5 transition-colors ${
              isAnswered 
                ? isCorrect 
                  ? 'border-emerald-500/40 bg-emerald-500/5' 
                  : 'border-red-500/40 bg-red-500/5'
                : 'border-card-border bg-surface'
            }`}
          >
            <legend className="px-2 text-body-sm font-semibold text-on-surface">
              Question {i + 1} of {questions.length}
            </legend>
            <p className="mt-1 mb-4 text-body-md font-medium text-on-surface leading-relaxed">
              {q.question}
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((option, j) => {
                const selected = userAnswer === j;
                const isCorrectOption = j === q.answer;

                let optionStyles = 'border-card-border text-on-surface hover:bg-surface-container';
                if (isAnswered) {
                  if (isCorrectOption) {
                    optionStyles = 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 font-semibold';
                  } else if (selected && !isCorrect) {
                    optionStyles = 'border-red-500 bg-red-50 text-red-950 dark:bg-red-950 dark:text-red-100 font-semibold';
                  } else {
                    optionStyles = 'opacity-60 border-card-border text-on-surface';
                  }
                }

                return (
                  <button
                    key={j}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => setAnswers(prev => ({ ...prev, [i]: j }))}
                    className={`flex items-start gap-2.5 text-left rounded-xl border p-3 text-body-sm transition-all ${optionStyles}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface-container text-xs font-bold text-on-surface">
                      {String.fromCharCode(65 + j)}
                    </span>
                    <span className="flex-1 min-w-0 pt-0.5">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation Box */}
            {isAnswered && (
              <div 
                className={`mt-4 rounded-xl p-3.5 text-body-sm leading-relaxed ${
                  isCorrect
                    ? 'bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 border border-emerald-500/30'
                    : 'bg-red-100/60 dark:bg-red-950/60 text-red-950 dark:text-red-100 border border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {isCorrect ? <Check size={16} /> : null}
                  <span>{isCorrect ? 'Correct!' : `Correct Answer: (${String.fromCharCode(65 + q.answer)}) ${q.options[q.answer]}`}</span>
                </div>
                <p className="text-xs sm:text-body-sm text-on-surface-variant font-normal">
                  {q.explanation}
                </p>
              </div>
            )}
          </fieldset>
        );
      })}

      {/* Completed Score Banner */}
      {complete && (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-body-md font-bold text-on-surface">
              Quiz Completed! Score: {score} / {questions.length} ({percentage}%)
            </h4>
            <p className="text-xs text-on-surface-variant mt-1">
              {percentage >= 80 
                ? 'Outstanding mastery! Ready to step up to the next difficulty level.' 
                : 'Good effort! Review the explanations above and practice the concepts you missed.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => onPractice(`I scored ${score}/${questions.length} on this quiz. My answers were: ${questions.map((q, i) => `${q.question}: ${q.options[answers[i]]}`).join('; ')}. Give me another practice quiz on this topic, ${percentage >= 80 ? 'one difficulty level higher' : 'focusing on the concepts I got wrong'}.`)}
            >
              Practice Next Level
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Method-Specific Header Banner */
export function MethodWorkspaceHeader({ 
  mode, 
  onToggleForm, 
  isFormOpen 
}: { 
  mode: LearningMode; 
  onToggleForm: () => void; 
  isFormOpen: boolean; 
}) {
  const config = METHOD_CONFIGS[mode] || METHOD_CONFIGS.explain;
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border ${config.accentBorder} bg-surface-container-low p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.accentBg}`}>
          <Icon size={22} />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-on-surface">{config.title}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.accentBg}`}>
              {config.badge}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">{config.tagline}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          onClick={onToggleForm}
          icon={<Sliders size={15} />}
          className="!text-xs"
        >
          {isFormOpen ? 'Hide Tool Setup' : 'New Setup / Parameters'}
        </Button>
      </div>
    </div>
  );
}
