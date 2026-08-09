import { supabase } from '../lib/supabaseClient';
import { timeAgo } from '../lib/timeAgo';
import type { AppNotification } from '../data/types';
import type { NotificationRow } from '../types/database.types';

function toAppNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description ?? '',
    timestamp: timeAgo(row.created_at),
    read: row.read,
  };
}

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as NotificationRow[]).map(toAppNotification);
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}
