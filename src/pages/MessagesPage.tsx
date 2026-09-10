import { AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Inbox,
  Loader2,
  Lock,
  MessageSquare,
  MessagesSquare,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ChatView } from '../components/messages/ChatView';
import { ConversationListItem } from '../components/messages/ConversationListItem';
import { IncomingRequestCard } from '../components/messages/IncomingRequestCard';
import { UserSearchPanel } from '../components/messages/UserSearchPanel';
import {
  listPendingRequests,
  acceptRequest,
  rejectRequest,
  subscribeToIncomingRequests,
  subscribeToOutgoingRequests,
  type MessageRequest,
} from '../services/messageRequestService';
import {
  listConversations,
  getConversationById,
  type Conversation,
  type ChatMessage,
} from '../services/messagesService';
import { triggerUnreadMessagesRefresh } from '../hooks/useUnreadMessages';
import { cn } from '../lib/cn';

type LeftTab = 'conversations' | 'requests' | 'search';

export function MessagesPage() {
  const { user } = useAuth();
  const location = useLocation();

  // ── State ─────────────────────────────────────────────────────────────────
  const [leftTab, setLeftTab] = useState<LeftTab>(() => {
    if (location.state?.tab === 'search') return 'search';
    return 'conversations';
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pendingRequests, setPendingRequests] = useState<MessageRequest[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    location.state?.conversationId ?? null,
  );
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const prevConvCount = useRef(conversations.length);

  // ── Data loaders ───────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingConvs(true);
    try {
      const convs = await listConversations(user.id);
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConvs(false);
    }
  }, [user?.id]);

  const loadPendingRequests = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingRequests(true);
    try {
      const reqs = await listPendingRequests(user.id);
      setPendingRequests(reqs);
    } catch (err) {
      console.error('Failed to load pending requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [user?.id]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadConversations();
    loadPendingRequests();
  }, [loadConversations, loadPendingRequests]);

  // ── Sync with navigation location state ────────────────────────────────────
  useEffect(() => {
    if (location.state?.conversationId) {
      setActiveConversationId(location.state.conversationId);
      setLeftTab('conversations');
    } else if (location.state?.tab === 'search') {
      setLeftTab('search');
    }
  }, [location.state]);

  // ── Active conversation enrichment ─────────────────────────────────────────
  useEffect(() => {
    if (!activeConversationId) {
      setActiveConversation(null);
      return;
    }

    const local = conversations.find((c) => c.id === activeConversationId);
    if (local) {
      setActiveConversation(local);
      return;
    }

    if (user?.id) {
      getConversationById(activeConversationId, user.id).then((c) => {
        if (c) setActiveConversation(c);
      });
    }
  }, [activeConversationId, conversations, user?.id]);

  // ── Realtime subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const unsubIncoming = subscribeToIncomingRequests(user.id, () => {
      loadPendingRequests().then(() => {
        setPendingRequests((prev) => {
          if (prev.length > 0) setLeftTab('requests');
          return prev;
        });
      });
    });

    const unsubOutgoing = subscribeToOutgoingRequests(user.id, () => {
      loadConversations();
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, [user?.id, loadPendingRequests, loadConversations]);

  useEffect(() => {
    if (conversations.length > prevConvCount.current) {
      setLeftTab('conversations');
    }
    prevConvCount.current = conversations.length;
  }, [conversations.length]);

  // ── Accept / Reject handlers ───────────────────────────────────────────────
  const handleAcceptRequest = useCallback(
    async (requestId: string) => {
      if (!user) return;
      try {
        const result = await acceptRequest(requestId, user.name);
        if (result.success) {
          // Remove from pending list
          setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));

          // Reload conversation list
          const convs = await listConversations(user.id);
          setConversations(convs);

          // If conversation was created, activate it immediately
          if (result.conversationId) {
            const matched = convs.find((c) => c.id === result.conversationId);
            if (matched) {
              setActiveConversation(matched);
            } else {
              const fetched = await getConversationById(result.conversationId, user.id);
              if (fetched) setActiveConversation(fetched);
            }
            setActiveConversationId(result.conversationId);
            setLeftTab('conversations');
          }
          triggerUnreadMessagesRefresh();
        }
      } catch (err) {
        console.error('Failed to accept request:', err);
      }
    },
    [user],
  );

  const handleRejectRequest = useCallback(
    async (requestId: string) => {
      if (!user) return;
      try {
        const result = await rejectRequest(requestId, user.name);
        if (result.success) {
          setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
          triggerUnreadMessagesRefresh();
        }
      } catch (err) {
        console.error('Failed to reject request:', err);
      }
    },
    [user],
  );

  const handleSelectConversation = (convId: string) => {
    setActiveConversationId(convId);
  };

  const handleDeleteConversation = useCallback((deletedConvId: string) => {
    setActiveConversationId(null);
    setActiveConversation(null);
    setConversations((prev) => prev.filter((c) => c.id !== deletedConvId));
    triggerUnreadMessagesRefresh();
  }, []);

  const handleClearChat = useCallback((convId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: undefined,
              lastMessageAt: undefined,
              unreadCount: 0,
            }
          : c,
      ),
    );
    setActiveConversation((prev) =>
      prev && prev.id === convId
        ? {
            ...prev,
            lastMessage: undefined,
            lastMessageAt: undefined,
            unreadCount: 0,
          }
        : prev,
    );
  }, []);

  const handleMessagesChanged = useCallback(
    (convId: string, updatedMessages: ChatMessage[]) => {
      const last = updatedMessages[updatedMessages.length - 1];
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                lastMessage: last?.body,
                lastMessageAt: last?.createdAt,
                unreadCount: 0,
              }
            : c,
        ),
      );
    },
    [],
  );

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center bg-surface">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Filter conversations for inline search in the chats tab
  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const name = c.otherUser?.name?.toLowerCase() ?? '';
    const quickId = c.otherUser?.quickId ?? '';
    return name.includes(q) || quickId.includes(q);
  });

  // ── Left panel content ────────────────────────────────────────────────────
  const leftContent = (
    <div className="flex h-full flex-col bg-surface">
      {/* ── Sidebar Top Header ── */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3.5 border-b border-card-border/70 bg-surface">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-on-surface leading-tight">
              Messages
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLeftTab('search')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs',
            leftTab === 'search'
              ? 'bg-primary text-white'
              : 'bg-surface-container-high/80 text-on-surface-variant hover:text-primary hover:bg-primary/10 border border-card-border/60',
          )}
          title="Find Student"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>

      {/* ── Sleek Segmented Control Tabs ── */}
      <div className="shrink-0 px-3 pt-3 pb-2 bg-surface">
        <div className="flex items-center p-1 rounded-xl bg-surface-container-high/60 border border-card-border/60 text-xs font-medium text-on-surface-variant">
          <button
            type="button"
            onClick={() => setLeftTab('conversations')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-xs font-medium cursor-pointer',
              leftTab === 'conversations'
                ? 'bg-surface text-on-surface font-semibold shadow-2xs'
                : 'hover:text-on-surface',
            )}
          >
            <MessagesSquare className="w-3.5 h-3.5" />
            <span>Chats</span>
            {conversations.length > 0 && (
              <span className="ml-0.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded-full">
                {conversations.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setLeftTab('requests')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-xs font-medium cursor-pointer relative',
              leftTab === 'requests'
                ? 'bg-surface text-on-surface font-semibold shadow-2xs'
                : 'hover:text-on-surface',
            )}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Requests</span>
            {pendingRequests.length > 0 && (
              <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-2xs">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setLeftTab('search')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-xs font-medium cursor-pointer',
              leftTab === 'search'
                ? 'bg-surface text-on-surface font-semibold shadow-2xs'
                : 'hover:text-on-surface',
            )}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find ID</span>
          </button>
        </div>
      </div>

      {/* ── Tab body ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {leftTab === 'conversations' && (
          <div className="flex flex-col gap-2">
            {conversations.length > 3 && (
              <div className="relative mb-1">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter chats..."
                  className="w-full rounded-xl border border-card-border/60 bg-surface-container-low py-1.5 pl-8 pr-3 text-xs text-on-surface placeholder:text-outline outline-none focus:border-primary transition-all"
                />
                <Search className="w-3.5 h-3.5 text-outline absolute left-2.5 top-2.5" />
              </div>
            )}

            {isLoadingConvs ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessagesSquare className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface tracking-tight">No Active Chats</p>
                  <p className="mt-1 text-[11px] text-on-surface-variant max-w-[190px] leading-relaxed">
                    Search a student by their 9-digit Student ID to request a conversation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLeftTab('search')}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Find a student</span>
                </button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                No matching conversations.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conv) => (
                  <ConversationListItem
                    key={conv.id}
                    conversation={conv}
                    isActive={activeConversationId === conv.id}
                    currentUserId={user.id}
                    onClick={handleSelectConversation}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {leftTab === 'requests' && (
          <div className="flex flex-col gap-3">
            {isLoadingRequests ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                  <Inbox className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface tracking-tight">Inbox Clean</p>
                  <p className="mt-1 text-[11px] text-on-surface-variant max-w-[190px] leading-relaxed">
                    You have no pending message requests. When classmates request to chat, they will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {pendingRequests.map((req) => (
                  <IncomingRequestCard
                    key={req.id}
                    request={req}
                    onAccept={handleAcceptRequest}
                    onReject={handleRejectRequest}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        )}

        {leftTab === 'search' && (
          <div className="py-1">
            <UserSearchPanel
              currentUser={user}
              initialQuickId={location.state?.quickId}
              onRequestAccepted={(convId) => {
                setActiveConversationId(convId);
                setLeftTab('conversations');
                loadConversations();
              }}
              onRequestSent={() => {
                // Keep search active
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  // ── High-End Empty State ──
  const emptyState = (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center bg-surface">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm ring-8 ring-primary/5">
          <MessageSquare className="w-9 h-9 stroke-[1.8]" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-low border border-card-border text-primary shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
        Peer-to-Peer Student Messaging
      </h2>
      <p className="mt-2 max-w-md text-xs sm:text-sm text-on-surface-variant leading-relaxed">
        Connect with classmates for academic discussions, exam preparation, and study collaboration in a secure, request-gated environment.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full text-left">
        <div className="rounded-xl border border-card-border/70 bg-surface-container-low/70 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold text-on-surface">Verified Peers</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Search classmates securely via their canonical 9-digit Student ID.
          </p>
        </div>

        <div className="rounded-xl border border-card-border/70 bg-surface-container-low/70 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-emerald-500">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold text-on-surface">Request-Gated</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Spam-free: Recipient must explicitly accept before any messages unlock.
          </p>
        </div>

        <div className="rounded-xl border border-card-border/70 bg-surface-container-low/70 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-amber-500">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-bold text-on-surface">Realtime Sync</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Instant delivery, live typing status, and read receipts.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={() => setLeftTab('search')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-all shadow-xs hover:shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Find a Student by ID</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </div>
  );

  // ── Unified Responsive Layout (Single Mount, No Duplicate Channels) ──
  return (
    <div className="flex h-full w-full overflow-hidden bg-surface">
      {/* Left Sidebar: Visible on desktop (w-80) or on mobile when no chat is open */}
      <aside
        className={cn(
          'h-full w-full lg:w-80 shrink-0 flex-col border-r border-card-border/70 bg-surface transition-all',
          activeConversationId ? 'hidden lg:flex' : 'flex',
        )}
      >
        {leftContent}
      </aside>

      {/* Right Chat Area: Visible on desktop or on mobile when chat is open */}
      <main
        className={cn(
          'flex-1 h-full min-w-0 bg-surface flex flex-col',
          activeConversationId ? 'flex' : 'hidden lg:flex',
        )}
      >
        {activeConversation ? (
          <ChatView
            conversation={activeConversation}
            currentUserId={user.id}
            currentUserName={user.name}
            currentUserAvatar={user.avatar}
            onBack={() => {
              setActiveConversationId(null);
              setActiveConversation(null);
            }}
            onDeleteConversation={handleDeleteConversation}
            onClearChat={handleClearChat}
            onMessagesChanged={handleMessagesChanged}
          />
        ) : (
          emptyState
        )}
      </main>
    </div>
  );
}

export default MessagesPage;
