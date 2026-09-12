import { motion } from 'framer-motion';
import { Clock, Mail, Phone, User } from 'lucide-react';
import type { StudentQuery } from '../../services/queryService';
import { generateQuickId } from '../../lib/idUtils';
import { timeAgo } from '../../lib/timeAgo';
import { cn } from '../../lib/cn';

interface Props {
  readonly query: StudentQuery;
  readonly isSelected: boolean;
  readonly onClick: (queryId: string) => void;
}

export function AdminQueryListItem({ query, isSelected, onClick }: Props) {
  const quickId = generateQuickId(query.studentId);

  return (
    <motion.button
      type="button"
      onClick={() => onClick(query.id)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col gap-2',
        isSelected
          ? 'bg-primary/10 border-primary/40 shadow-xs'
          : 'bg-surface-container-low border-card-border/70 hover:bg-surface-container hover:border-card-border'
      )}
    >
      {/* Top row: Student name + Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-on-surface truncate leading-tight">
              {query.studentName}
            </p>
            <p className="text-[10px] font-mono text-on-surface-variant truncate">
              ID: {quickId}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={cn(
            'shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
            query.status === 'Pending' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
            query.status === 'Opened' && 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
            query.status === 'Resolved' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
          )}
        >
          {query.status === 'Opened' ? 'Assigned' : query.status}
        </span>
      </div>

      {/* Subject */}
      <p className="text-xs font-semibold text-on-surface truncate leading-snug">
        {query.subject}
      </p>

      {/* Short Preview */}
      <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
        {query.description}
      </p>

      {/* Footer: Category + Contact Indicators + Time */}
      <div className="flex items-center justify-between text-[10px] text-on-surface-variant/80 pt-1 border-t border-card-border/50">
        <span className="truncate max-w-[130px] font-medium bg-surface-container px-1.5 py-0.5 rounded">
          {query.category}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {query.studentPhone && (
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] bg-emerald-500/10 px-1 py-0.5 rounded" title={query.studentPhone}>
              <Phone className="w-2.5 h-2.5" />
            </span>
          )}
          {query.studentEmail && (
            <span className="flex items-center gap-0.5 text-primary font-mono text-[9px] bg-primary/10 px-1 py-0.5 rounded" title={query.studentEmail}>
              <Mail className="w-2.5 h-2.5" />
            </span>
          )}
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/80 ml-0.5">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(query.createdAt)}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}