import { motion } from 'framer-motion';
import { Clock, ShieldAlert } from 'lucide-react';
import type { MessageRequestStatus } from '../../services/messageRequestService';

interface Props {
  readonly status: MessageRequestStatus;
  readonly otherUserName: string;
}

export function RequestStatusBanner({ status, otherUserName }: Props) {
  if (status === 'pending') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Clock className="w-5 h-5 stroke-[2]" />
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface">
            Message Request Sent
          </p>
          <p className="mt-1 text-[11px] text-on-surface-variant leading-relaxed">
            Waiting for <span className="font-semibold text-on-surface">{otherUserName}</span> to accept. Normal chat will activate automatically once approved.
          </p>
        </div>
      </motion.div>
    );
  }

  if (status === 'rejected') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-2.5 rounded-2xl border border-error/20 bg-error/5 p-4 text-center"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10 text-error">
          <ShieldAlert className="w-5 h-5 stroke-[2]" />
        </div>
        <div>
          <p className="text-xs font-bold text-on-surface">
            Request Declined
          </p>
          <p className="mt-1 text-[11px] text-on-surface-variant leading-relaxed">
            <span className="font-semibold text-on-surface">{otherUserName}</span> declined the message request. Messaging remains closed.
          </p>
        </div>
      </motion.div>
    );
  }

  return null;
}

export default RequestStatusBanner;
