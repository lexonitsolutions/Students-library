import { 
  BookOpen, Brain, CalendarDays, CircleHelp, 
  FileText, Layers, Lightbulb, Search, Sparkles, Target
} from 'lucide-react';
import type { LearningMode } from '../../data/aiLearning';

export interface MethodConfig {
  id: LearningMode;
  title: string;
  badge: string;
  accentBorder: string;
  accentBg: string;
  accentText: string;
  icon: typeof BookOpen;
  followUps: string[];
  placeholder: string;
  tagline: string;
}

export const METHOD_CONFIGS: Record<LearningMode, MethodConfig> = {
  explain: {
    id: 'explain',
    title: 'Explain a Topic',
    badge: 'Understand',
    accentBorder: 'border-primary/30',
    accentBg: 'bg-primary-container text-primary',
    accentText: 'text-primary',
    icon: BookOpen,
    followUps: ['Explain simpler (ELI5)', 'Give real-world analogy', 'Break into steps', 'Common pitfalls', 'Quiz me on this'],
    placeholder: 'Ask a follow-up, request an analogy, or clarify a concept...',
    tagline: 'Deep conceptual intuition through analogies and step breakdowns.'
  },
  exam: {
    id: 'exam',
    title: 'Exam Preparation',
    badge: 'Prepare',
    accentBorder: 'border-red-500/30',
    accentBg: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    accentText: 'text-red-600 dark:text-red-400',
    icon: Target,
    followUps: ['Give 3 mock exam questions', 'Create formula cheat-sheet', 'Test my weak spots', 'Common exam traps', 'Revision checklist'],
    placeholder: 'Ask for more mock questions, formulas, or revision strategies...',
    tagline: 'High-yield revision points, exam-style practice, and scoring tactics.'
  },
  summarize: {
    id: 'summarize',
    title: 'Notes Summarizer',
    badge: 'Revise',
    accentBorder: 'border-amber-500/30',
    accentBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    accentText: 'text-amber-600 dark:text-amber-400',
    icon: FileText,
    followUps: ['Condense into 5 bullets', 'Extract definitions glossary', 'Turn into flashcards', 'Create exam cheat-sheet', 'Quiz me on this'],
    placeholder: 'Ask to condense further, extract definitions, or summarize specific parts...',
    tagline: 'Condense complex lecture notes into clear, memorable takeaways.'
  },
  quiz: {
    id: 'quiz',
    title: 'Quiz Generator',
    badge: 'Test Yourself',
    accentBorder: 'border-purple-500/30',
    accentBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    accentText: 'text-purple-600 dark:text-purple-400',
    icon: CircleHelp,
    followUps: ['Practice next level', 'Generate 5 harder questions', 'Explain question 1 in detail', 'Turn into flashcards', 'Show summary score'],
    placeholder: 'Ask to adjust quiz difficulty, explain an answer, or request new questions...',
    tagline: 'Active recall testing with instant answers and comprehensive explanations.'
  },
  planner: {
    id: 'planner',
    title: 'Smart Study Planner',
    badge: 'Plan Ahead',
    accentBorder: 'border-emerald-500/30',
    accentBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    icon: CalendarDays,
    followUps: ['Adjust for busy weekend', 'Break Day 1 into micro-tasks', 'Add buffer revision days', 'Pomodoro breakdown', 'Daily checklist'],
    placeholder: 'Ask to reschedule, adjust study hours, or add specific subjects...',
    tagline: 'Structured timetables paced around your actual deadlines and hours.'
  },
  research: {
    id: 'research',
    title: 'Research Assistant',
    badge: 'Explore',
    accentBorder: 'border-cyan-500/30',
    accentBg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
    accentText: 'text-cyan-600 dark:text-cyan-400',
    icon: Search,
    followUps: ['Explore opposing arguments', 'Library search queries to verify', 'Draft thesis statement', 'Outline paper structure', 'Key historical pioneers'],
    placeholder: 'Ask to deepen an argument, suggest search queries, or structure an outline...',
    tagline: 'Synthesize literature, uncover competing arguments, and frame research.'
  },
  flashcards: {
    id: 'flashcards',
    title: 'Flashcards Studio',
    badge: 'Remember',
    accentBorder: 'border-blue-500/30',
    accentBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    accentText: 'text-blue-600 dark:text-blue-400',
    icon: Layers,
    followUps: ['Generate 5 more cards', 'Make harder cards', 'Turn cards into a quiz', 'Formulas & rules cards', 'Test remembered cards'],
    placeholder: 'Ask for more cards, card explanations, or review specific terms...',
    tagline: 'Spaced repetition flashcards with flip study and memory tracking.'
  },
  doubt: {
    id: 'doubt',
    title: 'Doubt Solver',
    badge: 'Work It Out',
    accentBorder: 'border-amber-500/30',
    accentBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    accentText: 'text-amber-600 dark:text-amber-400',
    icon: Lightbulb,
    followUps: ['Explain step 2 more', 'Give similar problem to try', 'Why was my approach wrong?', 'Show alternative method', 'Key takeaway rule'],
    placeholder: 'Ask about a specific step, share your attempt, or ask why a step works...',
    tagline: 'Pinpoint misconceptions and work through questions step by step.'
  },
  practice: {
    id: 'practice',
    title: 'Practice Mode',
    badge: 'Build Skills',
    accentBorder: 'border-violet-500/30',
    accentBg: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    accentText: 'text-violet-600 dark:text-violet-400',
    icon: Brain,
    followUps: ['Level up to harder questions', 'Give hint for current problem', 'Step-by-step worked solution', 'Try another problem', 'Explain core formula'],
    placeholder: 'Submit your answer attempt, ask for a hint, or request next level...',
    tagline: 'Adaptive skill challenges that scale from warmups to competition level.'
  },
  brainstorm: {
    id: 'brainstorm',
    title: 'Brainstorm Lab',
    badge: 'Create',
    accentBorder: 'border-fuchsia-500/30',
    accentBg: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300',
    accentText: 'text-fuchsia-600 dark:text-fuchsia-400',
    icon: Sparkles,
    followUps: ['Develop Idea #1 outline', 'Suggest presentation slides', 'Catchy title ideas', 'Identify project risks & mitigations', 'Executive summary'],
    placeholder: 'Ask to develop an idea further, add slides, or refine constraints...',
    tagline: 'Unleash standout project concepts, presentation angles, and creative solutions.'
  },
};
