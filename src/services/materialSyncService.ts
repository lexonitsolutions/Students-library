import { supabase } from '../lib/supabaseClient';
import { invalidateMaterialsCache } from './materialsService';

export const MATERIAL_DELETED_EVENT = 'answersbro_material_deleted';
const STORAGE_SYNC_KEY = 'answersbro_material_deleted_sync';

// Global singleton channel for realtime broadcast across all clients
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
const listeners = new Set<(deletedId: string) => void>();

function ensureRealtimeChannel(): void {
  if (realtimeChannel || typeof window === 'undefined') return;

  try {
    realtimeChannel = supabase
      .channel('answersbro_materials_sync')
      .on('broadcast', { event: 'material_deleted' }, (payload: any) => {
        const id = payload?.payload?.id || payload?.id;
        if (id && typeof id === 'string') {
          notifyListeners(id);
        }
      })
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'materials' },
        (payload: any) => {
          const id = payload?.old?.id;
          if (id && typeof id === 'string') {
            notifyListeners(id);
          }
        }
      )
      .subscribe();
  } catch (err) {
    console.warn('Realtime channel init warning:', err);
  }
}

function notifyListeners(id: string): void {
  // 1. Wipe caches immediately so subsequent queries get fresh DB state
  invalidateMaterialsCache();

  // 2. Notify all active listeners in this window
  listeners.forEach((callback) => {
    try {
      callback(id);
    } catch (err) {
      console.error('Error in material delete listener:', err);
    }
  });
}

// Listen to local cross-tab / window storage events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === STORAGE_SYNC_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        if (data?.id) {
          notifyListeners(data.id);
        }
      } catch {}
    }
  });

  window.addEventListener(MATERIAL_DELETED_EVENT, (e: any) => {
    if (e.detail?.id) {
      notifyListeners(e.detail.id);
    }
  });
}

/**
 * Broadcast a material deletion to:
 * 1. Current window listeners (React states update immediately)
 * 2. Other tabs via localStorage event
 * 3. All other connected devices/users (students & admins) via Supabase Realtime WebSocket broadcast
 */
export async function broadcastMaterialDeleted(id: string): Promise<void> {
  // 1. Local window event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MATERIAL_DELETED_EVENT, { detail: { id } }));
    try {
      localStorage.setItem(
        STORAGE_SYNC_KEY,
        JSON.stringify({ id, timestamp: Date.now() })
      );
    } catch {}
  }

  // 2. Invalidate local in-memory and session caches
  invalidateMaterialsCache();

  // 3. Supabase Realtime broadcast to all connected clients
  try {
    ensureRealtimeChannel();
    if (realtimeChannel) {
      await realtimeChannel.send({
        type: 'broadcast',
        event: 'material_deleted',
        payload: { id },
      });
    }
  } catch (err) {
    console.warn('Failed to broadcast material deletion over Supabase Realtime:', err);
  }
}

/**
 * Subscribe to material deletions from any source (same tab, other tabs, other admins/students over network).
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToMaterialDeletions(callback: (deletedId: string) => void): () => void {
  ensureRealtimeChannel();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
