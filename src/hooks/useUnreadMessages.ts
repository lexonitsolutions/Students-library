import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export function triggerUnreadMessagesRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('refresh_unread_messages'));
  }
}

export function useUnreadMessages() {
  const { user, isExploring } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [pendingQueriesCount, setPendingQueriesCount] = useState<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id || isExploring) {
      setUnreadCount(0);
      setPendingQueriesCount(0);
      return;
    }

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

      setPendingQueriesCount(adminPendingQueries);
      setUnreadCount(unreadMsgCount + totalPending + adminPendingQueries);
    } catch (err) {
      console.warn('Failed to fetch unread messages count:', err);
    }
  }, [user?.id, user?.role, isExploring]);

  useEffect(() => {
    fetchUnreadCount();

    if (!user?.id || isExploring) return;

    // Listen to manual dispatch events
    window.addEventListener('refresh_unread_messages', fetchUnreadCount);

    // Subscribe to messages changes
    const msgChannelName = `global_unread_msgs_${user.id}_${Math.random().toString(36).substring(2, 7)}`;
    const msgChannel = supabase
      .channel(msgChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        fetchUnreadCount,
      )
      .subscribe();

    // Subscribe to message_requests changes (when a student sends a request to user)
    const reqChannelName = `global_unread_reqs_${user.id}_${Math.random().toString(36).substring(2, 7)}`;
    const reqChannel = supabase
      .channel(reqChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        fetchUnreadCount,
      )
      .subscribe();

    // Subscribe to student_queries changes for admins
    let queryChannel: ReturnType<typeof supabase.channel> | null = null;
    if (user.role === 'admin') {
      const queryChannelName = `global_unread_queries_${user.id}_${Math.random().toString(36).substring(2, 7)}`;
      queryChannel = supabase
        .channel(queryChannelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'student_queries' },
          fetchUnreadCount,
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener('refresh_unread_messages', fetchUnreadCount);
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(reqChannel);
      if (queryChannel) {
        supabase.removeChannel(queryChannel);
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
