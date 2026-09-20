import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

// Module-level shared cache to prevent duplicate queries across components (Sidebar + MobileDrawer)
let sharedUnreadCount = 0;
let sharedPendingQueriesCount = 0;
let lastFetchedTime = 0;
let inFlightFetch: Promise<void> | null = null;
const FETCH_COOLDOWN_MS = 5000; // 5 seconds cooldown

// Module-level singleton channels and subscriber count
let activeUserChannelId: string | null = null;
let activeMsgChannel: ReturnType<typeof supabase.channel> | null = null;
let activeReqChannel: ReturnType<typeof supabase.channel> | null = null;
let activeQueryChannel: ReturnType<typeof supabase.channel> | null = null;
let subscriberCount = 0;

export function triggerUnreadMessagesRefresh() {
  lastFetchedTime = 0; // force refresh
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('refresh_unread_messages'));
  }
}

export function useUnreadMessages() {
  const { user, isExploring } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(() => sharedUnreadCount);
  const [pendingQueriesCount, setPendingQueriesCount] = useState<number>(() => sharedPendingQueriesCount);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id || isExploring) {
      setUnreadCount(0);
      setPendingQueriesCount(0);
      return;
    }

    const now = Date.now();
    if (now - lastFetchedTime < FETCH_COOLDOWN_MS) {
      setUnreadCount(sharedUnreadCount);
      setPendingQueriesCount(sharedPendingQueriesCount);
      return;
    }

    if (inFlightFetch) {
      try {
        await inFlightFetch;
      } catch {
        // ignore
      }
      setUnreadCount(sharedUnreadCount);
      setPendingQueriesCount(sharedPendingQueriesCount);
      return;
    }

    inFlightFetch = (async () => {
      try {
        // 1. Get all conversations the user is a participant in
        const { data: convs, error: convError } = await supabase
          .from('conversations')
          .select('id')
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

        let unreadMsgCount = 0;
        if (!convError && convs && convs.length > 0) {
          const convIds = convs.map((c) => c.id);

          const { count, error: countError } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', convIds)
            .neq('sender_id', user.id)
            .is('read_at', null);

          if (!countError && count !== null) {
            unreadMsgCount = count;
          }
        }

        // 2. Also count pending incoming message requests
        const { count: pendingCount, error: reqError } = await supabase
          .from('message_requests')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('status', 'pending');

        const totalPending = !reqError && pendingCount !== null ? pendingCount : 0;

        // 3. For Admins: count received student queries waiting in 'Pending' queue
        let adminPendingQueries = 0;
        if (user.role === 'admin') {
          const { count: queryCount, error: queryErr } = await supabase
            .from('student_queries')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'Pending')
            .is('assigned_admin_id', null);

          if (!queryErr && queryCount !== null) {
            adminPendingQueries = queryCount;
          } else {
            // Local storage cache fallback
            try {
              const raw =
                localStorage.getItem('studexa.admin_queries_cache') ||
                localStorage.getItem('quicklearnit.admin_queries_cache');
              if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  adminPendingQueries = parsed.filter(
                    (q: { status: string; assignedAdminId?: string | null }) =>
                      q.status === 'Pending' && !q.assignedAdminId
                  ).length;
                }
              }
            } catch {
              // ignore
            }
          }
        }

        sharedPendingQueriesCount = adminPendingQueries;
        sharedUnreadCount = unreadMsgCount + totalPending + adminPendingQueries;
        lastFetchedTime = Date.now();
      } catch (err) {
        console.warn('Failed to fetch unread messages count:', err);
      } finally {
        inFlightFetch = null;
      }
    })();

    try {
      await inFlightFetch;
    } catch {
      // ignore
    }
    setPendingQueriesCount(sharedPendingQueriesCount);
    setUnreadCount(sharedUnreadCount);
  }, [user?.id, user?.role, isExploring]);

  useEffect(() => {
    fetchUnreadCount();

    if (!user?.id || isExploring) return;

    const handleRealtimeChange = () => {
      lastFetchedTime = 0;
      fetchUnreadCount();
    };

    // Listen to manual dispatch events
    window.addEventListener('refresh_unread_messages', handleRealtimeChange);

    subscriberCount++;

    // Establish singleton channels for this user only once across all components
    if (activeUserChannelId !== user.id) {
      if (activeMsgChannel) supabase.removeChannel(activeMsgChannel);
      if (activeReqChannel) supabase.removeChannel(activeReqChannel);
      if (activeQueryChannel) supabase.removeChannel(activeQueryChannel);

      activeUserChannelId = user.id;

      activeMsgChannel = supabase
        .channel(`global_unread_msgs_${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages' },
          handleRealtimeChange,
        )
        .subscribe();

      activeReqChannel = supabase
        .channel(`global_unread_reqs_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'message_requests',
            filter: `receiver_id=eq.${user.id}`,
          },
          handleRealtimeChange,
        )
        .subscribe();

      if (user.role === 'admin') {
        activeQueryChannel = supabase
          .channel(`global_unread_queries_${user.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'student_queries' },
            handleRealtimeChange,
          )
          .subscribe();
      }
    }

    return () => {
      window.removeEventListener('refresh_unread_messages', handleRealtimeChange);
      subscriberCount--;
      if (subscriberCount <= 0) {
        subscriberCount = 0;
        activeUserChannelId = null;
        if (activeMsgChannel) {
          supabase.removeChannel(activeMsgChannel);
          activeMsgChannel = null;
        }
        if (activeReqChannel) {
          supabase.removeChannel(activeReqChannel);
          activeReqChannel = null;
        }
        if (activeQueryChannel) {
          supabase.removeChannel(activeQueryChannel);
          activeQueryChannel = null;
        }
      }
    };
  }, [user?.id, user?.role, isExploring, fetchUnreadCount]);

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
    hasPendingQueries: pendingQueriesCount > 0,
    pendingQueriesCount,
    refresh: fetchUnreadCount,
  };
}
