import { addNotificationForUser, removeMessageRequestNotifications } from './notificationsService';

// ─── Types ───────────────────────────────────────────────────────────────────
export type MessageRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface MessageRequest {
  readonly id: string;
  readonly fromUserId: string;
  readonly fromUserName: string;
  readonly fromUserAvatar: string;
  readonly fromUserQuickId: string;
  readonly toUserId: string;
  readonly toUserQuickId: string;
  readonly status: MessageRequestStatus;
  readonly createdAt: string;
}

// ─── Storage ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'quicklearnit.message_requests';

function loadRequests(): MessageRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRequests(requests: MessageRequest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Send a message request from one user to another. Prevents duplicates. */
export function sendRequest(params: {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  fromUserQuickId: string;
  toUserId: string;
  toUserName: string;
  toUserQuickId: string;
}): { success: boolean; reason?: string } {
  const requests = loadRequests();

  // Check for existing pending request
  const existing = requests.find(
    (r) =>
      r.fromUserId === params.fromUserId &&
      r.toUserId === params.toUserId &&
      r.status === 'pending'
  );
  if (existing) {
    return { success: false, reason: 'A pending request already exists.' };
  }

  // Check for recent rejection (block re-sending)
  const rejected = requests.find(
    (r) =>
      r.fromUserId === params.fromUserId &&
      r.toUserId === params.toUserId &&
      r.status === 'rejected'
  );
  if (rejected) {
    return { success: false, reason: 'Your previous request was rejected.' };
  }

  const newRequest: MessageRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    fromUserId: params.fromUserId,
    fromUserName: params.fromUserName,
    fromUserAvatar: params.fromUserAvatar,
    fromUserQuickId: params.fromUserQuickId,
    toUserId: params.toUserId,
    toUserQuickId: params.toUserQuickId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  requests.push(newRequest);
  saveRequests(requests);

  // Send notification to the RECEIVER (toUserId)
  addNotificationForUser(params.toUserId, {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'message_request',
    title: `${params.fromUserName} wants to message you`,
    description: `User ID: ${params.fromUserQuickId}. Go to Messages to accept or reject.`,
    timestamp: 'Just now',
    read: false,
  });

  return { success: true };
}

/** Cancel / withdraw a pending request from sender to receiver. Removes notification. */
export function cancelRequest(fromUserId: string, toUserId: string, fromUserQuickId: string): boolean {
  const requests = loadRequests();
  const filtered = requests.filter(
    (r) => !(r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending')
  );

  if (filtered.length !== requests.length) {
    saveRequests(filtered);
    // Remove notification for receiver (person 2)
    removeMessageRequestNotifications(toUserId, fromUserQuickId);
    return true;
  }
  return false;
}

/** List all pending requests where userId is the receiver. */
export function listPendingRequests(userId: string): MessageRequest[] {
  return loadRequests().filter((r) => r.toUserId === userId && r.status === 'pending');
}

/** Accept a message request by its ID. */
export function acceptRequest(requestId: string, acceptorName?: string): MessageRequest | null {
  const requests = loadRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  const updated = { ...requests[idx], status: 'accepted' as const };
  requests[idx] = updated;
  saveRequests(requests);

  // Send notification to the SENDER (fromUserId)
  if (acceptorName) {
    addNotificationForUser(updated.fromUserId, {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'message_request',
      title: 'Message request accepted!',
      description: `${acceptorName} accepted your message request. You can now chat!`,
      timestamp: 'Just now',
      read: false,
    });
  }

  return updated;
}

/** Reject a message request by its ID. Creates a notification for the sender. */
export function rejectRequest(requestId: string, rejectorName: string): MessageRequest | null {
  const requests = loadRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  const updated = { ...requests[idx], status: 'rejected' as const };
  requests[idx] = updated;
  saveRequests(requests);

  // Send notification to the SENDER (fromUserId)
  addNotificationForUser(updated.fromUserId, {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'message_request',
    title: 'Message request rejected',
    description: `${rejectorName} rejected your message request.`,
    timestamp: 'Just now',
    read: false,
  });

  return updated;
}

/** Get the status of a request between two users (sender → receiver). */
export function getRequestStatus(
  fromUserId: string,
  toUserId: string
): MessageRequestStatus | null {
  const requests = loadRequests();
  // Find the most recent request between these two users
  const match = requests
    .filter((r) => r.fromUserId === fromUserId && r.toUserId === toUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return match.length > 0 ? match[0].status : null;
}

/** Check if two users have an accepted connection (in either direction). */
export function hasAcceptedConnection(userA: string, userB: string): boolean {
  const requests = loadRequests();
  return requests.some(
    (r) =>
      r.status === 'accepted' &&
      ((r.fromUserId === userA && r.toUserId === userB) ||
        (r.fromUserId === userB && r.toUserId === userA))
  );
}
