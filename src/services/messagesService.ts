import { supabase } from '../lib/supabaseClient';
import type { ConversationRow, MessageRow } from '../types/database.types';
import { generateQuickId } from '../lib/idUtils';
import type { PublicProfile } from './messageRequestService';

// ─── Public types ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly senderId: string;
  readonly body: string;
  readonly createdAt: string;
  readonly readAt: string | null;
}

export interface Conversation {
  readonly id: string;
  readonly userA: string;
  readonly userB: string;
  readonly requestId: string;
  readonly createdAt: string;
  /** The "other" user's profile, resolved by the caller */
  readonly otherUser?: PublicProfile;
  /** Preview of the last message */
  readonly lastMessage?: string;
  readonly lastMessageAt?: string;
  readonly unreadCount?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

/** 7 days retention limit for auto-disappearing messages */
export function getSevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

// ─── Conversation queries ─────────────────────────────────────────────────────

/**
 * Get the conversation between two users, if one exists.
 * RLS ensures only the two participants can retrieve it.
 */
export async function getConversation(
  userA: string,
  userB: string,
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(
      `and(user_a.eq.${userA},user_b.eq.${userB}),and(user_a.eq.${userB},user_b.eq.${userA})`,
    )
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as ConversationRow;
  return {
    id: row.id,
    userA: row.user_a,
    userB: row.user_b,
    requestId: row.request_id,
    createdAt: row.created_at,
  };
}

/**
 * Get a conversation by its ID, optionally enriching with otherUser profile.
 */
export async function getConversationById(
  id: string,
  currentUserId?: string,
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as ConversationRow;

  let otherUser: PublicProfile | undefined = undefined;
  if (currentUserId) {
    const otherId = row.user_a === currentUserId ? row.user_b : row.user_a;
    try {
      const { data: prof } = await supabase
        .from('public_profiles')
        .select('id, name, username, avatar_url, university, college, branch, major')
        .eq('id', otherId)
        .maybeSingle();
      if (prof) {
        otherUser = { ...(prof as any), quickId: generateQuickId(prof.id) };
      }
    } catch {
      // ignore
    }
  }

  return {
    id: row.id,
    userA: row.user_a,
    userB: row.user_b,
    requestId: row.request_id,
    createdAt: row.created_at,
    otherUser,
  };
}

/**
 * List all conversations for the current user, enriched with the other user's
 * profile and the latest message preview (respecting 7-day auto-disappear).
 */
export async function listConversations(userId: string): Promise<Conversation[]> {
  try {
    const { data: convRows, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error || !convRows || convRows.length === 0) return [];

    const rows = convRows as ConversationRow[];

    // Collect all other-user IDs
    const otherIds = rows.map((r) =>
      r.user_a === userId ? r.user_b : r.user_a,
    );
    const uniqueOtherIds = [...new Set(otherIds)];

    // Fetch profiles in one query
    let profileMap = new Map<string, PublicProfile>();
    if (uniqueOtherIds.length > 0) {
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, name, username, avatar_url, university, college, branch, major')
        .in('id', uniqueOtherIds);

      (profiles ?? []).forEach((p: any) =>
        profileMap.set(p.id, { ...p, quickId: generateQuickId(p.id) }),
      );
    }

    // Fetch last message for each conversation (within 7 days)
    const sevenDaysAgo = getSevenDaysAgoIso();
    const convIds = rows.map((r) => r.id);
    const lastMsgMap = new Map<string, { body: string; created_at: string }>();

    if (convIds.length > 0) {
      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('conversation_id, body, created_at')
        .in('conversation_id', convIds)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });

      (lastMsgs ?? []).forEach((m: any) => {
        if (!lastMsgMap.has(m.conversation_id)) {
          lastMsgMap.set(m.conversation_id, { body: m.body, created_at: m.created_at });
        }
      });
    }

    // Fetch unread counts (within 7 days)
    const unreadMap = new Map<string, number>();
    if (convIds.length > 0) {
      const { data: unreadRows } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .neq('sender_id', userId)
        .gte('created_at', sevenDaysAgo)
        .is('read_at', null);

      (unreadRows ?? []).forEach((m: any) => {
        unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) ?? 0) + 1);
      });
    }

    return rows.map((r) => {
      const otherId = r.user_a === userId ? r.user_b : r.user_a;
      const lastMsg = lastMsgMap.get(r.id);
      return {
        id: r.id,
        userA: r.user_a,
        userB: r.user_b,
        requestId: r.request_id,
        createdAt: r.created_at,
        otherUser: profileMap.get(otherId),
        lastMessage: lastMsg?.body,
        lastMessageAt: lastMsg?.created_at,
        unreadCount: unreadMap.get(r.id) ?? 0,
      };
    });
  } catch (err) {
    console.error('Error in listConversations:', err);
    return [];
  }
}

// ─── Message queries ──────────────────────────────────────────────────────────

/**
 * List all messages in a conversation, filtered to the last 7 days (auto-disappear).
 */
export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const sevenDaysAgo = getSevenDaysAgoIso();

    // Asynchronously trigger server purge in the background
    purgeExpiredMessages().catch(() => {});

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return (data as MessageRow[]).map(rowToMessage);
  } catch (err) {
    console.error('Error in listMessages:', err);
    return [];
  }
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<ChatMessage | null> {
  const trimmed = body.trim();
  if (!trimmed) return null;

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, body: trimmed })
      .select()
      .single();

    if (error || !data) {
      console.error('sendMessage error:', error?.message ?? 'No data returned');
      return null;
    }
    return rowToMessage(data as MessageRow);
  } catch (err) {
    console.error('Error sending message:', err);
    return null;
  }
}

/**
 * Mark all unread messages in a conversation as read.
 */
export async function markMessagesRead(
  conversationId: string,
  readerId: string,
): Promise<void> {
  try {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', readerId)
      .is('read_at', null);
  } catch {
    // ignore
  }
}

// ─── Chat Lifecycle: Clear & Delete ──────────────────────────────────────────

/**
 * Clear all messages in a conversation, keeping the conversation connection active.
 */
export async function clearChat(
  conversationId: string,
): Promise<{ success: boolean; reason?: string }> {
  try {
    // Try RPC first
    const { data, error } = await supabase.rpc('clear_chat', {
      p_conversation_id: conversationId,
    });

    if (!error && data) {
      const res = typeof data === 'string' ? JSON.parse(data) : data;
      if (res.success) return { success: true };
    }

    // Direct delete fallback (in case RPC was not yet deployed)
    const { error: delError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (delError) {
      return { success: false, reason: delError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, reason: err?.message ?? 'Failed to clear chat' };
  }
}

/**
 * Delete an entire conversation and reset the connection.
 */
export async function deleteConversation(
  conversationId: string,
): Promise<{ success: boolean; reason?: string }> {
  try {
    // Try RPC first
    const { data, error } = await supabase.rpc('delete_conversation', {
      p_conversation_id: conversationId,
    });

    if (!error && data) {
      const res = typeof data === 'string' ? JSON.parse(data) : data;
      if (res.success) return { success: true };
    }

    // Fallback direct delete
    const { error: delError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (delError) {
      return { success: false, reason: delError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, reason: err?.message ?? 'Failed to delete conversation' };
  }
}

/**
 * Purge messages older than 7 days from the database.
 */
export async function purgeExpiredMessages(): Promise<void> {
  try {
    const { error } = await supabase.rpc('purge_expired_messages');
    if (error) {
      // Fallback: delete client-side if RPC not present
      const sevenDaysAgo = getSevenDaysAgoIso();
      await supabase.from('messages').delete().lt('created_at', sevenDaysAgo);
    }
  } catch {
    // ignore
  }
}

/**
 * Delete a single message sent by the user.
 */
export async function deleteSingleMessage(
  messageId: string,
): Promise<{ success: boolean; reason?: string }> {
  try {
    const { data, error } = await supabase.rpc('delete_single_message', {
      p_message_id: messageId,
    });

    if (!error && data) {
      const res = typeof data === 'string' ? JSON.parse(data) : data;
      if (res.success) return { success: true };
    }

    // Fallback direct delete
    const { error: delError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (delError) {
      return { success: false, reason: delError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, reason: err?.message ?? 'Failed to delete message' };
  }
}

// ─── Realtime subscriptions ───────────────────────────────────────────────────

/**
 * Unique channel names prevent Supabase duplicate channel collision crashes.
 */
export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (message: ChatMessage) => void,
  onCleared?: () => void,
  onDeleted?: (deletedMessageId: string) => void,
): () => void {
  const channelName = `messages_${conversationId}_${Math.random().toString(36).substring(2, 8)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (payload?.new) {
          onNewMessage(rowToMessage(payload.new as MessageRow));
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const deletedId = (payload?.old as { id?: string })?.id;
        if (deletedId && onDeleted) {
          onDeleted(deletedId);
        } else {
          onCleared?.();
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToReadReceipts(
  conversationId: string,
  onUpdate: (message: ChatMessage) => void,
): () => void {
  const channelName = `receipts_${conversationId}_${Math.random().toString(36).substring(2, 8)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (payload?.new) {
          onUpdate(rowToMessage(payload.new as MessageRow));
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
