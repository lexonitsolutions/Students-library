import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  GraduationCap,
  Hash,
  Loader2,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { RequestStatusBanner } from './RequestStatusBanner';
import {
  findUserByQuickId,
  sendRequest,
  cancelRequest,
  getRequestStatus,
  startDirectAdminConversation,
  type PublicProfile,
  type MessageRequestStatus,
} from '../../services/messageRequestService';
import type { User } from '../../data/types';

interface Props {
  readonly currentUser: User;
  readonly onRequestAccepted?: (conversationId: string) => void;
  readonly onRequestSent?: () => void;
  readonly initialQuickId?: string;
}

interface SearchState {
  phase: 'idle' | 'searching' | 'found' | 'not_found' | 'error';
  profile: PublicProfile | null;
  requestStatus: MessageRequestStatus | null;
  requestId: string | null;
}

export function UserSearchPanel({ currentUser, onRequestAccepted, onRequestSent, initialQuickId }: Props) {
  const [query, setQuery] = useState(initialQuickId ?? '');
  const [isSending, setIsSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState<SearchState>({
    phase: 'idle',
    profile: null,
    requestStatus: null,
    requestId: null,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Search by Quick ID ─────────────────────────────────────────────────────
  const executeSearch = useCallback(
    async (rawQuery: string) => {
      const cleaned = rawQuery.trim().replace(/\D/g, '');
      if (!cleaned || cleaned.length < 5) return;

      setSearch({ phase: 'searching', profile: null, requestStatus: null, requestId: null });

      try {
        const profile = await findUserByQuickId(cleaned, currentUser.id);
        if (!profile) {
          setSearch({ phase: 'not_found', profile: null, requestStatus: null, requestId: null });
          return;
        }

        const existing = await getRequestStatus(currentUser.id, profile.id);
        setSearch({
          phase: 'found',
          profile,
          requestStatus: existing?.status ?? null,
          requestId: existing?.id ?? null,
        });
      } catch {
        setSearch({ phase: 'not_found', profile: null, requestStatus: null, requestId: null });
      }
    },
    [currentUser.id],
  );

  useEffect(() => {
    if (initialQuickId) {
      const numericOnly = initialQuickId.replace(/\D/g, '');
      if (numericOnly.length >= 5) {
        setQuery(numericOnly);
        executeSearch(numericOnly);
      }
    }
  }, [initialQuickId, executeSearch]);

  const handleQueryChange = (value: string) => {
    const numericOnly = value.replace(/\D/g, '');
    setQuery(numericOnly);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (numericOnly.length === 9) {
      debounceRef.current = setTimeout(() => executeSearch(numericOnly), 300);
    } else if (!numericOnly) {
      setSearch({ phase: 'idle', profile: null, requestStatus: null, requestId: null });
    }
  };

  // ── Send request ───────────────────────────────────────────────────────────
  const handleSendRequest = async () => {
    if (!search.profile || isSending) return;
    setIsSending(true);

    const result = await sendRequest({
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      fromUserAvatar: currentUser.avatar,
      fromUserQuickId: currentUser.quickId ?? '',
      toUserId: search.profile.id,
      toUserName: search.profile.name,
      toUserQuickId: search.profile.quickId,
    });

    setIsSending(false);

    if (result.success) {
      setSearch((prev) => ({
        ...prev,
        requestStatus: 'pending',
        requestId: result.requestId ?? null,
      }));
      onRequestSent?.();
      showToast('Message request sent successfully');
    } else {
      showToast(result.reason ?? 'Unable to send request');
    }
  };

  // ── Cancel request ─────────────────────────────────────────────────────────
  const handleCancelRequest = async () => {
    if (!search.requestId || !search.profile || isCancelling) return;
    setIsCancelling(true);

    await cancelRequest(search.requestId, search.profile.id, currentUser.quickId ?? '');
    setSearch((prev) => ({ ...prev, requestStatus: null, requestId: null }));
    setIsCancelling(false);
    showToast('Request withdrawn');
  };

  const isMainAdmin = currentUser.email?.toLowerCase() === 'hr@lexonit.com';

  // ── Direct message for main admin ──────────────────────────────────────────
  const handleDirectMessage = async () => {
    if (!search.profile || isSending) return;
    setIsSending(true);

    try {
      const result = await startDirectAdminConversation({
        adminId: currentUser.id,
        studentId: search.profile.id,
      });

      setIsSending(false);

      if (result.success && result.conversationId) {
        showToast('Direct chat opened');
        onRequestAccepted?.(result.conversationId);
      } else {
        showToast(result.reason ?? 'Failed to open direct chat');
      }
    } catch (err: any) {
      setIsSending(false);
      showToast(err?.message ?? 'Failed to connect');
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearch({ phase: 'idle', profile: null, requestStatus: null, requestId: null });
  };

  const profile = search.profile;

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input Container */}
      <div className="relative">
        <label className="block mb-1.5 text-xs font-semibold text-on-surface-variant">
          Find Student by ID
        </label>
        <div className="relative flex items-center rounded-xl border border-card-border bg-surface-container-low focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all shadow-2xs">
          <div className="pl-3 text-on-surface-variant pointer-events-none">
            <Search className="w-4 h-4 text-outline" />
          </div>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeSearch(query)}
            placeholder="Enter 9-digit ID (e.g. 123456789)"
            maxLength={9}
            className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm font-medium text-on-surface placeholder:text-outline/70 outline-none"
          />

          <div className="flex items-center gap-1 pr-1.5">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                aria-label="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => executeSearch(query)}
              disabled={query.trim().length < 5 || search.phase === 'searching'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs shrink-0"
            >
              {search.phase === 'searching' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Find</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security notice hint / Admin Notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-relaxed text-on-surface-variant">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          {isMainAdmin ? (
            <>
              <span className="font-semibold text-on-surface">Direct Administrator Messaging:</span> As the main administrator, you can directly message any student without requiring a message request.
            </>
          ) : (
            <>
              <span className="font-semibold text-on-surface">Recipient Acceptance Required:</span> The student must explicitly accept your request before you can exchange messages.
            </>
          )}
        </div>
      </div>

      {/* Results / Status card */}
      <AnimatePresence mode="wait">
        {search.phase === 'not_found' && (
          <motion.div
            key="notfound"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl border border-card-border bg-surface-container-low p-5 text-center shadow-2xs"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant mb-2.5">
              <UserX className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-on-surface">No Student Found</p>
            <p className="mt-1 text-[11px] text-on-surface-variant max-w-[200px] mx-auto leading-relaxed">
              Verify the 9-digit Student ID. The user's profile must be active and public.
            </p>
          </motion.div>
        )}

        {search.phase === 'found' && profile && (
          <motion.div
            key="found"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl border border-card-border bg-surface-container-low p-4 shadow-xs"
          >
            {/* Student profile header */}
            <div className="flex items-start gap-3 mb-3.5">
              <div className="relative shrink-0">
                <Avatar
                  name={profile.name}
                  src={profile.avatar_url ?? undefined}
                  size={46}
                  className="rounded-full ring-2 ring-primary/20"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-bold text-on-surface tracking-tight truncate">
                    {profile.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <Sparkles className="w-2.5 h-2.5" />
                    Verified
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                    <Hash className="w-3 h-3" />
                    {profile.quickId}
                  </span>
                </div>

                {(profile.university || profile.college) && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-on-surface-variant truncate">
                    <GraduationCap className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                    <span className="truncate">{profile.university ?? profile.college}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Request action state */}
            <div className="pt-2 border-t border-card-border/60">
              {isMainAdmin ? (
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  icon={
                    isSending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )
                  }
                  onClick={handleDirectMessage}
                  disabled={isSending}
                >
                  {isSending ? 'Connecting Chat…' : 'Send Message'}
                </Button>
              ) : (
                <>
                  {search.requestStatus === null && (
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      icon={
                        isSending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5" />
                        )
                      }
                      onClick={handleSendRequest}
                      disabled={isSending}
                    >
                      {isSending ? 'Sending Request…' : 'Send Message Request'}
                    </Button>
                  )}

                  {search.requestStatus === 'pending' && (
                    <div className="flex flex-col gap-2.5">
                      <RequestStatusBanner status="pending" otherUserName={profile.name} />
                      <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        onClick={handleCancelRequest}
                        disabled={isCancelling}
                        className="text-error hover:text-error hover:bg-error/10 text-xs"
                      >
                        {isCancelling ? 'Withdrawing…' : 'Withdraw Request'}
                      </Button>
                    </div>
                  )}

                  {search.requestStatus === 'accepted' && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Connected. You can message this student from the Chats tab.</span>
                    </div>
                  )}

                  {search.requestStatus === 'rejected' && (
                    <RequestStatusBanner status="rejected" otherUserName={profile.name} />
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs font-medium text-center shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserSearchPanel;
