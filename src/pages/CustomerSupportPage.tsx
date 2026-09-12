import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Phone,
  Search,
  Send,
  UserCheck,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/cn';
import {
  SUPPORT_CATEGORIES,
  FAQ_LIST,
  createSupportTicket,
  type SupportTicket,
} from '../services/supportService';

export function CustomerSupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'ticket' | 'faq'>('ticket');

  // Form state
  const [category, setCategory] = useState<string>(SUPPORT_CATEGORIES[0]);
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);

  // FAQ state
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return FAQ_LIST;
    const q = faqSearch.toLowerCase().trim();
    return FAQ_LIST.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [faqSearch]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    try {
      const ticket = await createSupportTicket({
        userId: user?.id || 'guest',
        userName: user?.name || 'Student',
        userEmail: user?.email || '',
        userPhone: phone.trim(),
        category,
        priority: 'normal',
        subject,
        message,
      });

      setSubmittedTicket(ticket);
      setSubject('');
      setMessage('');
      setPhone('');
      setCategory(SUPPORT_CATEGORIES[0]);
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedTicket(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      {/* ── Top Navigation / Back ── */}
      <div className="mb-6 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>
      </div>

      {/* ── Clean Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          Customer Support Center
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant leading-relaxed max-w-2xl">
          Need assistance with document approvals, study materials, or account inquiries?
          Our academic support team is ready to help you succeed.
        </p>
      </div>

      {/* ── Segmented Tab Switcher ── */}
      <div className="mb-8 flex border-b border-card-border">
        <button
          type="button"
          onClick={() => setActiveTab('ticket')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all cursor-pointer',
            activeTab === 'ticket'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          )}
        >
          <Send size={15} />
          <span>Feedback & Queries</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faq')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all cursor-pointer',
            activeTab === 'faq'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          )}
        >
          <HelpCircle size={15} />
          <span>Student FAQs</span>
        </button>
      </div>

      {/* ── Tab 1: Feedback & Queries ── */}
      {activeTab === 'ticket' && (
        <div>
          {submittedTicket ? (
            /* Clean Developer-Style Confirmation Card */
            <Card className="p-8 sm:p-10 text-center border-card-border shadow-xs bg-surface-container-low/40">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4 shadow-2xs">
                <CheckCircle2 size={24} strokeWidth={2.2} />
              </div>

              <h2 className="text-xl font-bold tracking-tight text-on-surface">
                Query Received
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                Thanks for reaching out! Our team has received your query and will review it shortly.
              </p>

              {/* Minimal summary pill card */}
              <div className="mt-6 mx-auto max-w-sm rounded-xl border border-card-border/70 bg-surface-container/60 p-3.5 text-left text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-medium">Category</span>
                  <span className="font-semibold text-on-surface">{submittedTicket.category}</span>
                </div>
                {submittedTicket.userPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant font-medium">Contact Mobile</span>
                    <span className="font-semibold text-on-surface font-mono">{submittedTicket.userPhone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-medium">Subject</span>
                  <span className="font-semibold text-on-surface truncate max-w-[200px]">{submittedTicket.subject}</span>
                </div>
              </div>

              {/* Single clean action button */}
              <div className="mt-7 flex justify-center">
                <Button variant="primary" size="sm" onClick={handleResetForm} className="px-6 py-2.5 text-xs font-semibold">
                  Submit Another Query
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 sm:p-8 border-card-border shadow-xs">
              <form onSubmit={handleSubmitTicket} className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-on-surface">Feedback & Queries</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Fill out the details below and an academic moderator or admin will review your inquiry.
                  </p>
                </div>

                {/* Requester profile line */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-xl border border-card-border/80 bg-surface-container/50 px-4 py-3 text-xs">
                  <div className="flex items-center gap-2 text-on-surface">
                    <UserCheck size={15} className="text-primary shrink-0" />
                    <span className="font-medium">
                      Submitting as: <strong className="font-semibold text-on-surface">{user?.name || 'Student'}</strong>
                    </span>
                  </div>
                  <span className="text-on-surface-variant font-mono text-[11px]">
                    {user?.email || 'Registered Student'}
                  </span>
                </div>

                {/* Mobile Number */}
                <div>
                  <label htmlFor="ticket-phone" className="block text-xs font-semibold text-on-surface mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      size={14}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                    />
                    <input
                      id="ticket-phone"
                      type="tel"
                      required
                      placeholder="e.g., +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-card-border bg-surface-container pl-9 pr-3.5 py-2.5 text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-colors font-mono"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    Admins will contact you directly via this mobile number or email regarding your query.
                  </p>
                </div>

                {/* Category select */}
                <div>
                  <label htmlFor="ticket-category" className="block text-xs font-semibold text-on-surface mb-1.5">
                    Inquiry Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="ticket-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-card-border bg-surface-container px-3.5 py-2.5 pr-10 text-xs font-medium text-on-surface focus:border-primary focus:outline-none transition-colors cursor-pointer"
                    >
                      {SUPPORT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="ticket-subject" className="block text-xs font-semibold text-on-surface mb-1.5">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ticket-subject"
                    type="text"
                    required
                    placeholder="e.g., Question regarding Operating Systems lecture notes verification"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-surface-container px-3.5 py-2.5 text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="ticket-message" className="block text-xs font-semibold text-on-surface mb-1.5">
                    Describe Your Issue or Request <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="ticket-message"
                    rows={6}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide as much context as possible (document title, semester, error description, or specific questions)..."
                    className="w-full rounded-xl border border-card-border bg-surface-container p-3.5 text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>

                {/* Submit action */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || !subject.trim() || !message.trim() || !phone.trim()}
                    className="px-6 py-2.5 text-xs font-semibold"
                  >
                    <Send size={14} className="mr-1.5" />
                    <span>{isSubmitting ? 'Submitting Query...' : 'Submit Query'}</span>
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab 2: FAQ ── */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          {/* FAQ Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search frequently asked questions..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full rounded-xl border border-card-border bg-surface-container pl-10 pr-10 py-2.5 text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
            />
            {faqSearch && (
              <button
                type="button"
                onClick={() => setFaqSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 rounded cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* FAQ Accordions */}
          <div className="space-y-2.5">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-card-border bg-surface-container-low overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="flex w-full items-center justify-between p-4 text-left cursor-pointer hover:bg-surface-container/40 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-on-surface pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        'text-on-surface-variant transition-transform duration-200 shrink-0',
                        isOpen && 'rotate-180 text-primary'
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-card-border/60 p-4 pt-3 text-xs text-on-surface-variant leading-relaxed bg-surface-container-lowest">
                          <p>{faq.answer}</p>
                          <div className="mt-2 text-[10px] font-semibold text-primary uppercase tracking-wider">
                            Topic: {faq.category}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="py-12 text-center text-xs text-on-surface-variant">
                No matching questions found for &ldquo;{faqSearch}&rdquo;. You can submit a ticket in the other tab.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerSupportPage;

