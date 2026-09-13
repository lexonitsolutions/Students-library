import { Home, Trophy, UploadCloud, BookOpen, User, MessageCircle } from 'lucide-react';

export interface NavItem {
  readonly label: string;
  readonly to: string;
  readonly icon: typeof Home;
  readonly badge?: string;
}

export const navItems: readonly NavItem[] = [
  { label: 'Home', to: '/dashboard', icon: Home },
  { label: 'Messages', to: '/messages', icon: MessageCircle },
  { label: 'Leaderboard', to: '/leaderboard', icon: Trophy },
  { label: 'Upload', to: '/upload', icon: UploadCloud },
  { label: 'Library', to: '/library', icon: BookOpen },
  { label: 'Profile', to: '/profile', icon: User },
];
