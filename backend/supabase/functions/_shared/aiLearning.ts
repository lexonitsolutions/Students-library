export const learningModes = [
  { id: 'explain', title: 'Explain a Topic', description: 'Make difficult concepts click, with simple explanations and examples.', prompt: 'What topic would you like to understand?', starter: 'Explain ', label: 'Understand' },
  { id: 'exam', title: 'Exam Preparation', description: 'Find your focus with revision points and exam-style questions.', prompt: 'Tell me your subject, exam date, and topics to cover.', starter: 'Help me prepare for my exam in ', label: 'Prepare' },
  { id: 'summarize', title: 'Notes Summarizer', description: 'Turn long notes into the key ideas you need to remember.', prompt: 'Paste your notes or attach a PDF to get started.', starter: 'Summarize these notes: ', label: 'Revise' },
  { id: 'quiz', title: 'Quiz Generator', description: 'Test what you know and learn from every answer.', prompt: 'Choose a topic and difficulty for your quiz.', starter: 'Quiz me on ', label: 'Test yourself' },
  { id: 'planner', title: 'Smart Study Planner', description: 'Build a realistic schedule around your time and learning goals.', prompt: 'Share your subjects, available study time, and exam dates.', starter: 'Create a study plan for ', label: 'Plan ahead' },
  { id: 'research', title: 'Research Assistant', description: 'Explore concepts, organize findings, and identify sources to check.', prompt: 'What are you researching, and what would you like to find out?', starter: 'Help me research ', label: 'Explore' },
  { id: 'flashcards', title: 'Flashcards', description: 'Build your recall, one question and answer at a time.', prompt: 'Choose a topic or attach your notes to make flashcards.', starter: 'Make flashcards about ', label: 'Remember' },
  { id: 'doubt', title: 'Doubt Solver', description: 'Work through a specific question, one clear step at a time.', prompt: 'What is confusing you? Share the question and what you have tried.', starter: 'Help me understand why ', label: 'Work it out' },
  { id: 'practice', title: 'Practice Mode', description: 'Try questions that get harder as your understanding grows.', prompt: 'Choose a topic and tell me your current level.', starter: 'Give me practice questions on ', label: 'Build skills' },
  { id: 'brainstorm', title: 'Brainstorm', description: 'Explore ideas for assignments, projects, and presentations.', prompt: 'Tell me your project or assignment brief and any constraints.', starter: 'Help me brainstorm ideas for ', label: 'Create' },
] as const;

export type LearningMode = typeof learningModes[number]['id'];
export interface QuizQuestion { question: string; options: string[]; answer: number; explanation: string }
export interface Flashcard { question: string; answer: string }
export interface LearningReply { text: string; quiz?: QuizQuestion[]; flashcards?: Flashcard[] }
export interface LearningMessage { id: string; role: 'user' | 'assistant'; content: string; attachmentName?: string; reply?: LearningReply }
export interface LearningSession { id: string; title: string; mode: LearningMode; updatedAt: string; messages: LearningMessage[] }

export const getMode = (id: string) => learningModes.find(mode => mode.id === id) ?? learningModes[0];

export function parseLearningReply(value: unknown): LearningReply {
  if (!value || typeof value !== 'object' || !('text' in value) || typeof (value as { text: unknown }).text !== 'string' || !(value as { text: string }).text.trim() || (value as { text: string }).text.length > 30000) {
    throw new Error('The learning assistant returned an invalid response. Please retry.');
  }
  const data = value as Record<string, unknown>;
  const quiz = Array.isArray(data.quiz) ? data.quiz.filter((q): q is QuizQuestion => q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 6 && q.options.every((o: unknown) => typeof o === 'string') && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length && typeof q.explanation === 'string').slice(0, 10) : [];
  const flashcards = Array.isArray(data.flashcards) ? data.flashcards.filter((f): f is Flashcard => f && typeof f.question === 'string' && typeof f.answer === 'string').slice(0, 20) : [];
  return { text: (value as { text: string }).text, quiz, flashcards };
}
