export type MaterialType = 'pdf' | 'doc' | 'notes' | 'slides' | 'past-paper' | 'lab-manual';
export type MaterialStatus = 'approved' | 'pending' | 'rejected';
export type UserRole = 'student' | 'admin';
export type NotificationDbType = 'download' | 'approval' | 'rejection' | 'comment' | 'system' | 'save' | 'message_request';
export type ReportStatus = 'open' | 'reviewed' | 'dismissed';

export interface ProfileRow {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  university: string | null;
  college: string | null;
  branch: string | null;
  major: string | null;
  year: string | null;
  semester: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  cover_image?: string | null;
}

export type ProfileUpdate = Partial<
  Omit<ProfileRow, 'id' | 'role' | 'created_at' | 'updated_at'>
>;

export interface PublicProfileRow {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  university: string | null;
  college: string | null;
  branch: string | null;
  major: string | null;
  joined_at?: string;
}

export interface ProfileStatsRow {
  user_id: string;
  uploads_count: number;
  downloads_count: number;
  saved_count: number;
}

export interface MaterialRow {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  semester: string | null;
  university: string | null;
  college: string | null;
  branch: string | null;
  year: string | null;
  type: MaterialType;
  file_path: string;
  file_url: string;
  file_size_mb: number | null;
  pages: number | null;
  uploader_id: string;
  status: MaterialStatus;
  rejection_reason: string | null;
  views_count: number;
  downloads_count: number;
  saves_count: number;
  likes_count?: number;
  shares_count?: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialLikeRow {
  material_id: string;
  user_id: string;
  created_at: string;
}

export interface BookmarkRow {
  id: string;
  user_id: string;
  material_id: string;
  created_at: string;
}

export interface DownloadRow {
  id: string;
  user_id: string;
  material_id: string;
  downloaded_at: string;
}

export interface ReportRow {
  id: string;
  material_id: string;
  reporter_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

export interface AdminAllowlistRow {
  email: string;
  added_by: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationDbType;
  title: string;
  description: string | null;
  read: boolean;
  created_at: string;
}

export type MessageRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface MessageRequestRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: MessageRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface ConversationRow {
  id: string;
  user_a: string;
  user_b: string;
  request_id: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export type QueryStatus = 'Pending' | 'Opened' | 'Resolved';

export interface StudentQueryRow {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string | null;
  student_phone?: string | null;
  category: string;
  subject: string;
  description: string;
  status: QueryStatus;
  assigned_admin_id: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueryMessageRow {
  id: string;
  query_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'student' | 'admin';
  message: string;
  created_at: string;
}

