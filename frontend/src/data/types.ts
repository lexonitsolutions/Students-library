export type MaterialType = 'pdf' | 'doc' | 'notes' | 'slides' | 'past-paper' | 'lab-manual';

export type MaterialStatus = 'approved' | 'pending' | 'rejected';

export interface Material {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly subject: string;
  readonly semester: string;
  readonly type: MaterialType;
  readonly uploaderId: string;
  readonly uploaderName: string;
  readonly uploaderUsername?: string | null;
  readonly uploaderAvatar: string;
  readonly uploaderUniversity?: string;
  readonly uploaderCollege?: string;
  readonly uploaderLocation?: string;
  readonly uploaderUploadsCount?: number;
  readonly uploaderJoinedAt?: string;
  readonly uploadedAt: string;
  readonly views: number;
  readonly downloads: number;
  readonly saves: number;
  readonly status: MaterialStatus;
  readonly accentColor: 'indigo' | 'blue' | 'amber' | 'rose' | 'emerald';
  readonly fileUrl: string;
  readonly filePath: string;
  readonly pages?: number;
  readonly fileSizeMb?: number;
  readonly college?: string;
  readonly branch?: string;
  readonly year?: string;
  readonly course?: string;
  readonly previewUrl?: string;
  readonly isSaved?: boolean;
  readonly likes?: number;
  readonly isLiked?: boolean;
  readonly shares?: number;
  readonly rejectionReason?: string | null;
  readonly rejectedByAdminName?: string | null;
  readonly rejectedByAdminAvatar?: string | null;
  readonly rejectedAt?: string | null;
}

export interface User {
  readonly id: string;
  readonly quickId?: string;
  readonly name: string;
  readonly username?: string;
  readonly email: string;
  readonly avatar: string;
  readonly coverImage?: string;
  readonly university: string;
  readonly major: string;
  readonly college?: string;
  readonly course?: string;
  readonly branch?: string;
  readonly year?: string;
  readonly semester?: string;
  readonly preferredSubjects?: string[];
  readonly role: 'student' | 'admin';
  readonly createdAt?: string;
  readonly stats: {
    readonly uploads: number;
    readonly downloads: number;
    readonly saved: number;
  };
}

export type NotificationType = 'download' | 'approval' | 'rejection' | 'comment' | 'system' | 'save' | 'message_request';

export interface AppNotification {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly description: string;
  readonly timestamp: string;
  readonly read: boolean;
  readonly createdAt?: string;
}
