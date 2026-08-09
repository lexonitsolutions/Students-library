// Static reference/config data (dropdown options, onboarding copy, placeholder
// chart data). Actual materials, users, and notifications now come from
// Supabase -- see src/services/.

export const categories = [
  { id: 'c1', label: 'Notes', icon: 'FileEdit', count: 1240 },
  { id: 'c2', label: 'Past Papers', icon: 'FileQuestion', count: 850 },
  { id: 'c3', label: 'Assignments', icon: 'ClipboardList', count: 430 },
  { id: 'c4', label: 'Lab Manuals', icon: 'FlaskConical', count: 120 },
];

export const growthAnalytics = [40, 65, 90, 120, 75, 55, 95];

export const universities = ['Stanford University', 'MIT', 'Harvard University', 'State University', 'Tech Institute'];
export const subjects = ['Computer Science', 'Mathematics', 'Physics', 'Economics', 'Chemistry', 'Biology'];
export const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
export const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'];

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
