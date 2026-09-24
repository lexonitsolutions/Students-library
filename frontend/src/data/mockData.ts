// Static reference/config data (dropdown options, onboarding copy).
// Actual materials, users, and notifications come from Supabase — see src/services/.

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
export const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
export const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'];

// Placeholder chart data for the admin dashboard growth graph
export const growthAnalytics = [40, 65, 90, 120, 75, 55, 95];

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
