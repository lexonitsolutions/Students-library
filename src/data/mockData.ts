// Static reference/config data (dropdown options, onboarding copy, placeholder
// chart data). Actual materials, users, and notifications now come from
// Supabase -- see src/services/.

export interface CategoryConfig {
  id: string;
  label: string;
  icon: string;
  type: string;
}

export const categories: CategoryConfig[] = [
  { id: 'materials', label: 'Materials', icon: 'FileText', type: 'materials' },
  { id: 'past-paper', label: 'Past Papers', icon: 'FileQuestion', type: 'past-paper' },
  { id: 'doc', label: 'Assignments & Docs', icon: 'ClipboardList', type: 'doc' },
];

export const growthAnalytics = [40, 65, 90, 120, 75, 55, 95];

export const courses = ['Engineering', 'Degree'];

export const engineeringBranches = [
  'AI (Artificial Intelligence)',
  'Machine Learning',
  'Data Science',
  'CSE (Computer Science & Engineering)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Electronics and Communication (ECE)',
  'Chemical Engineering',
];

export const degreeBranches = [
  'BBA (Bachelor of Business Administration)',
  'B.Com (Bachelor of Commerce)',
  'BCA (Bachelor of Computer Applications)',
  'B.Sc. (Bachelor of Science)',
];

export const universities = ['Stanford University', 'MIT', 'Harvard University', 'State University', 'Tech Institute'];
export const subjects = ['Computer Science', 'Mathematics', 'Physics', 'Economics', 'Chemistry', 'Biology'];
export const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
export const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'];

import type { Material } from './types';

export const mockMaterials: Material[] = [
  {
    id: 'm1',
    title: 'Data Structures & Algorithms Complete Notes',
    description: 'Comprehensive guide covering Arrays, Linked Lists, Trees, Graphs, Sorting, and Dynamic Programming with code snippets.',
    subject: 'Computer Science',
    semester: 'Semester 3',
    type: 'pdf',
    uploaderId: 'u1',
    uploaderName: 'Alex Rivera',
    uploaderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    uploaderUniversity: 'MIT - Massachusetts Institute of Technology',
    uploaderCollege: 'Department of Electrical Engineering & Computer Science',
    uploaderLocation: 'Cambridge, MA, USA',
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    views: 1420,
    downloads: 380,
    saves: 95,
    status: 'approved',
    accentColor: 'indigo',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    filePath: 'mock/dsa-notes.pdf',
    pages: 45,
    fileSizeMb: 4.2,
  },
  {
    id: 'm2',
    title: 'Calculus & Linear Algebra Mid-Term Past Paper 2024',
    description: 'Official 2024 mid-semester examination paper with complete step-by-step solutions and marking guide.',
    subject: 'Mathematics',
    semester: 'Semester 1',
    type: 'past-paper',
    uploaderId: 'u2',
    uploaderName: 'Elena Rostova',
    uploaderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
    uploaderUniversity: 'Stanford University',
    uploaderCollege: 'Department of Applied Mathematics',
    uploaderLocation: 'Stanford, CA, USA',
    uploadedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    views: 980,
    downloads: 245,
    saves: 62,
    status: 'approved',
    accentColor: 'amber',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    filePath: 'mock/calculus-pastpaper.pdf',
    pages: 12,
    fileSizeMb: 1.8,
  },
  {
    id: 'm3',
    title: 'Database Management Systems (DBMS) Lab Assignment 2',
    description: 'SQL queries, schema design, normalization (1NF to 3NF), and ER diagram problem statements.',
    subject: 'Computer Science',
    semester: 'Semester 4',
    type: 'doc',
    uploaderId: 'u3',
    uploaderName: 'Sarah Chen',
    uploaderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256',
    uploaderUniversity: 'Harvard University',
    uploaderCollege: 'School of Engineering and Applied Sciences',
    uploaderLocation: 'Boston, MA, USA',
    uploadedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    views: 730,
    downloads: 190,
    saves: 44,
    status: 'approved',
    accentColor: 'emerald',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    filePath: 'mock/dbms-assignment.docx',
    pages: 8,
    fileSizeMb: 2.1,
  },
  {
    id: 'm4',
    title: 'Operating Systems End-Term Past Paper 2023',
    description: 'End-semester question paper on Process Synchronization, CPU Scheduling, Virtual Memory, and Deadlocks.',
    subject: 'Computer Science',
    semester: 'Semester 4',
    type: 'past-paper',
    uploaderId: 'u4',
    uploaderName: 'David Miller',
    uploaderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    uploaderUniversity: 'Tech Institute of Technology',
    uploaderCollege: 'Faculty of Computer Engineering',
    uploaderLocation: 'Austin, TX, USA',
    uploadedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    views: 1150,
    downloads: 310,
    saves: 78,
    status: 'approved',
    accentColor: 'rose',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    filePath: 'mock/os-pastpaper.pdf',
    pages: 10,
    fileSizeMb: 1.5,
  },
  {
    id: 'm5',
    title: 'Artificial Intelligence & Neural Networks Assignment',
    description: 'Implementation problem set on Perceptrons, Backpropagation algorithm, and Convolutional Neural Networks.',
    subject: 'Computer Science',
    semester: 'Semester 5',
    type: 'doc',
    uploaderId: 'u5',
    uploaderName: 'Liam Thorne',
    uploaderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
    uploaderUniversity: 'State University',
    uploaderCollege: 'Department of Data Science & AI',
    uploaderLocation: 'Seattle, WA, USA',
    uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    views: 890,
    downloads: 210,
    saves: 53,
    status: 'approved',
    accentColor: 'blue',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    filePath: 'mock/ai-assignment.docx',
    pages: 14,
    fileSizeMb: 3.4,
  },
  {
    id: 'm6',
    title: 'Quantum Mechanics & Electromagnetism Study Guide',
    description: 'Detailed textbook summaries, solved wave equation problems, and key formulas for physics exam preparation.',
    subject: 'Physics',
    semester: 'Semester 2',
    type: 'pdf',
    uploaderId: 'u1',
    uploaderName: 'Alex Rivera',
    uploaderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    uploaderUniversity: 'MIT - Massachusetts Institute of Technology',
    uploaderCollege: 'Department of Physics',
    uploaderLocation: 'Cambridge, MA, USA',
    uploadedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    views: 610,
    downloads: 140,
    saves: 36,
    status: 'approved',
    accentColor: 'indigo',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    filePath: 'mock/quantum-physics.pdf',
    pages: 28,
    fileSizeMb: 3.8,
  },
];

export const onboardingSlides = [
  {
    id: 's1',
    title: 'Discover study materials',
    description: 'Access a vast, curated library of academic resources designed to enhance your focus and mastery.',
  },
  {
    id: 's2',
    title: 'Share your notes',
    description: 'Contribute to the academic ecosystem. Upload your meticulous notes and build your intellectual portfolio.',
  },
  {
    id: 's3',
    title: 'Learn together',
    description: 'Join a serious community of scholars. Discuss complex topics in a distraction-free, structured environment.',
  },
];
