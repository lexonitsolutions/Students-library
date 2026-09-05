import { MessageSquare, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

export function MessagesPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full w-full items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex w-full max-w-md flex-col items-center text-center rounded-3xl border border-card-border bg-surface-container-low p-8 sm:p-10 shadow-sm"
      >
        {/* Icon */}
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageSquare size={38} className="text-primary" />
          <span className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
            <Sparkles size={14} />
          </span>
        </div>

        {/* Badge */}
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-label-sm font-semibold text-primary">
          Under Development
        </span>

        {/* Title */}
        <h1 className="text-headline-md sm:text-headline-lg font-bold text-on-surface">
          Messages is coming soon
        </h1>

        {/* Description */}
        <p className="mt-3 text-body-md text-on-surface-variant leading-relaxed">
          We're currently working on this feature. Soon, you'll be able to chat directly with other students, collaborate on notes, and discuss study materials.
        </p>

        {/* Actions */}
        <div className="mt-8 flex w-full flex-col sm:flex-row items-center gap-3">
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center cursor-pointer"
            icon={<BookOpen size={18} />}
            onClick={() => navigate('/')}
          >
            Browse Materials
          </Button>

          <Button
            variant="secondary"
            size="md"
            className="w-full justify-center cursor-pointer"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default MessagesPage;
