import { AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
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
import { AdminQueryListItem } from '../components/admin/AdminQueryListItem';
import { AdminQueryDetailView } from '../components/admin/AdminQueryDetailView';
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
import {
  listAdminQueries,
  subscribeToQueries,
  type StudentQuery,
} from '../services/queryService';
import { triggerUnreadMessagesRefresh } from '../hooks/useUnreadMessages';
import { invalidateCache } from '../lib/queryCache';
import { cn } from '../lib/cn';

type MainSection = 'messages' | 'queries';
type LeftTab = 'conversations' | 'requests' | 'search';
type QueryFilter = 'pending' | 'my_assigned' | 'resolved';

export function MessagesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  // ── Top Section Switcher (Messages vs Queries) ──
  const [mainSection, setMainSection] = useState<MainSection>(() => {
    if (location.state?.section === 'queries') return 'queries';
    return 'messages';
  });

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

  // ── Admin Queries State ───────────────────────────────────────────────────
  const [queryFilter, setQueryFilter] = useState<QueryFilter>('pending');
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [isLoadingQueries, setIsLoadingQueries] = useState(false);
  const [querySearchFilter, setQuerySearchFilter] = useState('');

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

  const loadQueries = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingQueries(true);
    try {
      const list = await listAdminQueries();
      setQueries(list);
      triggerUnreadMessagesRefresh();
    } catch (err) {
      console.error('Failed to load admin queries:', err);
    } finally {
      setIsLoadingQueries(false);
    }
  }, [isAdmin]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadConversations();
    loadPendingRequests();
    if (isAdmin) {
      loadQueries();
    }
  }, [loadConversations, loadPendingRequests, loadQueries, isAdmin]);

  // Realtime subscription for queries
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = subscribeToQueries(() => {
      loadQueries();
    });
    return () => {
      unsub();
    };
  }, [isAdmin, loadQueries]);

  // ── Sync with navigation location state ────────────────────────────────────
  useEffect(() => {
    if (location.state?.section === 'queries') {
      setMainSection('queries');
    } else if (location.state?.conversationId) {
      setMainSection('messages');
      setActiveConversationId(location.state.conversationId);
      setLeftTab('conversations');
    } else if (location.state?.tab === 'search') {
      setMainSection('messages');
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
      invalidateCache('pending_requests:');
      loadPendingRequests().then(() => {
        setPendingRequests((prev) => {
          if (prev.length > 0) setLeftTab('requests');
          return prev;
        });
      });
    });

    const unsubOutgoing = subscribeToOutgoingRequests(user.id, () => {
      invalidateCache('conversations:');
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

  // Query counts and filtered queries
  const pendingQueriesCount = queries.filter((q) => q.status === 'Pending' && !q.assignedAdminId).length;
  const myAssignedQueriesCount = queries.filter(
    (q) => q.assignedAdminId === user.id && q.status !== 'Resolved'
  ).length;

  const filteredQueries = queries.filter((q) => {
    if (queryFilter === 'pending') {
      if (q.status !== 'Pending' || q.assignedAdminId) return false;
    } else if (queryFilter === 'my_assigned') {
      if (q.assignedAdminId !== user.id || q.status === 'Resolved') return false;
    } else if (queryFilter === 'resolved') {
      if (q.status !== 'Resolved') return false;
    }

    if (!querySearchFilter.trim()) return true;
    const s = querySearchFilter.toLowerCase();
    return (
      q.studentName.toLowerCase().includes(s) ||
      q.subject.toLowerCase().includes(s) ||
      q.description.toLowerCase().includes(s) ||
      q.category.toLowerCase().includes(s)
    );
  });

  const selectedQuery = queries.find((q) => q.id === selectedQueryId) || null;

  // ── Left panel content ────────────────────────────────────────────────────
  const leftContent = (
    <div className="flex h-full flex-col bg-surface">
      {/* ── Sidebar Top Header ── */}
      <div className="flex shrink-0 flex-col px-4 pt-3.5 pb-2 border-b border-card-border/70 bg-surface gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {mainSection === 'messages' ? (
                <MessageSquare className="w-4 h-4 stroke-[2.2]" />
              ) : (
                <HelpCircle className="w-4 h-4 stroke-[2.2]" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-on-surface leading-tight">
                {mainSection === 'messages' ? 'Messages' : 'Student Queries'}
              </h1>
            </div>
          </div>

          {mainSection === 'messages' && (
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
          )}
        </div>

        {/* Dedicated Admin Tabs: Messages vs Queries */}
        {isAdmin && (
          <div className="flex items-center p-1 rounded-xl bg-surface-container-high/80 border border-card-border/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMainSection('messages');
                setSelectedQueryId(null);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs',
                mainSection === 'messages'
                  ? 'bg-surface text-primary shadow-2xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <MessagesSquare className="w-3.5 h-3.5" />
              <span>Messages</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMainSection('queries');
                setActiveConversationId(null);
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer text-xs relative',
                mainSection === 'queries'
                  ? 'bg-surface text-primary shadow-2xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Queries</span>
              {pendingQueriesCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500 ring-1 ring-surface" />
                  </span>
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-2xs">
                    {pendingQueriesCount}
                  </span>
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {mainSection === 'messages' ? (
        <>
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
      </>
      ) : (
        <>
          {/* ── Sub-tabs: Pending, Assigned, Resolved ── */}
          <div className="shrink-0 px-3 pt-3 pb-2 bg-surface">
            <div className="flex items-center p-1 rounded-xl bg-surface-container-high/60 border border-card-border/60 text-xs font-medium text-on-surface-variant">
              <button
                type="button"
                onClick={() => setQueryFilter('pending')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-xs font-medium cursor-pointer relative',
                  queryFilter === 'pending'
                    ? 'bg-surface text-on-surface font-semibold shadow-2xs'
                    : 'hover:text-on-surface',
                )}
              >
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>Pending</span>
                {pendingQueriesCount > 0 && (
                  <span className="flex items-center gap-1 ml-0.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
                    </span>
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-2xs">
                      {pendingQueriesCount}
                    </span>
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setQueryFilter('my_assigned')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-xs font-medium cursor-pointer relative',
                  queryFilter === 'my_assigned'
                    ? 'bg-surface text-on-surface font-semibold shadow-2xs'
                    : 'hover:text-on-surface',
                )}
              >
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Assigned</span>
                {myAssignedQueriesCount > 0 && (
                  <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-2xs">
                    {myAssignedQueriesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setQueryFilter('resolved')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-xs font-medium cursor-pointer',
                  queryFilter === 'resolved'
                    ? 'bg-surface text-on-surface font-semibold shadow-2xs'
                    : 'hover:text-on-surface',
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Resolved</span>
              </button>
            </div>
          </div>

          {/* Search input for queries */}
          <div className="px-3 pt-1 pb-2">
            <div className="relative">
              <input
                type="text"
                value={querySearchFilter}
                onChange={(e) => setQuerySearchFilter(e.target.value)}
                placeholder="Filter queries by student, subject..."
                className="w-full rounded-xl border border-card-border/60 bg-surface-container-low py-1.5 pl-8 pr-3 text-xs text-on-surface placeholder:text-outline outline-none focus:border-primary transition-all"
              />
              <Search className="w-3.5 h-3.5 text-outline absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Query List */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1.5">
            {isLoadingQueries ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                  <HelpCircle className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface tracking-tight">
                    {queryFilter === 'pending'
                      ? 'No Pending Queries'
                      : queryFilter === 'my_assigned'
                      ? 'No Assigned Queries'
                      : 'No Resolved Queries'}
                  </p>
                  <p className="mt-1 text-[11px] text-on-surface-variant max-w-[190px] leading-relaxed">
                    {queryFilter === 'pending'
                      ? 'All student queries have been claimed or resolved.'
                      : queryFilter === 'my_assigned'
                      ? 'You do not have any open queries assigned to you.'
                      : 'Resolved queries will be archived here for reference.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredQueries.map((q) => (
                <AdminQueryListItem
                  key={q.id}
                  query={q}
                  isSelected={selectedQueryId === q.id}
                  onClick={() => setSelectedQueryId(q.id)}
                />
              ))
            )}
          </div>
        </>
      )}
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

  // ── High-End Query Empty State ──
  const queryEmptyState = (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center bg-surface">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm ring-8 ring-primary/5">
          <HelpCircle className="w-9 h-9 stroke-[1.8]" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-low border border-card-border text-primary shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </div>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
        Student Query Management
      </h2>
      <p className="mt-2 max-w-md text-xs sm:text-sm text-on-surface-variant leading-relaxed">
        Review submitted student help and academic queries. Claim a pending query to take ownership, converse with the student, and resolve their issue.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full text-left">
        <div className="rounded-xl border border-card-border/70 bg-surface-container-low/70 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-amber-500">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold text-on-surface">Pending Requests</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            {pendingQueriesCount} new ticket{pendingQueriesCount === 1 ? '' : 's'} awaiting admin assignment.
          </p>
        </div>

        <div className="rounded-xl border border-card-border/70 bg-surface-container-low/70 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold text-on-surface">My Assigned</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            {myAssignedQueriesCount} active ticket{myAssignedQueriesCount === 1 ? '' : 's'} assigned to you.
          </p>
        </div>

        <div className="rounded-xl border border-card-border/70 bg-surface-container-low/70 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-emerald-500">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold text-on-surface">Concurrency Safe</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            First-claim protection prevents double handling across administrators.
          </p>
        </div>
      </div>
    </div>
  );

  // ── Unified Responsive Layout (Single Mount, No Duplicate Channels) ──
  const hasActiveItem = mainSection === 'messages' ? !!activeConversationId : !!selectedQueryId;

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface">
      {/* Left Sidebar: Visible on desktop (w-80) or on mobile when no item is active */}
      <aside
        className={cn(
          'h-full w-full lg:w-80 shrink-0 flex-col border-r border-card-border/70 bg-surface transition-all',
          hasActiveItem ? 'hidden lg:flex' : 'flex',
        )}
      >
        {leftContent}
      </aside>

      {/* Right Content Area: Visible on desktop or on mobile when item is active */}
      <main
        className={cn(
          'flex-1 h-full min-w-0 bg-surface flex flex-col',
          hasActiveItem ? 'flex' : 'hidden lg:flex',
        )}
      >
        {mainSection === 'messages' ? (
          activeConversation ? (
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
          )
        ) : selectedQuery ? (
          <AdminQueryDetailView
            query={selectedQuery}
            currentAdminId={user.id}
            currentAdminName={user.name}
            onBack={() => setSelectedQueryId(null)}
            onQueryUpdated={() => loadQueries()}
          />
        ) : (
          queryEmptyState
        )}
      </main>
    </div>
  );
}

export default MessagesPage;
