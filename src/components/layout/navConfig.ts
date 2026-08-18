import { Home, Trophy, UploadCloud, BookOpen, User } from 'lucide-react';

export interface NavItem {
  readonly label: string;
  readonly to: string;
  readonly icon: typeof Home;
}

export const navItems: readonly NavItem[] = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
  { label: 'Upload', to: '/upload', icon: UploadCloud },
  { label: 'Library', to: '/library', icon: BookOpen },
  { label: 'Profile', to: '/profile', icon: User },
];
