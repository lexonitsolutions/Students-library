import { useState, useRef, type ChangeEvent } from 'react';
import { 
  BookOpen, Brain, CalendarDays, Check, CircleHelp, 
  FileText, Layers, Lightbulb, Paperclip, Search, Sparkles, Target, X,
  Clock, Zap
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { LearningMode } from '../../data/aiLearning';

interface MethodFormProps {
  busy: boolean;
  onSubmit: (prompt: string, file?: File) => Promise<boolean>;
}

/* 1. EXPLAIN A TOPIC */
export function ExplainMethodForm({ busy, onSubmit }: MethodFormProps) {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<'eli5' | 'standard' | 'deep'>('standard');
  const [style, setStyle] = useState<string[]>(['analogies', 'steps']);
  const [specificFocus, setSpecificFocus] = useState('');

  const quickTopics = [
    'Quantum Entanglement',
    'Recursion & Call Stack',
    'Photosynthesis Light Reactions',
    'Inflation & Interest Rates',
    'CRISPR-Cas9 Gene Editing',
    'Neural Networks Backpropagation'
  ];

  function toggleStyle(item: string) {
    setStyle(prev => prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || busy) return;

    const depthLabels = {
      eli5: 'Explain simply (ELI5 - like I am 10 years old, high intuition)',
      standard: 'Standard undergraduate / high-school depth with clear intuition',
      deep: 'Deep technical breakdown with rigorous mechanics and formulas'
    };

    const styleInstructions = style.length 
      ? `Preferred format & learning aids: ${style.map(s => {
          if (s === 'analogies') return 'Use real-world vivid analogies';
          if (s === 'steps') return 'Step-by-step intuitive breakdown';
          if (s === 'pitfalls') return 'Highlight common misconceptions or pitfalls';
          if (s === 'visual') return 'Include a mental model / ASCII diagram';
          return s;
        }).join(', ')}.` 
      : '';

    const focusText = specificFocus.trim() ? `Specific question/aspect to emphasize: ${specificFocus.trim()}.` : '';

    const fullPrompt = `Explain the topic: "${topic.trim()}".
Level of depth: ${depthLabels[depth]}.
${focusText}
${styleInstructions}
Please break it down clearly with concrete examples, intuitive reasoning, and key takeaways.`;

    await onSubmit(fullPrompt);
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-container/30 via-surface-container-low to-surface-container-low p-5 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container text-primary">
          <BookOpen size={20} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Understand Deeply</span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Explain a Topic</h2>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Turn confusing, complex concepts into crystal-clear intuition with tailored explanations and analogies.
      </p>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <label htmlFor="explain-topic" className="block text-body-sm font-semibold text-on-surface mb-2">
            What concept or topic would you like explained?
          </label>
          <input
            id="explain-topic"
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. How Transformers work in AI, Photosynthesis, or Bayes' Theorem..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
            required
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="block text-xs font-medium text-on-surface-variant mb-2">Popular topics:</span>
          <div className="flex flex-wrap gap-2">
            {quickTopics.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className="rounded-full border border-card-border bg-surface px-3 py-1 text-xs font-medium text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Depth Level */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-2">
            Target Explanation Depth
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'eli5', title: 'Simple / ELI5', desc: 'Jargon-free & super intuitive' },
              { id: 'standard', title: 'Standard / College', desc: 'Balanced theory & practical context' },
              { id: 'deep', title: 'Technical Deep-Dive', desc: 'Rigorous mechanics & mathematics' },
            ].map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDepth(d.id as typeof depth)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  depth === d.id
                    ? 'border-primary bg-primary-container/40 text-on-surface font-semibold shadow-xs'
                    : 'border-card-border bg-surface text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <div className="text-body-sm font-medium">{d.title}</div>
                <div className="text-xs text-on-surface-variant mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Learning Aids */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-2">
            Include in explanation:
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'analogies', label: 'Real-world Analogy' },
              { id: 'steps', label: 'Step-by-Step Breakdown' },
              { id: 'pitfalls', label: 'Common Misconceptions' },
              { id: 'visual', label: 'Mental Model / Diagrams' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleStyle(item.id)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  style.includes(item.id)
                    ? 'border-primary bg-primary text-white font-semibold'
                    : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                }`}
              >
                {style.includes(item.id) && <Check size={14} />}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Specific Focus Input */}
        <div>
          <label htmlFor="explain-focus" className="block text-body-sm font-semibold text-on-surface mb-2">
            Specific question or area you are confused about (optional)
          </label>
          <input
            id="explain-focus"
            type="text"
            value={specificFocus}
            onChange={e => setSpecificFocus(e.target.value)}
            placeholder="e.g. Focus on why light bends when changing mediums..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={!topic.trim() || busy}
            icon={<BookOpen size={16} />}
            className="w-full sm:w-auto"
          >
            {busy ? 'Generating explanation...' : 'Explain Concept'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* 2. EXAM PREPARATION */
export function ExamMethodForm({ busy, onSubmit }: MethodFormProps) {
  const [subject, setSubject] = useState('');
  const [timeline, setTimeline] = useState('3days');
  const [syllabus, setSyllabus] = useState('');
  const [focus, setFocus] = useState<string[]>(['highyield', 'questions']);
  const [file, setFile] = useState<File>();
  const [fileError, setFileError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  function toggleFocus(id: string) {
    setFocus(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    setFileError('');
    if (!f) return;
    if (!/\.(pdf|txt|md)$/i.test(f.name)) {
      setFileError('Please attach a PDF, TXT, or Markdown syllabus.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setFileError('File size must be under 5 MB.');
      return;
    }
    setFile(f);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || busy) return;

    const timelineMap: Record<string, string> = {
      tomorrow: 'Tomorrow (Cram session / Most critical high-yield focus)',
      '3days': 'In 3-5 days (Targeted revision & practice)',
      '1week': 'In 1-2 weeks (Comprehensive review & mock testing)',
      finals: 'Finals month (Strategic mastery & long-term retention)',
    };

    const focusMap: Record<string, string> = {
      highyield: 'Top 20% high-yield concepts that account for 80% of exam marks',
      questions: 'Exam-style practice questions with expected answers',
      formulas: 'Key formulas, definitions, and cheat-sheet summary',
      mistakes: 'Common traps, negative-marking pitfalls, and tricky edge-cases',
    };

    const fullPrompt = `Help me prepare for my upcoming exam in: "${subject.trim()}".
Exam timeline: ${timelineMap[timeline] || timeline}.
${syllabus.trim() ? `Syllabus / Key chapters to prioritize:\n${syllabus.trim()}` : ''}
Focus areas: ${focus.map(f => focusMap[f] || f).join(', ')}.
Please provide a structured exam readiness plan, high-yield summary points, and 3-5 exam-style mock questions with scoring advice.`;

    await onSubmit(fullPrompt, file);
  }

  return (
    <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/5 via-surface-container-low to-surface-container-low p-5 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
          <Target size={20} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Prepare for Success</span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Exam Preparation</h2>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Focus your revision on what actually gets marks: high-yield points, exam-style questions, and trap avoidance.
      </p>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="exam-subject" className="block text-body-sm font-semibold text-on-surface mb-2">
              Subject or Course Name
            </label>
            <input
              id="exam-subject"
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Calculus II, Microeconomics, Organic Chemistry..."
              disabled={busy}
              className="w-full rounded-xl border border-card-border bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-red-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-2">
              When is your exam?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'tomorrow', label: 'Tomorrow', icon: Zap },
                { id: '3days', label: '3-5 Days', icon: Clock },
                { id: '1week', label: '1-2 Weeks', icon: CalendarDays },
                { id: 'finals', label: 'Finals Month', icon: Target },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeline(t.id)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    timeline === t.id
                      ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200 font-bold'
                      : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="exam-syllabus" className="block text-body-sm font-semibold text-on-surface mb-2">
            Syllabus or Specific Chapters to Cover (Optional)
          </label>
          <textarea
            id="exam-syllabus"
            value={syllabus}
            onChange={e => setSyllabus(e.target.value)}
            rows={3}
            placeholder="e.g. Chapters 4 to 8: Integration by parts, Taylor series, Differential equations..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-red-500 focus:outline-none"
          />
        </div>

        {/* Focus checkboxes */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-2">
            What do you want included in your revision packet?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'highyield', label: 'High-Yield Core Revision Points' },
              { id: 'questions', label: 'Exam-Style Mock Questions & Solutions' },
              { id: 'formulas', label: 'Essential Formulas & Definition Sheet' },
              { id: 'mistakes', label: 'Frequent Exam Mistakes & Traps to Avoid' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleFocus(item.id)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium text-left transition-colors flex items-center gap-2 ${
                  focus.includes(item.id)
                    ? 'border-red-500 bg-red-600 text-white font-semibold'
                    : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                }`}
              >
                {focus.includes(item.id) ? <Check size={14} /> : <div className="w-3.5 h-3.5 rounded border border-card-border" />}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* File Attachment for syllabus */}
        <div className="pt-1">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => fileInput.current?.click()}
              icon={<Paperclip size={16} />}
            >
              {file ? 'Replace syllabus file' : 'Attach syllabus / past paper (PDF/TXT)'}
            </Button>
            {file && (
              <div className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-xs text-on-surface">
                <FileText size={14} />
                <span className="truncate max-w-[200px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(undefined)}
                  className="hover:text-red-500 ml-1"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          {fileError && <p className="mt-1 text-xs text-error">{fileError}</p>}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={!subject.trim() || busy}
            icon={<Target size={16} />}
            className="w-full sm:w-auto !bg-red-600 hover:!bg-red-700 !text-white"
          >
            {busy ? 'Building exam revision...' : 'Generate Exam Battle Plan'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* 3. NOTES SUMMARIZER */
export function SummarizeMethodForm({ busy, onSubmit }: MethodFormProps) {
  const [notes, setNotes] = useState('');
  const [style, setStyle] = useState('takeaways');
  const [file, setFile] = useState<File>();
  const [fileError, setFileError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    setFileError('');
    if (!f) return;
    if (!/\.(pdf|txt|md)$/i.test(f.name)) {
      setFileError('Please attach a PDF, TXT, or Markdown notes file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setFileError('File size must be under 5 MB.');
      return;
    }
    setFile(f);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!notes.trim() && !file) || busy) return;

    const formatMap: Record<string, string> = {
      takeaways: 'Bullet Key Takeaways and Core Insights',
      executive: 'Executive Summary with Paragraph Recap & Key Definitions',
      cornell: 'Cornell Notes Style (Main Cues on left, Detailed notes, 2-sentence summary at bottom)',
      cheatsheet: 'Exam Quick-Reference Cheat Sheet (Formulas, Terms, Rules)',
    };

    const lengthMap: Record<string, string> = {
      short: 'Concise (1-minute read, highest signal-to-noise)',
      standard: 'Standard thorough summary covering all primary sections',
      deep: 'Comprehensive breakdown with key quotes and step derivations',
    };

    const promptText = notes.trim()
      ? `Please summarize the following study notes:\n"""\n${notes.trim()}\n"""\n`
      : 'Please summarize the attached study notes.\n';

    const fullPrompt = `${promptText}
Format: ${formatMap[style] || style}.
Target depth: ${lengthMap[length] || length}.
Include a Key Terms glossary and 3 essential takeaways at the top.`;

    await onSubmit(fullPrompt, file);
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-surface-container-low to-surface-container-low p-5 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <FileText size={20} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Revise & Condense</span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Notes Summarizer</h2>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Turn messy lecture slides, dense readings, or transcripts into crisp, organized study summaries.
      </p>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="summarize-notes" className="text-body-sm font-semibold text-on-surface">
              Paste your lecture notes or text:
            </label>
            <span className="text-xs text-on-surface-variant">
              {notes.trim().length > 0 ? `${notes.trim().split(/\s+/).length} words` : 'Or upload document below'}
            </span>
          </div>
          <textarea
            id="summarize-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={5}
            placeholder="Paste your lecture notes, transcript, textbook excerpts, or article text here..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-3 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* File Upload Zone */}
        <div className="rounded-xl border border-dashed border-card-border p-4 bg-surface/50 text-center hover:border-amber-500/60 transition-colors">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <span className="p-2.5 rounded-full bg-surface-container text-amber-600 dark:text-amber-400">
              <Paperclip size={18} />
            </span>
            <div className="text-xs">
              <span className="font-semibold text-on-surface">Upload lecture notes or slides</span>
              <p className="text-on-surface-variant mt-0.5">Supports PDF, TXT or Markdown up to 5 MB</p>
            </div>
            {file ? (
              <div className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-1.5 text-xs text-on-surface font-medium">
                <FileText size={15} />
                <span>{file.name}</span>
                <button type="button" onClick={() => setFile(undefined)} className="hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
                className="mt-1 !text-xs"
              >
                Choose PDF or TXT File
              </Button>
            )}
          </div>
          {fileError && <p className="mt-2 text-xs text-error">{fileError}</p>}
        </div>

        {/* Format Selector */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-2">
            Summary Format Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'takeaways', label: 'Bullet Takeaways' },
              { id: 'executive', label: 'Executive Summary' },
              { id: 'cornell', label: 'Cornell Notes Style' },
              { id: 'cheatsheet', label: 'Exam Cheat Sheet' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStyle(f.id)}
                className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                  style === f.id
                    ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-bold'
                    : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={(!notes.trim() && !file) || busy}
            icon={<FileText size={16} />}
            className="w-full sm:w-auto !bg-amber-600 hover:!bg-amber-700 !text-white"
          >
            {busy ? 'Summarizing notes...' : 'Summarize & Extract Insights'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* 4. QUIZ GENERATOR */
export function QuizMethodForm({ busy, onSubmit }: MethodFormProps) {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('intermediate');
  const type = 'mcq';

  const sampleTopics = [
    'Cellular Respiration & Krebs Cycle',
    'Linear Algebra & Eigenvalues',
    'Macroeconomics: Monetary Policy',
    'Python Object-Oriented Programming',
    'World War II Pacific Theater',
    'Thermodynamics Laws'
  ];

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || busy) return;

    const diffMap: Record<string, string> = {
      beginner: 'Beginner / Foundational (core definitions and direct recall)',
      intermediate: 'Intermediate (applying principles to solve realistic problems)',
      advanced: 'Advanced / Tricky (edge cases, multi-step reasoning, analytical questions)',
    };

    const fullPrompt = `Please generate an interactive practice quiz on: "${topic.trim()}".
Number of questions: ${numQuestions}.
Difficulty: ${diffMap[difficulty] || difficulty}.
Question style: ${type === 'mcq' ? 'Multiple choice with clear distractors and detailed explanations for every option' : 'Scenario-based case questions with multiple choice options'}.
Ensure each question has 4 options, a clear correct answer index, and a thorough explanation explaining why the correct answer is right and why others are wrong.`;

    await onSubmit(fullPrompt);
  }

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-surface-container-low to-surface-container-low p-5 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
          <CircleHelp size={20} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Test Yourself</span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Quiz Generator</h2>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Challenge yourself with active recall. Get instant scoring, detailed explanations, and pinpoint your weak spots.
      </p>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <label htmlFor="quiz-topic" className="block text-body-sm font-semibold text-on-surface mb-2">
            What subject or topic do you want to be quizzed on?
          </label>
          <input
            id="quiz-topic"
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Organic Chemistry reactions, World History, Data Structures..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-purple-500 focus:outline-none"
            required
          />
        </div>

        {/* Popular Quiz Topics */}
        <div>
          <span className="block text-xs font-medium text-on-surface-variant mb-2">Quick test ideas:</span>
          <div className="flex flex-wrap gap-2">
            {sampleTopics.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className="rounded-full border border-card-border bg-surface px-3 py-1 text-xs font-medium text-on-surface-variant hover:border-purple-500/50 hover:text-purple-600 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Question Count */}
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-2">
              Number of Questions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 10].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumQuestions(n)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                    numQuestions === n
                      ? 'border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-200 font-bold'
                      : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {n} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-2">
              Difficulty Tier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'beginner', label: 'Easy' },
                { id: 'intermediate', label: 'Medium' },
                { id: 'advanced', label: 'Challenging' },
              ].map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                    difficulty === d.id
                      ? 'border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-200 font-bold'
                      : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={!topic.trim() || busy}
            icon={<CircleHelp size={16} />}
            className="w-full sm:w-auto !bg-purple-600 hover:!bg-purple-700 !text-white"
          >
            {busy ? 'Generating interactive quiz...' : 'Generate Interactive Quiz'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* 5. SMART STUDY PLANNER */
export function PlannerMethodForm({ busy, onSubmit }: MethodFormProps) {
  const [subjects, setSubjects] = useState('');
  const [dailyHours, setDailyHours] = useState('2-3h');
  const [targetDate, setTargetDate] = useState('2weeks');
  const [strategy, setStrategy] = useState('pomodoro');

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjects.trim() || busy) return;

    const timelineMap: Record<string, string> = {
      '3days': 'Sprint: 3 days until deadline',
      '1week': '1 week intensive schedule',
      '2weeks': '2 weeks balanced preparation',
      '1month': '1 month comprehensive roadmap',
    };

    const strategyMap: Record<string, string> = {
      pomodoro: 'Pomodoro Technique (25 min high focus + 5 min rest)',
      deepwork: 'Deep Work (90-minute immersion blocks)',
      spaced: 'Spaced Repetition & Daily Active Recall slots',
    };

    const fullPrompt = `Create a realistic, structured study schedule for: "${subjects.trim()}".
Available study time per day: ${dailyHours}.
Target timeline / deadline: ${timelineMap[targetDate] || targetDate}.
Preferred study technique: ${strategyMap[strategy] || strategy}.
Please organize the plan by days/phases with specific milestone topics, allocated breaks, and revision checkpoints.`;

    await onSubmit(fullPrompt);
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-surface-container-low to-surface-container-low p-5 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          <CalendarDays size={20} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Plan Ahead</span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Smart Study Planner</h2>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Build a realistic, guilt-free schedule tailored to your available hours, subjects, and target deadlines.
      </p>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <label htmlFor="planner-subjects" className="block text-body-sm font-semibold text-on-surface mb-2">
            What subjects, exams, or projects are you planning for?
          </label>
          <input
            id="planner-subjects"
            type="text"
            value={subjects}
            onChange={e => setSubjects(e.target.value)}
            placeholder="e.g. Calculus Final and Physics Lab Report..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-emerald-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-2">
              Available Daily Study Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '1-2h', label: '1 - 2 hrs' },
                { id: '2-3h', label: '2 - 3 hrs' },
                { id: '4h+', label: '4+ hrs' },
              ].map(h => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setDailyHours(h.id)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                    dailyHours === h.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 font-bold'
                      : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-2">
              Target Deadline
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '3days', label: 'In 3 Days' },
                { id: '1week', label: 'In 1 Week' },
                { id: '2weeks', label: 'In 2 Weeks' },
                { id: '1month', label: 'In 1 Month' },
              ].map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setTargetDate(d.id)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                    targetDate === d.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 font-bold'
                      : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Study Strategy */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-2">
            Pacing Strategy
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'pomodoro', title: 'Pomodoro Sprints', desc: '25m focus / 5m breaks' },
              { id: 'deepwork', title: 'Deep Work Blocks', desc: '90m undisturbed flow' },
              { id: 'spaced', title: 'Spaced Repetition', desc: 'Daily review loops' },
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStrategy(s.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  strategy === s.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 font-semibold shadow-xs'
                    : 'border-card-border bg-surface text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <div className="text-body-sm font-medium">{s.title}</div>
                <div className="text-xs text-on-surface-variant mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={!subjects.trim() || busy}
            icon={<CalendarDays size={16} />}
            className="w-full sm:w-auto !bg-emerald-600 hover:!bg-emerald-700 !text-white"
          >
            {busy ? 'Building schedule...' : 'Build My Study Schedule'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* 6. RESEARCH ASSISTANT */
export function ResearchMethodForm({ busy, onSubmit }: MethodFormProps) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('literature');
  const level = 'undergraduate';

  const sampleResearch = [
    'Impact of Microplastics on Marine Food Chains',
    'AI Large Language Models in Clinical Diagnostics',
    'Universal Basic Income: Economic Feasibility Studies',
    'Renewable Energy Grid Integration & Battery Storage'
  ];

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || busy) return;

    const scopeMap: Record<string, string> = {
      literature: 'Literature Review, Foundational Theories & Historical Pioneers',
      debates: 'Major Scholarly Debates, Competing Viewpoints & Counter-Arguments',
      methodology: 'Methodology Frameworks, Data Collection Approaches & Key Metrics',
      roadmap: 'Formulation of Research Questions, Hypotheses & Library Verification Keywords',
    };

    const fullPrompt = `Conduct an academic research investigation on: "${query.trim()}".
Academic depth: ${level.toUpperCase()}.
Investigation scope: ${scopeMap[scope] || scope}.
Please organize findings into:
1. Core Conceptual Framework & Definitions
2. Primary Arguments & Evidence
3. Counter-arguments & Unresolved Questions
4. Recommended Keywords & Scholarly Databases to verify.`;

    await onSubmit(fullPrompt);
  }

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 via-surface-container-low to-surface-container-low p-5 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
          <Search size={20} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Explore & Discover</span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Research Assistant</h2>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Organize scholarly concepts, uncover multiple angles, and formulate strong thesis questions with research guidance.
      </p>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <label htmlFor="research-query" className="block text-body-sm font-semibold text-on-surface mb-2">
            What research topic, thesis, or question are you investigating?
          </label>
          <input
            id="research-query"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. CRISPR ethics, Renewable Energy storage solutions, Monetary policy..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-cyan-500 focus:outline-none"
            required
          />
        </div>

        {/* Quick Topics */}
        <div>
          <span className="block text-xs font-medium text-on-surface-variant mb-2">Trending research topics:</span>
          <div className="flex flex-wrap gap-2">
            {sampleResearch.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setQuery(t)}
                className="rounded-full border border-card-border bg-surface px-3 py-1 text-xs font-medium text-on-surface-variant hover:border-cyan-500/50 hover:text-cyan-600 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Scope */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-2">
            Primary Investigation Scope
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'literature', label: 'Theories & Literature Overview' },
              { id: 'debates', label: 'Key Debates & Opposing Arguments' },
              { id: 'methodology', label: 'Methodologies & Frameworks' },
              { id: 'roadmap', label: 'Research Questions & Search Terms' },
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id)}
                className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                  scope === s.id
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200 font-bold'
                    : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={!query.trim() || busy}
            icon={<Search size={16} />}
            className="w-full sm:w-auto !bg-cyan-600 hover:!bg-cyan-700 !text-white"
          >
            {busy ? 'Investigating research...' : 'Start Research Investigation'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* 7. FLASHCARDS STUDIO */
export function FlashcardsMethodForm({ busy, onSubmit }: MethodFormProps) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [style, setStyle] = useState('terms');
  const [file, setFile] = useState<File>();
  const [fileError, setFileError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    setFileError('');
    if (!f) return;
    if (!/\.(pdf|txt|md)$/i.test(f.name)) {
      setFileError('Please attach a PDF, TXT, or Markdown notes file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setFileError('File size must be under 5 MB.');
      return;
    }
    setFile(f);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!topic.trim() && !file) || busy) return;

    const styleMap: Record<string, string> = {
      terms: 'Key Terms, Definitions & High-Yield Vocab',
      concepts: 'Concept Application & Scenario-based Recall',
      formulas: 'Formulas, Theorems & Law Statements',
    };

    const promptText = topic.trim()
      ? `Generate a flashcard review deck on: "${topic.trim()}".`
      : 'Generate a flashcard review deck from the attached notes.';

    const fullPrompt = `${promptText}
Number of flashcards: ${count}.
Deck focus: ${styleMap[style] || style}.
Provide concise, memorable questions on the front and clear, definitive answers on the back to maximize active recall.`;

    await onSubmit(fullPrompt, file);
  }

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-surface-container-low to-surface-container-low p-5 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <Layers size={20} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Remember & Master</span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Flashcards Studio</h2>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Lock key definitions, formulas, and concepts into long-term memory with interactive flip cards.
      </p>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <label htmlFor="flashcard-topic" className="block text-body-sm font-semibold text-on-surface mb-2">
            Deck Topic or Subject (or attach notes file)
          </label>
          <input
            id="flashcard-topic"
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Cranial Nerves, Spanish Irregular Verbs, Microeconomics Curves..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-2">
              Cards in Deck
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                    count === n
                      ? 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-bold'
                      : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {n} Cards
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-2">
              Card Content Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'terms', label: 'Terms / Defs' },
                { id: 'concepts', label: 'Concepts' },
                { id: 'formulas', label: 'Formulas' },
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                    style === s.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 font-bold'
                      : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Attachment option */}
        <div>
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => fileInput.current?.click()}
              icon={<Paperclip size={16} />}
            >
              {file ? 'Replace attached notes' : 'Generate cards from notes / PDF file'}
            </Button>
            {file && (
              <div className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-xs text-on-surface">
                <FileText size={14} />
                <span className="truncate max-w-[200px]">{file.name}</span>
                <button type="button" onClick={() => setFile(undefined)} className="hover:text-red-500 ml-1">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          {fileError && <p className="mt-1 text-xs text-error">{fileError}</p>}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={(!topic.trim() && !file) || busy}
            icon={<Layers size={16} />}
            className="w-full sm:w-auto !bg-blue-600 hover:!bg-blue-700 !text-white"
          >
            {busy ? 'Crafting flashcards...' : 'Generate Flashcard Deck'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* 8. DOUBT SOLVER */
export function DoubtMethodForm({ busy, onSubmit }: MethodFormProps) {
  const [question, setQuestion] = useState('');
  const [tried, setTried] = useState('');
  const [mode, setMode] = useState<'hint' | 'mistake' | 'stepbystep'>('stepbystep');

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || busy) return;

    const modeInstructions = {
      hint: 'Give me a Socratic hint first without revealing the full solution yet, so I can try the next step myself.',
      mistake: 'Analyze my attempt, pinpoint the exact line or concept where I went wrong, and explain the misconception.',
      stepbystep: 'Walk me through a clear, step-by-step resolution from start to finish with the core formula or rule stated clearly.',
    };

    const fullPrompt = `I have a doubt on this question/problem:
"""
${question.trim()}
"""
${tried.trim() ? `What I tried or where I got stuck:\n"""\n${tried.trim()}\n"""\n` : ''}
Approach requested: ${modeInstructions[mode]}.
Please provide a clear resolution and a similar practice tip.`;

    await onSubmit(fullPrompt);
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-surface-container-low to-surface-container-low p-5 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <Lightbulb size={20} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Work It Out</span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Doubt Solver</h2>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Stuck on a tricky problem? Untangle the confusion with step-by-step guidance and misconception diagnosis.
      </p>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <label htmlFor="doubt-question" className="block text-body-sm font-semibold text-on-surface mb-2">
            The Problem or Question (paste full text, math equation, or code)
          </label>
          <textarea
            id="doubt-question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            rows={4}
            placeholder="e.g. Find the derivative of f(x) = x^2 * ln(x), or Why does my merge sort give a stack overflow error?"
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-3 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-amber-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="doubt-tried" className="block text-body-sm font-semibold text-on-surface mb-2">
            What have you tried so far? Where are you stuck? (Optional)
          </label>
          <input
            id="doubt-tried"
            type="text"
            value={tried}
            onChange={e => setTried(e.target.value)}
            placeholder="e.g. I applied product rule, but I don't know what to do with ln(x)..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Guidance Mode */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-2">
            How would you like the tutor to help?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'hint', title: 'Socratic Hint', desc: 'Guide me with a clue so I solve it' },
              { id: 'mistake', title: 'Find My Mistake', desc: 'Pinpoint where my logic failed' },
              { id: 'stepbystep', title: 'Step-by-Step Solution', desc: 'Full worked breakdown with rules' },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id as typeof mode)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  mode === m.id
                    ? 'border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-100 font-semibold shadow-xs'
                    : 'border-card-border bg-surface text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <div className="text-body-sm font-medium">{m.title}</div>
                <div className="text-xs text-on-surface-variant mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={!question.trim() || busy}
            icon={<Lightbulb size={16} />}
            className="w-full sm:w-auto !bg-amber-600 hover:!bg-amber-700 !text-white"
          >
            {busy ? 'Solving doubt...' : 'Solve My Doubt'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* 9. PRACTICE MODE */
export function PracticeMethodForm({ busy, onSubmit }: MethodFormProps) {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('level2');
  const format = 'mixed';

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || busy) return;

    const levelMap: Record<string, string> = {
      level1: 'Level 1: Novice (Direct formulas & basic mechanical drill)',
      level2: 'Level 2: Intermediate (Multi-step application & realistic problems)',
      level3: 'Level 3: Expert (Competitive exams, tricky corner cases & proofs)',
    };

    const fullPrompt = `Give me a set of practice questions on: "${topic.trim()}".
Skill level: ${levelMap[level] || level}.
Format: ${format === 'mixed' ? 'Interactive multiple choice + progressive calculation problems' : 'Numbered step-by-step challenge problems'}.
Do not give the answers away immediately; give me the questions and wait for me to attempt or prompt for answers!`;

    await onSubmit(fullPrompt);
  }

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-surface-container-low to-surface-container-low p-5 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
          <Brain size={20} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Build Skills</span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Practice Mode</h2>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Sharpen your skills through progressive practice that scales from warm-ups to competition-level challenges.
      </p>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <label htmlFor="practice-topic" className="block text-body-sm font-semibold text-on-surface mb-2">
            Skill or Topic to Practice
          </label>
          <input
            id="practice-topic"
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Chain Rule Differentiation, SQL Joins, Kirchhoff's Laws..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-violet-500 focus:outline-none"
            required
          />
        </div>

        {/* Level Progression */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-2">
            Select Your Starting Level
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'level1', title: 'Level 1: Novice', desc: 'Basic mechanics & definitions' },
              { id: 'level2', title: 'Level 2: Applied', desc: 'Standard exam-level problems' },
              { id: 'level3', title: 'Level 3: Expert', desc: 'Tricky edge-cases & deep problems' },
            ].map(l => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLevel(l.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  level === l.id
                    ? 'border-violet-500 bg-violet-50 text-violet-950 dark:bg-violet-950 dark:text-violet-100 font-semibold shadow-xs'
                    : 'border-card-border bg-surface text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <div className="text-body-sm font-medium">{l.title}</div>
                <div className="text-xs text-on-surface-variant mt-0.5">{l.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={!topic.trim() || busy}
            icon={<Brain size={16} />}
            className="w-full sm:w-auto !bg-violet-600 hover:!bg-violet-700 !text-white"
          >
            {busy ? 'Preparing practice set...' : 'Start Practice Session'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* 10. BRAINSTORM LAB */
export function BrainstormMethodForm({ busy, onSubmit }: MethodFormProps) {
  const [topic, setTopic] = useState('');
  const [outputType, setOutputType] = useState('project');
  const [flavor, setFlavor] = useState('creative');
  const [constraints, setConstraints] = useState('');

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || busy) return;

    const outputMap: Record<string, string> = {
      project: 'Final Year / Capstone Science & Tech Project',
      presentation: 'Engaging Class Presentation / Slide Deck Narrative',
      essay: 'Research Paper / Critical Argument Essay',
      hackathon: 'Hackathon / App or Web Innovation Idea',
    };

    const flavorMap: Record<string, string> = {
      creative: 'Out-of-the-box, novel and creative angles',
      pragmatic: 'Highly practical, feasible within constraints, high-scoring',
      contrarian: 'Unique counter-intuitive or interdisciplinary approach',
    };

    const fullPrompt = `Brainstorm distinctive project and assignment concepts for: "${topic.trim()}".
Format: ${outputMap[outputType] || outputType}.
Creative flavor: ${flavorMap[flavor] || flavor}.
${constraints.trim() ? `Constraints / Requirements: ${constraints.trim()}` : ''}
Please propose 3-4 developed concepts with:
- Catchy working title
- The Core Problem it solves
- Feasibility & Impact rating
- Recommended initial execution steps.`;

    await onSubmit(fullPrompt);
  }

  return (
    <div className="rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/5 via-surface-container-low to-surface-container-low p-5 sm:p-7 shadow-xs">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
          <Sparkles size={20} />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">Create & Innovate</span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Brainstorm Lab</h2>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Generate stand-out project ideas, compelling presentation angles, and thesis topics that impress professors.
      </p>

      <form onSubmit={handleFormSubmit} className="space-y-5">
        <div>
          <label htmlFor="brainstorm-topic" className="block text-body-sm font-semibold text-on-surface mb-2">
            What is your assignment brief, theme, or general subject?
          </label>
          <input
            id="brainstorm-topic"
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Sustainable urban transport, AI ethics in healthcare, Modernist architecture..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-fuchsia-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-2">
              Deliverable Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'project', label: 'Capstone Project' },
                { id: 'presentation', label: 'Presentation' },
                { id: 'essay', label: 'Research Paper' },
                { id: 'hackathon', label: 'Tech / App' },
              ].map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOutputType(o.id)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                    outputType === o.id
                      ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-200 font-bold'
                      : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-2">
              Ideation Flavor
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'creative', label: 'Novel' },
                { id: 'pragmatic', label: 'Practical' },
                { id: 'contrarian', label: 'Unique' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFlavor(f.id)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-medium transition-colors ${
                    flavor === f.id
                      ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-200 font-bold'
                      : 'border-card-border bg-surface text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="brainstorm-constraints" className="block text-body-sm font-semibold text-on-surface mb-2">
            Constraints or Goals (e.g. 2-week deadline, solo project, no coding required)
          </label>
          <input
            id="brainstorm-constraints"
            type="text"
            value={constraints}
            onChange={e => setConstraints(e.target.value)}
            placeholder="e.g. Must be doable in 1 week with readily available open dataset..."
            disabled={busy}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-2.5 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-fuchsia-500 focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={!topic.trim() || busy}
            icon={<Sparkles size={16} />}
            className="w-full sm:w-auto !bg-fuchsia-600 hover:!bg-fuchsia-700 !text-white"
          >
            {busy ? 'Brainstorming ideas...' : 'Brainstorm Creative Ideas'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* Master Router Component for Method-Specific Intake Form */
export function MethodSpecificIntake({ 
  mode, 
  busy, 
  onSubmit 
}: { 
  mode: LearningMode; 
  busy: boolean; 
  onSubmit: (prompt: string, file?: File) => Promise<boolean>; 
}) {
  switch (mode) {
    case 'explain':
      return <ExplainMethodForm busy={busy} onSubmit={onSubmit} />;
    case 'exam':
      return <ExamMethodForm busy={busy} onSubmit={onSubmit} />;
    case 'summarize':
      return <SummarizeMethodForm busy={busy} onSubmit={onSubmit} />;
    case 'quiz':
      return <QuizMethodForm busy={busy} onSubmit={onSubmit} />;
    case 'planner':
      return <PlannerMethodForm busy={busy} onSubmit={onSubmit} />;
    case 'research':
      return <ResearchMethodForm busy={busy} onSubmit={onSubmit} />;
    case 'flashcards':
      return <FlashcardsMethodForm busy={busy} onSubmit={onSubmit} />;
    case 'doubt':
      return <DoubtMethodForm busy={busy} onSubmit={onSubmit} />;
    case 'practice':
      return <PracticeMethodForm busy={busy} onSubmit={onSubmit} />;
    case 'brainstorm':
      return <BrainstormMethodForm busy={busy} onSubmit={onSubmit} />;
    default:
      return <ExplainMethodForm busy={busy} onSubmit={onSubmit} />;
  }
}
