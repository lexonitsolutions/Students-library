import { supabase } from '../lib/supabaseClient';
import { generateQuickId } from '../lib/idUtils';
import { addNotificationForUser, removeMessageRequestNotifications } from './notificationsService';
import type { MessageRequestRow, MessageRequestStatus } from '../types/database.types';

// ─── Public types ─────────────────────────────────────────────────────────────
export type { MessageRequestStatus };

export interface MessageRequest {
  readonly id: string;
  readonly senderId: string;
  readonly senderName: string;
  readonly senderAvatar: string;
  readonly senderQuickId: string;
  readonly receiverId: string;
  readonly receiverQuickId: string;
  readonly status: MessageRequestStatus;
  readonly createdAt: string;
}

export interface PublicProfile {
  readonly id: string;
  readonly name: string;
  readonly username: string | null;
  readonly avatar_url: string | null;
  readonly university: string | null;
  readonly college: string | null;
  readonly branch: string | null;
  readonly major: string | null;
  readonly quickId: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function rowToRequest(
  row: MessageRequestRow,
  senderProfile: PublicProfile,
): MessageRequest {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: senderProfile.name,
    senderAvatar: senderProfile.avatar_url ?? `https://i.pravatar.cc/160?u=${row.sender_id}`,
    senderQuickId: generateQuickId(row.sender_id),
    receiverId: row.receiver_id,
    receiverQuickId: generateQuickId(row.receiver_id),
    status: row.status,
    createdAt: row.created_at,
  };
}

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * Find a user by their 9-digit Quick ID.
 * Fetches all public profiles and compares the client-side hash.
 * Returns null if not found or if the caller is searching for themselves.
 */
export async function findUserByQuickId(
  quickId: string,
  callerUuid: string,
): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('id, name, username, avatar_url, university, college, branch, major');

  if (error || !data) return null;

  const match = (data as Array<Omit<PublicProfile, 'quickId'>>).find(
    (p) => generateQuickId(p.id) === quickId && p.id !== callerUuid,
  );

  if (!match) return null;
  return { ...match, quickId: generateQuickId(match.id) };
}

// ─── Send request ─────────────────────────────────────────────────────────────

/**
 * Send a message request from the current auth user to a receiver.
 * Calls the server-side RPC which enforces all business rules.
 */
export async function sendRequest(params: {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  fromUserQuickId: string;
  toUserId: string;
  toUserName: string;
  toUserQuickId: string;
}): Promise<{ success: boolean; reason?: string; requestId?: string }> {
  const { data, error } = await supabase.rpc('send_message_request', {
    p_receiver_id: params.toUserId,
  });

  if (error) {
    return { success: false, reason: error.message };
  }

  const result = data as { success: boolean; reason?: string; request_id?: string };

  if (result.success) {
    // Fire notification for the receiver
    addNotificationForUser(params.toUserId, {
      id: `notif-msgr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'message_request',
      title: `${params.fromUserName} wants to message you`,
      description: `User ID: ${params.fromUserQuickId}. Open Messages to accept or reject.`,
      timestamp: 'Just now',
      read: false,
    });
  }

  return {
    success: result.success,
    reason: result.reason,
    requestId: result.request_id,
  };
}

// ─── Cancel request ───────────────────────────────────────────────────────────

/** Cancel / withdraw a pending request. Only the sender can do this. */
export async function cancelRequest(
  requestId: string,
  toUserId: string,
  fromUserQuickId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('message_requests')
    .delete()
    .eq('id', requestId)
    .eq('status', 'pending');

  if (!error) {
    removeMessageRequestNotifications(toUserId, fromUserQuickId);
    return true;
  }
  return false;
}

// ─── List incoming pending requests ───────────────────────────────────────────

/** List all pending requests where the current user is the receiver. */
export async function listPendingRequests(userId: string): Promise<MessageRequest[]> {
  const { data, error } = await supabase
    .from('message_requests')
    .select('*')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Fetch sender profiles in one query
  const rows = data as MessageRequestRow[];
  const senderIds = [...new Set(rows.map((r) => r.sender_id))];

  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('id, name, username, avatar_url, university, college, branch, major')
    .in('id', senderIds);

  const profileMap = new Map<string, PublicProfile>();
  (profiles ?? []).forEach((p: any) =>
    profileMap.set(p.id, { ...p, quickId: generateQuickId(p.id) }),
  );

  return rows
    .filter((r) => profileMap.has(r.sender_id))
    .map((r) => rowToRequest(r, profileMap.get(r.sender_id)!));
}

// ─── Accept request ───────────────────────────────────────────────────────────

/**
 * Accept a request. Enforced server-side: only the receiver can call this.
 * Returns the conversation ID on success.
 */
export async function acceptRequest(
  requestId: string,
  acceptorName?: string,
): Promise<{ success: boolean; conversationId?: string; reason?: string }> {
  try {
    const { data, error } = await supabase.rpc('accept_message_request', {
      p_request_id: requestId,
    });

    if (error) return { success: false, reason: error.message };

    const raw = typeof data === 'string' ? JSON.parse(data) : data;
    const result = (raw ?? {}) as { success?: boolean; conversation_id?: string; reason?: string };

    if (result.success) {
      // Notify the sender in the background without blocking or throwing
      (async () => {
        try {
          const req = await getRequestById(requestId);
          if (req && acceptorName) {
            addNotificationForUser(req.senderId, {
              id: `notif-msgr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'message_request',
              title: 'Message request accepted!',
              description: `${acceptorName} accepted your message request. You can now chat!`,
              timestamp: 'Just now',
              read: false,
            });
          }
        } catch {
          // ignore notification error
        }
      })();
    }

    return {
      success: Boolean(result.success),
      conversationId: result.conversation_id,
      reason: result.reason,
    };
  } catch (err: any) {
    console.error('Error accepting request:', err);
    return { success: false, reason: err?.message ?? 'Failed to accept request' };
  }
}

// ─── Reject request ───────────────────────────────────────────────────────────

/**
 * Reject a request. Enforced server-side: only the receiver can call this.
 */
export async function rejectRequest(
  requestId: string,
  rejectorName: string,
): Promise<{ success: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc('reject_message_request', {
    p_request_id: requestId,
  });

  if (error) return { success: false, reason: error.message };

  const result = data as { success: boolean; reason?: string };

  if (result.success) {
    const req = await getRequestById(requestId);
    if (req) {
      addNotificationForUser(req.senderId, {
        id: `notif-msgr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'message_request',
        title: 'Message request rejected',
        description: `${rejectorName} rejected your message request.`,
        timestamp: 'Just now',
        read: false,
      });
    }
  }

  return { success: result.success, reason: result.reason };
}

// ─── Query helpers ────────────────────────────────────────────────────────────

/** Get a single request by ID (for notification sending). */
async function getRequestById(requestId: string): Promise<MessageRequest | null> {
  const { data, error } = await supabase
    .from('message_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as MessageRequestRow;

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('id, name, username, avatar_url, university, college, branch, major')
    .eq('id', row.sender_id)
    .maybeSingle();

  if (!profile) return null;
  return rowToRequest(row, { ...(profile as any), quickId: generateQuickId(row.sender_id) });
}

/**
 * Get the status of a request between two users (sender → receiver).
 * Returns null if no request exists.
 */
export async function getRequestStatus(
  fromUserId: string,
  toUserId: string,
): Promise<{ status: MessageRequestStatus; id: string } | null> {
  const { data, error } = await supabase
    .from('message_requests')
    .select('id, status')
    .eq('sender_id', fromUserId)
    .eq('receiver_id', toUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return { id: (data as any).id, status: (data as any).status };
}

/**
 * Check if two users have an accepted connection (in either direction).
 * Used to gate the message composer.
 */
export async function hasAcceptedConnection(userA: string, userB: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('message_requests')
    .select('id')
    .eq('status', 'accepted')
    .or(
      `and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`,
    )
    .limit(1)
    .maybeSingle();

  return !error && data !== null;
}

/**
 * List all accepted requests for a user (in either direction).
 * Used to populate the conversations sidebar.
 */
export async function listAcceptedRequests(userId: string): Promise<MessageRequestRow[]> {
  const { data, error } = await supabase
    .from('message_requests')
    .select('*')
    .eq('status', 'accepted')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];
  return data as MessageRequestRow[];
}

// ─── Realtime subscriptions ───────────────────────────────────────────────────

/**
 * Subscribe to incoming request changes for a user.
 * Calls onUpdate whenever a message_requests row is inserted or updated
 * where receiver_id = userId.
 */
export function subscribeToIncomingRequests(
  userId: string,
  onUpdate: () => void,
): () => void {
  const channelName = `incoming_requests_${userId}_${Math.random().toString(36).substring(2, 8)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'message_requests',
        filter: `receiver_id=eq.${userId}`,
      },
      onUpdate,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to outgoing request status changes for a user.
 * Calls onUpdate whenever one of the user's sent requests is accepted/rejected.
 */
export function subscribeToOutgoingRequests(
  userId: string,
  onUpdate: () => void,
): () => void {
  const channelName = `outgoing_requests_${userId}_${Math.random().toString(36).substring(2, 8)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'message_requests',
        filter: `sender_id=eq.${userId}`,
      },
      onUpdate,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Directly start or retrieve a conversation between main admin and a student,
 * bypassing the need for a message request.
 */
export async function startDirectAdminConversation(params: {
  adminId: string;
  studentId: string;
}): Promise<{ success: boolean; conversationId?: string; reason?: string }> {
  try {
    // 1. Check if conversation already exists
    const { data: convCheck } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(user_a.eq.${params.adminId},user_b.eq.${params.studentId}),and(user_a.eq.${params.studentId},user_b.eq.${params.adminId})`,
      )
      .limit(1)
      .maybeSingle();

    if (convCheck?.id) {
      return { success: true, conversationId: convCheck.id };
    }

    // 2. Call RPC admin_start_conversation
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_start_conversation', {
      p_student_id: params.studentId,
    });

    if (!rpcError && rpcData) {
      const raw = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
      if (raw.success && raw.conversation_id) {
        return { success: true, conversationId: raw.conversation_id };
      }
      if (raw.reason) {
        return { success: false, reason: raw.reason };
      }
    }

    // 3. Fallback: create/resolve via send_message_request
    const { data: reqData } = await supabase.rpc('send_message_request', {
      p_receiver_id: params.studentId,
    });
    const parsedReq = (typeof reqData === 'string' ? JSON.parse(reqData) : reqData) as any;
    const reqId = parsedReq?.request_id;

    if (reqId) {
      const { data: acceptData } = await supabase.rpc('accept_message_request', {
        p_request_id: reqId,
      });
      const parsedAccept = (typeof acceptData === 'string' ? JSON.parse(acceptData) : acceptData) as any;
      if (parsedAccept?.conversation_id) {
        return { success: true, conversationId: parsedAccept.conversation_id };
      }
    }

    // Final check for conversation
    const { data: finalCheck } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(user_a.eq.${params.adminId},user_b.eq.${params.studentId}),and(user_a.eq.${params.studentId},user_b.eq.${params.adminId})`,
      )
      .limit(1)
      .maybeSingle();

    if (finalCheck?.id) {
      return { success: true, conversationId: finalCheck.id };
    }

    const errorMsg = rpcError?.message || '';
    if (errorMsg.includes('schema cache') || errorMsg.includes('admin_start_conversation')) {
      return {
        success: false,
        reason: 'Database setup required: Please execute the admin_start_conversation SQL migration in Supabase SQL Editor.',
      };
    }

    return {
      success: false,
      reason: errorMsg || 'Could not initiate direct conversation.',
    };
  } catch (err: any) {
    console.error('Error in startDirectAdminConversation:', err);
    return { success: false, reason: err?.message || 'Failed to start direct conversation.' };
  }
}

