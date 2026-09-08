import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, BookOpen, Sparkles, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function MessagesPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      {/* Icon & Sparkle badge */}
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm ring-8 ring-primary/5">
          <MessageSquare size={38} strokeWidth={1.8} />
        </div>
        <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
          <Sparkles size={14} />
        </div>
      </div>

      {/* Status Pill */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20 mb-3">
        <span>Under Development</span>
      </div>

      {/* Main Heading & Description */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
        Direct Messaging is Coming Soon
      </h1>

      <p className="mt-2.5 max-w-md text-sm sm:text-base text-on-surface-variant leading-relaxed">
        We are building peer-to-peer student messaging, topic discussions, and study group collaboration.
        This feature will be available in an upcoming update.
      </p>

      {/* Navigation Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/')}
        >
          Back to Dashboard
        </Button>
        <Button
          variant="secondary"
          icon={<BookOpen size={16} />}
          onClick={() => navigate('/library')}
        >
          Explore Library
        </Button>
      </div>

      {/* Helpful Hint Card */}
      <div className="mt-10 rounded-2xl border border-card-border/70 bg-surface-container-low/70 p-4 max-w-sm w-full text-left flex items-start gap-3 shadow-2xs">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
          <Info size={16} />
        </div>
        <div className="text-xs">
          <p className="font-semibold text-on-surface">Need study materials right now?</p>
          <p className="text-on-surface-variant mt-0.5">
            You can still browse, upload past papers, and view study notes across all departments in the Library.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;

