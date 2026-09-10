import { motion } from 'framer-motion';
import { Check, Hash, Loader2, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import type { MessageRequest } from '../../services/messageRequestService';
import { timeAgo } from '../../lib/timeAgo';

interface Props {
  readonly request: MessageRequest;
  readonly onAccept: (requestId: string) => Promise<void>;
  readonly onReject: (requestId: string) => Promise<void>;
}

export function IncomingRequestCard({ request, onAccept, onReject }: Props) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(request.id);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(request.id);
    } finally {
      setIsRejecting(false);
    }
  };

  const isBusy = isAccepting || isRejecting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-card-border bg-surface-container-low p-4 shadow-xs transition-all hover:border-primary/30"
    >
      {/* Header badge */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Pending Request</span>
        </div>
        <span className="text-[11px] text-on-surface-variant font-medium">
          {timeAgo(request.createdAt)}
        </span>
      </div>

      {/* Sender Profile */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar
            name={request.senderName}
            src={request.senderAvatar}
            size={44}
            className="rounded-full ring-2 ring-primary/20"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-on-surface tracking-tight">
            {request.senderName}
          </p>
          <div className="mt-0.5 flex items-center gap-1 font-mono text-[11px] font-medium text-primary">
            <Hash className="w-3 h-3" />
            <span>{request.senderQuickId}</span>
          </div>
          <p className="mt-1.5 text-xs text-on-surface-variant leading-relaxed">
            Wants to connect and exchange study messages with you.
          </p>
        </div>
      </div>

      {/* Security reassurance */}
      <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-surface-container-high/60 px-2.5 py-1.5 text-[11px] text-on-surface-variant">
        <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="truncate">Accepting will open a private, secure conversation.</span>
      </div>

      {/* Action Buttons */}
      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isBusy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
        >
          {isAccepting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Accept</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReject}
          disabled={isBusy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-error hover:bg-error/10 text-xs font-semibold border border-card-border disabled:opacity-50 transition-all cursor-pointer"
        >
          {isRejecting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Decline</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default IncomingRequestCard;
