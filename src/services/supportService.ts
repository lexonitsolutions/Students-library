import { supabase } from '../lib/supabaseClient';
import { createStudentQuery } from './queryService';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  category: string;
  priority: 'low' | 'normal' | 'urgent';
  subject: string;
  message: string;
  status: 'open' | 'in_review' | 'resolved';
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const SUPPORT_CATEGORIES = [
  'Document Verification & Approvals',
  'Material Download or Viewing Issue',
  'Account & Login Support',
  'Subject or College Information Error',
  'Suggest a Feature or Material Request',
  'Report Broken Content / Copyright',
  'General Inquiry',
] as const;

export const FAQ_LIST: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Uploads & Verification',
    question: 'How long does document verification take?',
    answer:
      'All uploaded study materials are reviewed by our moderation team within 24 to 48 hours. Once verified, your document goes live on the platform and you will receive a notification.',
  },
  {
    id: 'faq-2',
    category: 'Uploads & Verification',
    question: 'Why was my uploaded document rejected?',
    answer:
      'Documents may be rejected if the pages are blurry/unreadable, contain copyrighted test bank keys, duplicate existing materials, or have incorrect subject labeling. The specific reason is always provided in your notifications and Uploads dashboard.',
  },
  {
    id: 'faq-3',
    category: 'Leaderboard & Points',
    question: 'How does the Scholar Leaderboard point system work?',
    answer:
      'Points are earned when your uploaded study resources are approved and when other students view, like, and download your materials. Active contributors gain higher rank on campus and global leaderboards.',
  },
  {
    id: 'faq-4',
    category: 'Messages & Community',
    question: 'How do I message another student or admin?',
    answer:
      'You can message any student by searching for their 9-digit Student ID in the Messages tab or clicking the Message icon on their profile card. If you are not yet connected, you can send a Message Request which they can accept.',
  },
  {
    id: 'faq-5',
    category: 'Downloads & Library',
    question: 'Can I download documents for offline exam preparation?',
    answer:
      'Yes! Any approved document can be downloaded in PDF or original format directly to your device or saved to your personal Library for quick revision before exams.',
  },
  {
    id: 'faq-6',
    category: 'Account',
    question: 'How do I update my college, branch, or semester details?',
    answer:
      'Go to Profile > Edit Profile to update your enrolled university, college name, branch of study, and academic year/semester.',
  },
];

function getTicketsKey(userId: string) {
  return `studexa.support_tickets_${userId}`;
}

export function listUserTickets(userId: string): SupportTicket[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getTicketsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function createSupportTicket(params: {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  category: string;
  priority: 'low' | 'normal' | 'urgent';
  subject: string;
  message: string;
}): Promise<SupportTicket> {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const ticketNumber = `TKT-${randomSuffix}`;

  const ticket: SupportTicket = {
    id: `ticket_${Date.now()}_${randomSuffix}`,
    ticketNumber,
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    userPhone: params.userPhone,
    category: params.category,
    priority: params.priority,
    subject: params.subject.trim(),
    message: params.message.trim(),
    status: 'open',
    createdAt: new Date().toISOString(),
  };

  // 1. Save to database student_queries table for Admin Query Management
  try {
    if (params.userId && params.userId !== 'guest') {
      await createStudentQuery({
        studentId: params.userId,
        studentName: params.userName || 'Student',
        studentEmail: params.userEmail || '',
        studentPhone: params.userPhone || '',
        category: params.category,
        subject: params.subject,
        description: params.message,
      });
    }
  } catch (queryErr) {
    console.warn('Failed to insert into student_queries:', queryErr);
  }

  // 2. Save to local storage
  if (params.userId) {
    const existing = listUserTickets(params.userId);
    existing.unshift(ticket);
    try {
      localStorage.setItem(getTicketsKey(params.userId), JSON.stringify(existing));
    } catch {
      // ignore
    }
  }

  // 3. Add notification for user confirming receipt
  try {
    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: 'system',
      title: `Query Received (#${ticketNumber})`,
      description: `Your inquiry regarding "${ticket.subject}" has been received. Our team will review it shortly.`,
      read: false,
    });
  } catch {
    // ignore
  }

  return ticket;
}
