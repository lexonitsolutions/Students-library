import { supabase } from '../lib/supabaseClient';
import type { StudentQueryRow, QueryMessageRow, QueryStatus } from '../types/database.types';
import { triggerUnreadMessagesRefresh } from '../hooks/useUnreadMessages';

export interface StudentQuery {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  category: string;
  subject: string;
  description: string;
  status: QueryStatus;
  assignedAdminId: string | null;
  assignedAdminName?: string | null;
  assignedAt: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueryMessage {
  id: string;
  queryId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'admin';
  message: string;
  createdAt: string;
}

function mapQueryRow(row: StudentQueryRow, adminName?: string | null): StudentQuery {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentEmail: row.student_email || '',
    studentPhone: row.student_phone || '',
    category: row.category,
    subject: row.subject,
    description: row.description,
    status: row.status,
    assignedAdminId: row.assigned_admin_id,
    assignedAdminName: adminName,
    assignedAt: row.assigned_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessageRow(row: QueryMessageRow): QueryMessage {
  return {
    id: row.id,
    queryId: row.query_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    message: row.message,
    createdAt: row.created_at,
  };
}

// ─── Local Storage fallback key for offline/demo resilience ─────────────────
const LOCAL_QUERIES_KEY = 'answersbro.admin_queries_cache';
const LEGACY_QUERIES_KEY = 'studexa.admin_queries_cache';
const FALLBACK_QUERIES_KEY = 'quicklearnit.admin_queries_cache';

function getCachedQueries(): StudentQuery[] {
  try {
    const raw =
      localStorage.getItem(LOCAL_QUERIES_KEY) ||
      localStorage.getItem(LEGACY_QUERIES_KEY) ||
      localStorage.getItem(FALLBACK_QUERIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedQueries(queries: StudentQuery[]) {
  try {
    localStorage.setItem(LOCAL_QUERIES_KEY, JSON.stringify(queries));
  } catch {
    // ignore
  }
}

// ─── 1. Student Submission ───────────────────────────────────────────────────
export async function createStudentQuery(params: {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  category: string;
  subject: string;
  description: string;
}): Promise<StudentQuery> {
  const newRow = {
    student_id: params.studentId,
    student_name: params.studentName,
    student_email: params.studentEmail,
    student_phone: params.studentPhone?.trim() || null,
    category: params.category,
    subject: params.subject.trim(),
    description: params.description.trim(),
    status: 'Pending' as QueryStatus,
  };

  try {
    const { data, error } = await supabase
      .from('student_queries')
      .insert(newRow)
      .select()
      .single();

    if (error || !data) {
      console.warn('Database insert failed, using local cache fallback:', error?.message);
      const fallback: StudentQuery = {
        id: `local_query_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        studentId: params.studentId,
        studentName: params.studentName,
        studentEmail: params.studentEmail,
        studentPhone: params.studentPhone?.trim() || '',
        category: params.category,
        subject: params.subject.trim(),
        description: params.description.trim(),
        status: 'Pending',
        assignedAdminId: null,
        assignedAt: null,
        resolvedAt: null,
        resolvedBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const existing = getCachedQueries();
      existing.unshift(fallback);
      saveCachedQueries(existing);
      return fallback;
    }

    const saved = mapQueryRow(data as StudentQueryRow);
    // Also cache locally for instant availability
    const existing = getCachedQueries();
    existing.unshift(saved);
    saveCachedQueries(existing);
    triggerUnreadMessagesRefresh();
    return saved;
  } catch (err) {
    console.error('Failed to create student query:', err);
    const fallback: StudentQuery = {
      id: `local_query_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: params.studentId,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      studentPhone: params.studentPhone?.trim() || '',
      category: params.category,
      subject: params.subject.trim(),
      description: params.description.trim(),
      status: 'Pending',
      assignedAdminId: null,
      assignedAt: null,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const existing = getCachedQueries();
    existing.unshift(fallback);
    saveCachedQueries(existing);
    triggerUnreadMessagesRefresh();
    return fallback;
  }
}

// ─── 2. List Queries for Admin ───────────────────────────────────────────────
export async function listAdminQueries(): Promise<StudentQuery[]> {
  try {
    const { data, error } = await supabase
      .from('student_queries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return getCachedQueries();
    }

    // Resolve assigned admin names if any
    const adminIds = Array.from(new Set(data.map((q) => q.assigned_admin_id).filter(Boolean)));
    const adminMap = new Map<string, string>();

    if (adminIds.length > 0) {
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', adminIds);

      adminProfiles?.forEach((p) => adminMap.set(p.id, p.name));
    }

    const dbQueries = (data as StudentQueryRow[]).map((row) =>
      mapQueryRow(row, row.assigned_admin_id ? adminMap.get(row.assigned_admin_id) : null)
    );

    // Merge with any offline local cached queries not yet on server
    const local = getCachedQueries();
    const dbIds = new Set(dbQueries.map((q) => q.id));
    const merged = [...dbQueries];
    for (const l of local) {
      if (!dbIds.has(l.id)) {
        merged.push(l);
      }
    }

    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    saveCachedQueries(merged);
    return merged;
  } catch {
    return getCachedQueries();
  }
}

// ─── 3. Atomic Query Claim ───────────────────────────────────────────────────
export async function claimStudentQuery(
  queryId: string,
  adminId: string,
  adminName: string,
): Promise<{ success: boolean; reason?: string; alreadyAssigned?: boolean }> {
  try {
    // 1. Try atomic PostgreSQL RPC first
    const { data, error } = await supabase.rpc('claim_student_query', {
      p_query_id: queryId,
    });

    if (!error && data) {
      const res = typeof data === 'string' ? JSON.parse(data) : data;
      if (res.success) {
        // Update local cache
        const list = getCachedQueries().map((q) =>
          q.id === queryId
            ? {
                ...q,
                status: 'Opened' as QueryStatus,
                assignedAdminId: adminId,
                assignedAdminName: adminName,
                assignedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : q
        );
        saveCachedQueries(list);
        triggerUnreadMessagesRefresh();
        return { success: true };
      }
      return {
        success: false,
        reason: res.reason || 'This query has already been assigned to another admin.',
        alreadyAssigned: res.already_assigned ?? true,
      };
    }

    // 2. Direct database atomic update fallback (if RPC was not yet deployed)
    // WHERE id = queryId AND assigned_admin_id IS NULL AND status = 'Pending'
    const { data: updatedData, error: updateError } = await supabase
      .from('student_queries')
      .update({
        assigned_admin_id: adminId,
        assigned_at: new Date().toISOString(),
        status: 'Opened',
        updated_at: new Date().toISOString(),
      })
      .eq('id', queryId)
      .is('assigned_admin_id', null)
      .eq('status', 'Pending')
      .select();

    if (!updateError && updatedData && updatedData.length > 0) {
      const list = getCachedQueries().map((q) =>
        q.id === queryId
          ? {
              ...q,
              status: 'Opened' as QueryStatus,
              assignedAdminId: adminId,
              assignedAdminName: adminName,
              assignedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : q
      );
      saveCachedQueries(list);
      triggerUnreadMessagesRefresh();
      return { success: true };
    }

    // Check if it's already assigned to someone else
    const { data: currentQuery } = await supabase
      .from('student_queries')
      .select('assigned_admin_id, status')
      .eq('id', queryId)
      .maybeSingle();

    if (currentQuery) {
      if (currentQuery.assigned_admin_id && currentQuery.assigned_admin_id !== adminId) {
        return {
          success: false,
          alreadyAssigned: true,
          reason: 'This query has already been assigned to another admin.',
        };
      }
      if (currentQuery.assigned_admin_id === adminId) {
        triggerUnreadMessagesRefresh();
        return { success: true };
      }
    }

    // Local-only cache fallback check
    const local = getCachedQueries();
    const target = local.find((q) => q.id === queryId);
    if (target) {
      if (target.assignedAdminId && target.assignedAdminId !== adminId) {
        return {
          success: false,
          alreadyAssigned: true,
          reason: 'This query has already been assigned to another admin.',
        };
      }
      target.assignedAdminId = adminId;
      target.assignedAdminName = adminName;
      target.status = 'Opened';
      target.assignedAt = new Date().toISOString();
      saveCachedQueries(local);
      triggerUnreadMessagesRefresh();
      return { success: true };
    }

    return {
      success: false,
      alreadyAssigned: true,
      reason: 'This query has already been assigned to another admin.',
    };
  } catch (err: any) {
    return {
      success: false,
      reason: err?.message || 'Failed to claim query',
    };
  }
}

// ─── 4. Mark as Resolved ─────────────────────────────────────────────────────
export async function resolveStudentQuery(
  queryId: string,
  adminId: string,
): Promise<{ success: boolean; reason?: string }> {
  try {
    // Try RPC first
    const { data, error } = await supabase.rpc('resolve_student_query', {
      p_query_id: queryId,
    });

    if (!error && data) {
      const res = typeof data === 'string' ? JSON.parse(data) : data;
      if (res.success) {
        const list = getCachedQueries().map((q) =>
          q.id === queryId
            ? {
                ...q,
                status: 'Resolved' as QueryStatus,
                resolvedAt: new Date().toISOString(),
                resolvedBy: adminId,
                updatedAt: new Date().toISOString(),
              }
            : q
        );
        saveCachedQueries(list);
        triggerUnreadMessagesRefresh();
        return { success: true };
      }
    }

    // Direct update fallback
    const { error: updErr } = await supabase
      .from('student_queries')
      .update({
        status: 'Resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', queryId);

    if (updErr) {
      // Local cache fallback
      const list = getCachedQueries().map((q) =>
        q.id === queryId
          ? {
              ...q,
              status: 'Resolved' as QueryStatus,
              resolvedAt: new Date().toISOString(),
              resolvedBy: adminId,
              updatedAt: new Date().toISOString(),
            }
          : q
      );
      saveCachedQueries(list);
      triggerUnreadMessagesRefresh();
      return { success: true };
    }

    const list = getCachedQueries().map((q) =>
      q.id === queryId
        ? {
            ...q,
            status: 'Resolved' as QueryStatus,
            resolvedAt: new Date().toISOString(),
            resolvedBy: adminId,
            updatedAt: new Date().toISOString(),
          }
        : q
    );
    saveCachedQueries(list);
    triggerUnreadMessagesRefresh();
    return { success: true };
  } catch (err: any) {
    return { success: false, reason: err?.message || 'Failed to resolve query' };
  }
}

// ─── 5. Query Messages / Conversation Thread ────────────────────────────────
export async function listQueryMessages(queryId: string): Promise<QueryMessage[]> {
  try {
    const { data, error } = await supabase
      .from('query_messages')
      .select('*')
      .eq('query_id', queryId)
      .order('created_at', { ascending: true });

    if (error || !data) {
      return getCachedQueryMessages(queryId);
    }

    const msgs = (data as QueryMessageRow[]).map(mapMessageRow);
    saveCachedQueryMessages(queryId, msgs);
    return msgs;
  } catch {
    return getCachedQueryMessages(queryId);
  }
}

export async function sendQueryReply(params: {
  queryId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'admin';
  message: string;
  studentId?: string;
  querySubject?: string;
}): Promise<QueryMessage | null> {
  const trimmed = params.message.trim();
  if (!trimmed) return null;

  try {
    const { data, error } = await supabase
      .from('query_messages')
      .insert({
        query_id: params.queryId,
        sender_id: params.senderId,
        sender_name: params.senderName,
        sender_role: params.senderRole,
        message: trimmed,
      })
      .select()
      .single();

    // Update query timestamp
    await supabase
      .from('student_queries')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.queryId);

    // Notify the student if admin is replying
    if (params.senderRole === 'admin' && params.studentId) {
      supabase
        .from('notifications')
        .insert({
          user_id: params.studentId,
          type: 'system',
          title: 'New Reply to Your Query',
          description: `An administrator replied to your query regarding "${params.querySubject || 'Support'}": "${trimmed.substring(0, 80)}..."`,
          read: false,
        })
        .then();
    }

    if (error || !data) {
      const fallback: QueryMessage = {
        id: `local_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        queryId: params.queryId,
        senderId: params.senderId,
        senderName: params.senderName,
        senderRole: params.senderRole,
        message: trimmed,
        createdAt: new Date().toISOString(),
      };
      const existing = getCachedQueryMessages(params.queryId);
      existing.push(fallback);
      saveCachedQueryMessages(params.queryId, existing);
      return fallback;
    }

    const saved = mapMessageRow(data as QueryMessageRow);
    const existing = getCachedQueryMessages(params.queryId);
    existing.push(saved);
    saveCachedQueryMessages(params.queryId, existing);
    return saved;
  } catch (err) {
    console.error('Failed to send query message:', err);
    const fallback: QueryMessage = {
      id: `local_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      queryId: params.queryId,
      senderId: params.senderId,
      senderName: params.senderName,
      senderRole: params.senderRole,
      message: trimmed,
      createdAt: new Date().toISOString(),
    };
    const existing = getCachedQueryMessages(params.queryId);
    existing.push(fallback);
    saveCachedQueryMessages(params.queryId, existing);
    return fallback;
  }
}

function getCachedQueryMessages(queryId: string): QueryMessage[] {
  try {
    const raw = localStorage.getItem(`quicklearnit.query_messages_${queryId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedQueryMessages(queryId: string, messages: QueryMessage[]) {
  try {
    localStorage.setItem(`quicklearnit.query_messages_${queryId}`, JSON.stringify(messages));
  } catch {
    // ignore
  }
}

// ─── 6. Real-time Subscriptions ─────────────────────────────────────────────
export function subscribeToQueries(onUpdate: () => void): () => void {
  const channelName = `admin_queries_${Math.random().toString(36).substring(2, 8)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'student_queries',
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToQueryMessages(
  queryId: string,
  onNewMessage: (msg: QueryMessage) => void
): () => void {
  const channelName = `query_msgs_${queryId}_${Math.random().toString(36).substring(2, 8)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'query_messages',
        filter: `query_id=eq.${queryId}`,
      },
      (payload) => {
        if (payload?.new) {
          onNewMessage(mapMessageRow(payload.new as QueryMessageRow));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}