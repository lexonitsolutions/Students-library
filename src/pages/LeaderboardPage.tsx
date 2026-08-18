import { motion } from 'framer-motion';
import {
  Award,
  Crown,
  Eye,
  Trophy,
  UploadCloud,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/cn';

export interface LeaderboardStudent {
  id: string;
  name: string;
  username: string;
  avatar: string;
  university: string;
  branch: string;
  totalUploads: number;
  totalViews: number;
  totalDownloads: number;
  badge?: string;
}

const mockLeaderboardStudents: LeaderboardStudent[] = [
  {
    id: 's1',
    name: 'Aarav Sharma',
    username: '@aarav_sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    university: 'Fergusson College Pune',
    branch: 'Computer Science & Engineering',
    totalUploads: 48,
    totalViews: 14250,
    totalDownloads: 3820,
    badge: 'Master Scholar',
  },
  {
    id: 's2',
    name: 'Rohan Mehta',
    username: '@rohan_m',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    university: 'IIT Bombay',
    branch: 'Electrical Engineering',
    totalUploads: 36,
    totalViews: 18900,
    totalDownloads: 4100,
    badge: 'Top Creator',
  },
  {
    id: 's3',
    name: 'Ananya Patel',
    username: '@ananya_p',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    university: 'BITS Pilani',
    branch: 'Data Science & AI',
    totalUploads: 31,
    totalViews: 12400,
    totalDownloads: 2950,
    badge: 'Star Student',
  },
  {
    id: 's4',
    name: 'Vikramaditya Roy',
    username: '@vikram_roy',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    university: 'Delhi Technological University',
    branch: 'Machine Learning',
    totalUploads: 27,
    totalViews: 9800,
    totalDownloads: 2100,
  },
  {
    id: 's5',
    name: 'Priya Iyer',
    username: '@priya_iyer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    university: 'Anna University',
    branch: 'Electronics and Communication (ECE)',
    totalUploads: 24,
    totalViews: 8900,
    totalDownloads: 1950,
  },
  {
    id: 's6',
    name: 'Siddharth Verma',
    username: '@sid_v',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
    university: 'VIT Vellore',
    branch: 'Mechanical Engineering',
    totalUploads: 22,
    totalViews: 7600,
    totalDownloads: 1600,
  },
  {
    id: 's7',
    name: 'Neha Kulkarni',
    username: '@neha_k',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    university: 'Pune University (SPPU)',
    branch: 'Chemical Engineering',
    totalUploads: 19,
    totalViews: 6800,
    totalDownloads: 1450,
  },
  {
    id: 's8',
    name: 'Aditya Nair',
    username: '@aditya_nair',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    university: 'NIT Trichy',
    branch: 'Civil Engineering',
    totalUploads: 16,
    totalViews: 5900,
    totalDownloads: 1200,
  },
];

export function LeaderboardPage() {
  const { user } = useAuth();

  // Dropdown Filter States
  const [sortBy, setSortBy] = useState<'uploads' | 'views'>('uploads');
  const [students, setStudents] = useState<LeaderboardStudent[]>(mockLeaderboardStudents);

  useEffect(() => {
    // If current user has uploaded materials, merge current user into leaderboard
    if (user) {
      setStudents((prev) => {
        const exists = prev.some((s) => s.id === user.id);
        if (!exists) {
          const userStudent: LeaderboardStudent = {
            id: user.id,
            name: user.name,
            username: `@${user.name.toLowerCase().replace(/\s+/g, '_')}`,
            avatar: user.avatar || 'https://i.pravatar.cc/80?u=user',
            university: user.university || 'Fergusson College Pune',
            branch: user.major || 'Engineering',
            totalUploads: Math.max(user.stats?.uploads || 1, 1),
            totalViews: (user.stats?.uploads || 1) * 350,
            totalDownloads: (user.stats?.uploads || 1) * 95,
            badge: 'Active Contributor',
          };
          return [userStudent, ...prev];
        }
        return prev;
      });
    }
  }, [user]);

  // Sorted Leaderboard List
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (sortBy === 'views') {
        return b.totalViews - a.totalViews;
      }
      return b.totalUploads - a.totalUploads;
    });
  }, [students, sortBy]);

  const top1 = sortedStudents[0];
  const top2 = sortedStudents[1];
  const top3 = sortedStudents[2];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-card-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
              <Trophy size={22} />
            </span>
            <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg font-bold">
              Student Leaderboard
            </h1>
          </div>
          <p className="mt-1 text-body-sm text-on-surface-variant sm:text-body-md">
            Celebrating top student contributors and most viewed academic resources across universities.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-label-sm font-bold text-on-surface-variant shrink-0">Rank By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'uploads' | 'views')}
            className="rounded-xl border border-card-border bg-white px-3.5 py-2 text-body-sm font-semibold text-on-surface shadow-xs focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="uploads">🏆 Top Uploaders (Most Papers & Notes)</option>
            <option value="views">👁️ Most Viewed Students (Highest Reach)</option>
          </select>
        </div>
      </div>

      {/* Top 3 Podium Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end pt-4 sm:pt-8">
        {/* #2 Rank - Silver */}
        {top2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="order-2 sm:order-1"
          >
            <Card className="flex flex-col items-center text-center p-6 border-2 border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-500/5 to-transparent relative overflow-hidden">
              <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-label-md shadow-xs">
                #2
              </span>

              <div className="relative mb-3">
                <Avatar src={top2.avatar} name={top2.name} size={64} className="ring-4 ring-slate-300" />
                <span className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-slate-600 px-2 py-0.5 text-label-xs font-bold text-white shadow-md">
                  SILVER
                </span>
              </div>

              <h3 className="text-headline-sm font-bold text-on-surface mt-2">{top2.name}</h3>
              <p className="text-label-sm text-on-surface-variant truncate max-w-full">{top2.university}</p>
              <p className="text-label-xs text-outline mt-0.5">{top2.branch}</p>

              <div className="mt-4 flex items-center justify-center gap-4 rounded-xl bg-surface-soft px-4 py-2 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-label-xs text-on-surface-variant font-medium">Uploads</span>
                  <span className="text-headline-sm font-bold text-primary">{top2.totalUploads}</span>
                </div>
                <div className="h-6 w-[1px] bg-card-border" />
                <div className="flex flex-col items-center">
                  <span className="text-label-xs text-on-surface-variant font-medium">Total Views</span>
                  <span className="text-headline-sm font-bold text-emerald-600">{top2.totalViews.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* #1 Rank - Gold (Center Podium) */}
        {top1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="order-1 sm:order-2 sm:-translate-y-4"
          >
            <Card className="flex flex-col items-center text-center p-7 border-2 border-amber-400 dark:border-amber-600 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent relative overflow-hidden shadow-lg">
              <span className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-amber-950 font-extrabold text-label-lg shadow-md">
                #1
              </span>

              <div className="relative mb-3">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                  <Crown size={28} />
                </div>
                <Avatar src={top1.avatar} name={top1.name} size={80} className="ring-4 ring-amber-400 shadow-md" />
                <span className="absolute -bottom-2.5 right-1/2 translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-label-xs font-extrabold text-white shadow-md uppercase tracking-wider">
                  CHAMPION
                </span>
              </div>

              <h3 className="text-headline-md font-extrabold text-on-surface mt-3">{top1.name}</h3>
              <p className="text-label-md font-semibold text-amber-600 dark:text-amber-400">{top1.university}</p>
              <p className="text-label-sm text-outline mt-0.5">{top1.branch}</p>

              <div className="mt-5 flex items-center justify-center gap-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-5 py-2.5 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-label-xs text-on-surface-variant font-bold uppercase tracking-wider">Uploads</span>
                  <span className="text-headline-md font-extrabold text-amber-600 dark:text-amber-400">{top1.totalUploads}</span>
                </div>
                <div className="h-8 w-[1px] bg-amber-500/30" />
                <div className="flex flex-col items-center">
                  <span className="text-label-xs text-on-surface-variant font-bold uppercase tracking-wider">Total Views</span>
                  <span className="text-headline-md font-extrabold text-emerald-600">{top1.totalViews.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* #3 Rank - Bronze */}
        {top3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="order-3"
          >
            <Card className="flex flex-col items-center text-center p-6 border-2 border-amber-700/40 bg-gradient-to-b from-amber-700/5 to-transparent relative overflow-hidden">
              <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-800 text-amber-100 font-bold text-label-md shadow-xs">
                #3
              </span>

              <div className="relative mb-3">
                <Avatar src={top3.avatar} name={top3.name} size={64} className="ring-4 ring-amber-700/60" />
                <span className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-amber-800 px-2 py-0.5 text-label-xs font-bold text-white shadow-md">
                  BRONZE
                </span>
              </div>

              <h3 className="text-headline-sm font-bold text-on-surface mt-2">{top3.name}</h3>
              <p className="text-label-sm text-on-surface-variant truncate max-w-full">{top3.university}</p>
              <p className="text-label-xs text-outline mt-0.5">{top3.branch}</p>

              <div className="mt-4 flex items-center justify-center gap-4 rounded-xl bg-surface-soft px-4 py-2 w-full">
                <div className="flex flex-col items-center">
                  <span className="text-label-xs text-on-surface-variant font-medium">Uploads</span>
                  <span className="text-headline-sm font-bold text-primary">{top3.totalUploads}</span>
                </div>
                <div className="h-6 w-[1px] bg-card-border" />
                <div className="flex flex-col items-center">
                  <span className="text-label-xs text-on-surface-variant font-medium">Total Views</span>
                  <span className="text-headline-sm font-bold text-emerald-600">{top3.totalViews.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Full Leaderboard Table List */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
            <Award size={20} className="text-primary" />
            <span>Full Rankings ({sortedStudents.length} Students)</span>
          </h2>
          <span className="text-label-sm font-semibold text-on-surface-variant">
            Sorted by {sortBy === 'uploads' ? 'Total Uploaded Papers' : 'Total Resource Views'}
          </span>
        </div>

        <Card padded={false} hoverable={false} className="overflow-hidden border border-card-border">
          <div className="divide-y divide-card-border">
            {sortedStudents.map((student, index) => {
              const rank = index + 1;
              const isCurrentUser = user && student.id === user.id;

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  className={cn(
                    'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors',
                    isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-surface-soft'
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Rank Badge */}
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-extrabold text-label-md shadow-xs',
                        rank === 1
                          ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-400'
                          : rank === 2
                            ? 'bg-slate-300 text-slate-800 ring-2 ring-slate-300'
                            : rank === 3
                              ? 'bg-amber-800 text-amber-100 ring-2 ring-amber-800'
                              : 'bg-surface-soft text-on-surface border border-card-border'
                      )}
                    >
                      #{rank}
                    </span>

                    <Avatar src={student.avatar} name={student.name} size={44} className="shrink-0" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-body-md font-bold text-on-surface">{student.name}</p>
                        {isCurrentUser && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-label-xs font-bold text-white">
                            YOU
                          </span>
                        )}
                        {student.badge && (
                          <span className="hidden sm:inline-block rounded-full bg-amber-500/10 px-2.5 py-0.5 text-label-xs font-semibold text-amber-600 border border-amber-500/30">
                            {student.badge}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-label-sm text-on-surface-variant">
                        {student.university} &bull; <span className="text-outline">{student.branch}</span>
                      </p>
                    </div>
                  </div>

                  {/* Uploads & Views Counters */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-card-border">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                        <UploadCloud size={16} />
                      </span>
                      <div>
                        <p className="text-label-xs text-outline font-semibold uppercase">Uploads</p>
                        <p className="text-body-md font-extrabold text-on-surface">{student.totalUploads} Papers</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <Eye size={16} />
                      </span>
                      <div>
                        <p className="text-label-xs text-outline font-semibold uppercase">Views</p>
                        <p className="text-body-md font-extrabold text-emerald-600">{student.totalViews.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default LeaderboardPage;
