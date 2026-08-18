import {
  ClipboardList,
  FileEdit,
  FileQuestion,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  Presentation,
  Video,
} from 'lucide-react';
import type { MaterialType } from '../data/types';

export const materialTypeIcon: Record<MaterialType, typeof FileText> = {
  pdf: FileText,
  doc: FileEdit,
  notes: FileText,
  slides: Presentation,
  'past-paper': FileQuestion,
  'lab-manual': FlaskConical,
};

export const categoryIcon: Record<string, typeof FileText> = {
  FileEdit,
  FileQuestion,
  ClipboardList,
  FlaskConical,
  FileText,
  Image: ImageIcon,
  Video,
};

export const accentBg: Record<string, string> = {
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  rose: 'bg-red-500/10 text-red-600 dark:text-red-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};
