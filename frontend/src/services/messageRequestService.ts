import { supabase } from '../lib/supabaseClient';
import { generateQuickId } from '../lib/idUtils';
import { addNotificationForUser, removeMessageRequestNotifications } from './notificationsService';
import type { MessageRequestRow, MessageRequestStatus } from '../types/database.types';
import { cachedQuery, invalidateCache } from '../lib/queryCache';

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
    senderAvatar: senderProfile.avatar_url || '',
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
  const profiles = await cachedQuery(
    'public_profiles_for_search',
    async () => {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, name, username, avatar_url, university, college, branch, major');
      if (error || !data) return [];
      return data as Array<Omit<PublicProfile, 'quickId'>>;
    },
    60_000,
  );

  const match = profiles.find(
    (p) => generateQuickId(p.id) === quickId && p.id !== callerUuid,
  );

  if (!match) return null;
  return { ...match, quickId: generateQuickId(match.id) };
}

// ─── Send request ─────────────────────────────────────────────────────────────

/**
 * Send a message request from the current auth user to a receiver.
 * Uses direct Supabase database operations with Clerk compatibility and RPC fallback.
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
  invalidateCache('pending_requests:');

  if (!params.fromUserId) {
    return { success: false, reason: 'You must be signed in to send a request' };
  }

  if (params.fromUserId === params.toUserId) {
    return { success: false, reason: 'Cannot send a request to yourself' };
  }

  // 1. First try calling the RPC with explicit sender if supported
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('send_message_request', {
      p_receiver_id: params.toUserId,
      p_sender_id: params.fromUserId,
    } as any);

    if (!rpcError && rpcData) {
      const raw = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
      if (raw.success) {
        addNotificationForUser(params.toUserId, {
          id: `notif-msgr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'message_request',
          title: `${params.fromUserName} wants to message you`,
          description: `User ID: ${params.fromUserQuickId}. Open Messages to accept or reject.`,
          timestamp: 'Just now',
          read: false,
        });
        return { success: true, requestId: raw.request_id };
      }
      if (raw.reason && raw.reason !== 'Not authenticated') {
        return { success: false, reason: raw.reason, requestId: raw.request_id };
      }
    }
  } catch {
    // Proceed to direct table fallback
  }

  // 2. Direct database operation (compatible with Clerk authentication)
  try {
    // Check if receiver exists
    const { data: receiverProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', params.toUserId)
      .maybeSingle();

    if (profileErr || !receiverProfile) {
      return { success: false, reason: 'User not found' };
    }

    // Check for any existing request in either direction
    const { data: existingList } = await supabase
      .from('message_requests')
      .select('*')
      .or(
        `and(sender_id.eq.${params.fromUserId},receiver_id.eq.${params.toUserId}),and(sender_id.eq.${params.toUserId},receiver_id.eq.${params.fromUserId})`,
      )
      .order('created_at', { ascending: false });

    if (existingList && existingList.length > 0) {
      const existing = existingList[0];
      if (existing.status === 'pending') {
        return {
          success: false,
          reason: 'A pending request already exists',
          requestId: existing.id,
        };
      }
      if (existing.status === 'accepted') {
        return {
          success: false,
          reason: 'You are already connected',
          requestId: existing.id,
        };
      }
      if (existing.status === 'rejected') {
        return {
          success: false,
          reason: 'Your previous request was rejected',
        };
      }
    }

    // Insert the new pending request
    const { data: newReq, error: insertError } = await supabase
      .from('message_requests')
      .insert({
        sender_id: params.fromUserId,
        receiver_id: params.toUserId,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError || !newReq) {
      console.error('Failed to insert message request:', insertError);
      return { success: false, reason: insertError?.message ?? 'Failed to send request' };
    }

    // Fire notification for the receiver
    addNotificationForUser(params.toUserId, {
      id: `notif-msgr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'message_request',
      title: `${params.fromUserName} wants to message you`,
      description: `User ID: ${params.fromUserQuickId}. Open Messages to accept or reject.`,
      timestamp: 'Just now',
      read: false,
    });

    return {
      success: true,
      requestId: newReq.id,
    };
  } catch (err: any) {
    console.error('sendRequest error:', err);
    return { success: false, reason: err?.message ?? 'Unable to send request' };
  }
}

// ─── Cancel request ───────────────────────────────────────────────────────────

/** Cancel / withdraw a pending request. Only the sender can do this. */
export async function cancelRequest(
  requestId: string,
  toUserId: string,
  fromUserQuickId: string,
): Promise<boolean> {
  invalidateCache('pending_requests:');
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
  return cachedQuery(
    `pending_requests:${userId}`,
    async () => {
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
    },
    15_000,
  );
}

// ─── Accept request ───────────────────────────────────────────────────────────

/**
 * Accept a request. Compatible with Clerk authentication and direct fallback.
 * Returns the conversation ID on success.
 */
export async function acceptRequest(
  requestId: string,
  acceptorName?: string,
  callerId?: string,
): Promise<{ success: boolean; conversationId?: string; reason?: string }> {
  try {
    // 1. Try RPC first with caller id if available
    try {
      const { data, error } = await supabase.rpc('accept_message_request', {
        p_request_id: requestId,
        p_caller_id: callerId,
      } as any);

      if (!error && data) {
        const raw = typeof data === 'string' ? JSON.parse(data) : data;
        const result = (raw ?? {}) as { success?: boolean; conversation_id?: string; reason?: string };

        if (result.success) {
          invalidateCache('pending_requests:');
          invalidateCache('conversations:');
          notifyAcceptance(requestId, acceptorName);
          return {
            success: true,
            conversationId: result.conversation_id,
          };
        }
        if (result.reason && result.reason !== 'Not authenticated') {
          return { success: false, reason: result.reason };
        }
      }
    } catch {
      // Fall through to direct DB operation
    }

    // 2. Direct DB fallback for Clerk auth
    const { data: req, error: reqErr } = await supabase
      .from('message_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (reqErr || !req) {
      return { success: false, reason: 'Request not found' };
    }

    if (req.status !== 'pending') {
      return { success: false, reason: 'Request is not pending' };
    }

    // Mark as accepted
    const { error: updateErr } = await supabase
      .from('message_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateErr) {
      return { success: false, reason: updateErr.message };
    }

    // Check if conversation already exists
    let { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(user_a.eq.${req.sender_id},user_b.eq.${req.receiver_id}),and(user_a.eq.${req.receiver_id},user_b.eq.${req.sender_id})`,
      )
      .limit(1)
      .maybeSingle();

    let convId = existingConv?.id;

    if (!convId) {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          user_a: req.sender_id,
          user_b: req.receiver_id,
          request_id: requestId,
        })
        .select('id')
        .single();

      if (convErr && !convErr.message.includes('duplicate')) {
        return { success: false, reason: convErr.message };
      }
      convId = newConv?.id;
    }

    invalidateCache('pending_requests:');
    invalidateCache('conversations:');
    notifyAcceptance(requestId, acceptorName);

    return {
      success: true,
      conversationId: convId,
    };
  } catch (err: any) {
    console.error('Error accepting request:', err);
    return { success: false, reason: err?.message ?? 'Failed to accept request' };
  }
}

// ─── Reject request ───────────────────────────────────────────────────────────

/**
 * Reject a request. Compatible with Clerk authentication.
 */
export async function rejectRequest(
  requestId: string,
  rejectorName: string,
  callerId?: string,
): Promise<{ success: boolean; reason?: string }> {
  invalidateCache('pending_requests:');
  try {
    try {
      const { data, error } = await supabase.rpc('reject_message_request', {
        p_request_id: requestId,
        p_caller_id: callerId,
      } as any);

      if (!error && data) {
        const result = (typeof data === 'string' ? JSON.parse(data) : data) as { success?: boolean; reason?: string };
        if (result.success) {
          notifyRejection(requestId, rejectorName);
          return { success: true };
        }
        if (result.reason && result.reason !== 'Not authenticated') {
          return { success: false, reason: result.reason };
        }
      }
    } catch {
      // Fall through to direct DB operation
    }

    // Direct DB update
    const { error: updateErr } = await supabase
      .from('message_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateErr) {
      return { success: false, reason: updateErr.message };
    }

    notifyRejection(requestId, rejectorName);
    return { success: true };
  } catch (err: any) {
    return { success: false, reason: err?.message ?? 'Failed to reject request' };
  }
}

function notifyAcceptance(requestId: string, acceptorName?: string) {
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
      // ignore
    }
  })();
}

function notifyRejection(requestId: string, rejectorName: string) {
  (async () => {
    try {
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
    } catch {
      // ignore
    }
  })();
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

    // 2. Direct insert for conversation (works seamlessly with Clerk and anon client)
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        user_a: params.adminId,
        user_b: params.studentId,
      })
      .select('id')
      .maybeSingle();

    if (newConv?.id) {
      return { success: true, conversationId: newConv.id };
    }

    // 3. Call RPC admin_start_conversation as alternative
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

