import { supabase } from '../lib/supabaseClient';
import { timeAgo } from '../lib/timeAgo';
import { cachedQuery, setCacheData, invalidateCache } from '../lib/queryCache';
import type { AppNotification } from '../data/types';
import type { NotificationRow } from '../types/database.types';

/**
 * Cleans up notification description text. If it contains raw REJECTED:{...json...}
 * metadata (stored by an older trigger), extract just the human-readable reason.
 */
function cleanNotificationDescription(description: string | null | undefined): string {
  if (!description) return '';

  // Check if description contains the raw metadata pattern like:
  // `"Title" was rejected. REJECTED:{"adminId":"...","reason":"Wrong subject...","..."}`
  const rejectedMetaIndex = description.indexOf('REJECTED:{');
  if (rejectedMetaIndex !== -1) {
    // Extract the JSON part
    const jsonStr = description.slice(rejectedMetaIndex + 'REJECTED:'.length);
    try {
      const meta = JSON.parse(jsonStr);
      const reason = meta?.reason;
      if (reason && typeof reason === 'string' && reason.trim()) {
        // Build clean description: keep the part before REJECTED: tag + clean reason
        const prefix = description.slice(0, rejectedMetaIndex).trimEnd();
        // Strip trailing period or space from prefix
        const cleanPrefix = prefix.replace(/[\s.]+$/, '');
        return `${cleanPrefix}. Reason: ${reason.trim()}`;
      }
    } catch {
      // JSON parse failed — fall through to strip the raw JSON
      return description.slice(0, rejectedMetaIndex).trim();
    }
  }

  return description;
}

function toAppNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: cleanNotificationDescription(row.description),
    timestamp: timeAgo(row.created_at),
    read: row.read,
    createdAt: row.created_at,
  };
}


export function getLocalNotificationsKey(userId: string) {
  return `quicklearnit.notifications_${userId}`;
}

export function loadLocalNotifications(userId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(getLocalNotificationsKey(userId));
    const items: AppNotification[] = raw ? JSON.parse(raw) : [];
    // Clean any old notifications that have raw REJECTED:{...} metadata in description
    return items.map((n) => ({ ...n, description: cleanNotificationDescription(n.description) }));
  } catch {
    return [];
  }
}

export function saveLocalNotifications(userId: string, notifications: AppNotification[]): void {
  localStorage.setItem(getLocalNotificationsKey(userId), JSON.stringify(notifications));
}

export function addNotificationForUser(userId: string, notification: AppNotification): void {
  if (!userId) return;
  const local = loadLocalNotifications(userId);
  const notifWithDate: AppNotification = {
    ...notification,
    createdAt: notification.createdAt || new Date().toISOString(),
  };
  local.unshift(notifWithDate);
  saveLocalNotifications(userId, local);
  invalidateCache(`notifications:${userId}`);

  // Also attempt Supabase insert if logged in / connected
  (async () => {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type: notification.type as any,
        title: notification.title,
        description: notification.description,
        read: notification.read,
      });
      if (error) console.warn('Supabase notification insert notice:', error.message);
    } catch {
      // ignore
    }
  })();
}

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  if (!userId) return [];
  return cachedQuery(`notifications:${userId}`, async () => {
    const localItems = loadLocalNotifications(userId);
    let dbItems: AppNotification[] = [];

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbItems = (data as NotificationRow[]).map(toAppNotification);
      }
    } catch (err) {
      console.warn('DB listNotifications notice:', err);
    }

    const map = new Map<string, AppNotification>();
    localItems.forEach((item) => map.set(item.id, item));
    dbItems.forEach((item) => map.set(item.id, item));

    return Array.from(map.values()).sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1));
  }, 30_000); // 30s TTL
}

export async function markAllRead(userId: string): Promise<void> {
  const local = loadLocalNotifications(userId).map((n) => ({ ...n, read: true }));
  saveLocalNotifications(userId, local);

  // Optimistically update cache
  try {
    const cached = await listNotifications(userId);
    const updated = cached.map((item) => ({ ...item, read: true }));
    setCacheData(`notifications:${userId}`, updated);
  } catch {
    invalidateCache(`notifications:${userId}`);
  }

  try {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  } catch {
    // ignore
  }
}

export async function deleteNotification(id: string, userId?: string): Promise<void> {
  if (userId) {
    const local = loadLocalNotifications(userId).filter((n) => n.id !== id);
    saveLocalNotifications(userId, local);
    invalidateCache(`notifications:${userId}`);
  }
  try {
    await supabase.from('notifications').delete().eq('id', id);
  } catch {
    // ignore
  }
}

export function removeMessageRequestNotifications(toUserId: string, fromUserQuickId: string): void {
  if (!toUserId) return;
  const local = loadLocalNotifications(toUserId).filter(
    (n) => !(n.type === 'message_request' && n.description.includes(fromUserQuickId))
  );
  saveLocalNotifications(toUserId, local);

  (async () => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', toUserId)
        .eq('type', 'message_request')
        .ilike('description', `%${fromUserQuickId}%`);
    } catch {
      // ignore
    }
  })();
}

export function isWithinPastWeek(notification: AppNotification): boolean {
  if (notification.createdAt) {
    const createdTime = new Date(notification.createdAt).getTime();
    if (!isNaN(createdTime)) {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return createdTime >= oneWeekAgo;
    }
  }

  // Fallback checking based on timestamp text
  const ts = (notification.timestamp || '').toLowerCase().trim();
  if (
    ts === 'just now' ||
    ts.includes('sec') ||
    ts.includes('min') ||
    ts.includes('hour') ||
    ts === 'yesterday'
  ) {
    return true;
  }
  const dayMatch = ts.match(/(\d+)\s*day/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    return days <= 7;
  }
  const weekMatch = ts.match(/(\d+)\s*week/);
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1], 10);
    return weeks <= 1;
  }

  // If it's a date string, try parsing it
  const parsed = new Date(notification.timestamp).getTime();
  if (!isNaN(parsed)) {
    return parsed >= Date.now() - 7 * 24 * 60 * 60 * 1000;
  }

  return true;
}

export function filterPastWeekNotifications(notifications: AppNotification[]): AppNotification[] {
  return notifications.filter(isWithinPastWeek);
}

