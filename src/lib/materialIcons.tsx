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
  Image: ImageIcon,
  Video,
};

export const accentBg: Record<string, string> = {
  indigo: 'bg-primary-container/10 text-primary-container',
  blue: 'bg-secondary-container/60 text-secondary',
  amber: 'bg-tertiary-container/20 text-tertiary',
  rose: 'bg-error-container/60 text-error',
  emerald: 'bg-emerald-100 text-emerald-700',
};
