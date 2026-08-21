import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  Bookmark,
  Calendar,
  Download,
  FileText,
  Heart,
  Mail,
  Trophy,
  University,
  X,
} from 'lucide-react';
import { mockMaterials } from '../../data/mockData';
import { getLocalDownloadsCount } from '../../services/likesService';
import { useAuth } from '../../hooks/useAuth';
import { generateQuickId, isIdPublic } from '../../lib/idUtils';
import { Avatar } from './Avatar';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface UploaderProfile {
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar: string;
  uploaderUniversity?: string;
  uploaderCollege?: string;
  uploaderLocation?: string;
}

interface Props {
  profile: UploaderProfile | null;
  onClose: () => void;
}

// ── Derive mock stats from mock materials ─────────────────────────────────────
function getProfileStats(uploaderId: string) {
  const uploads = mockMaterials.filter((m) => m.uploaderId === uploaderId);
  const totalDownloads = uploads.reduce((s, m) => s + getLocalDownloadsCount(m.id, m.downloads || 0), 0);
  const totalSaves = uploads.reduce((s, m) => s + (m.saves || 0), 0);
  const totalViews = uploads.reduce((s, m) => s + (m.views || 0), 0);
  return { uploads, totalDownloads, totalSaves, totalViews };
}

// Derive mock leaderboard rank — rank by total downloads across all uploaders
function getLeaderboardRank(uploaderId: string): number {
  const uploaderTotals = new Map<string, number>();
  for (const m of mockMaterials) {
    uploaderTotals.set(
      m.uploaderId,
      (uploaderTotals.get(m.uploaderId) ?? 0) + (m.downloads || 0),
    );
  }
  const sorted = [...uploaderTotals.entries()].sort((a, b) => b[1] - a[1]);
  const idx = sorted.findIndex(([id]) => id === uploaderId);
  return idx === -1 ? 99 : idx + 1;
}

// Mock email from name
function mockEmail(name: string) {
  return name.toLowerCase().replace(/\s+/g, '.') + '@quicklearnit.edu';
}

// Derive joined month/year
function getJoinedDate(uploaderId: string) {
  const uploads = mockMaterials.filter((m) => m.uploaderId === uploaderId);
  if (uploads.length > 0) {
    const dates = uploads.map((m) => new Date(m.uploadedAt).getTime());
    const earliest = new Date(Math.min(...dates));
    return earliest.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return 'August 2024';
}

// Rank medal color
function rankStyle(rank: number) {
  if (rank === 1) return { bg: 'bg-amber-50', text: 'text-amber-600', icon: '🥇' };
  if (rank === 2) return { bg: 'bg-slate-100', text: 'text-slate-500', icon: '🥈' };
  if (rank === 3) return { bg: 'bg-orange-50', text: 'text-orange-600', icon: '🥉' };
  return { bg: 'bg-primary/8', text: 'text-primary', icon: '🏅' };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function UserProfilePanel({ profile, onClose }: Props) {
  const { user } = useAuth();
  
  if (!profile) return null;

  const { uploads, totalDownloads, totalSaves } = getProfileStats(profile.uploaderId);
  const rank = getLeaderboardRank(profile.uploaderId);
  const { bg: rankBg, text: rankText, icon: rankIcon } = rankStyle(rank);
  const email = mockEmail(profile.uploaderName);
  const joinedDate = getJoinedDate(profile.uploaderId);

  const uploaderQuickId = generateQuickId(profile.uploaderId);
  const showId = user?.id === profile.uploaderId || isIdPublic(profile.uploaderId);

  return (
    <AnimatePresence>
      {profile && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Slide-in Panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-surface border-l border-card-border shadow-2xl overflow-y-auto"
          >
            {/* ── Header ── */}
            <div className="relative flex flex-col items-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pb-6 pt-12">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                aria-label="Close profile"
              >
                <X size={16} />
              </button>

              {/* Avatar */}
              <div className="ring-4 ring-primary/20 rounded-full shadow-lg">
                <Avatar
                  name={profile.uploaderName}
                  src={profile.uploaderAvatar}
                  size={80}
                  className="rounded-full"
                />
              </div>

              {/* Name */}
              <h2 className="mt-4 text-title-lg font-bold text-on-surface text-center leading-tight">
                {profile.uploaderName}
              </h2>

              {/* Quick ID */}
              {showId && (
                <p className="mt-1 text-label-md font-medium text-on-surface-variant font-mono tracking-wider">
                  ID: {uploaderQuickId}
                </p>
              )}

              {/* Leaderboard rank badge */}
              <div className={`mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-label-sm font-bold ${rankBg} ${rankText}`}>
                <Trophy size={13} />
                <span>Leaderboard #{rank}</span>
                <span>{rankIcon}</span>
              </div>
            </div>

            {/* ── Info rows ── */}
            <div className="flex flex-col gap-2 px-6 py-4 border-b border-card-border">
              <div className="flex items-center gap-3 text-body-sm text-on-surface-variant">
                <Mail size={15} className="shrink-0 text-primary/70" />
                <span className="truncate">{email}</span>
              </div>
              {profile.uploaderUniversity && (
                <div className="flex items-start gap-3 text-body-sm text-on-surface-variant">
                  <University size={15} className="shrink-0 mt-0.5 text-primary/70" />
                  <span>{profile.uploaderUniversity}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-body-sm text-on-surface-variant">
                <Calendar size={15} className="shrink-0 text-primary/70" />
                <span>Member since {joinedDate}</span>
              </div>
            </div>

            {/* ── Stats grid ── */}
            <div className="grid grid-cols-3 gap-3 px-6 py-5 border-b border-card-border">
              {[
                { label: 'Uploads', value: uploads.length, icon: <FileText size={18} className="text-primary" /> },
                { label: 'Downloads', value: totalDownloads.toLocaleString(), icon: <Download size={18} className="text-emerald-500" /> },
                { label: 'Saved Docs', value: totalSaves.toLocaleString(), icon: <Bookmark size={18} className="text-rose-500" /> },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  title={label}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-surface-container-low border border-card-border py-3.5 px-2"
                >
                  {icon}
                  <span className="text-title-md font-bold text-on-surface">{value}</span>
                </div>
              ))}
            </div>

            {/* ── Leaderboard detail ── */}
            <div className="px-6 py-4 border-b border-card-border">
              <div className="flex items-center gap-2 mb-3">
                <Award size={16} className="text-primary" />
                <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wide">Leaderboard Standing</h3>
              </div>
              <div className={`flex items-center justify-between rounded-2xl border border-card-border px-4 py-3 ${rankBg}`}>
                <div>
                  <p className={`text-title-lg font-extrabold ${rankText}`}>#{rank}</p>
                  <p className="text-label-sm text-on-surface-variant font-medium">Global Rank</p>
                </div>
                <div className="text-right">
                  <p className="text-title-md font-bold text-on-surface">{totalDownloads.toLocaleString()}</p>
                  <p className="text-label-sm text-on-surface-variant font-medium">Total downloads</p>
                </div>
                <span className="text-4xl">{rankIcon}</span>
              </div>
            </div>

            {/* ── Recent uploads ── */}
            {uploads.length > 0 && (
              <div className="px-6 py-4 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-primary" />
                  <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wide">Recent Uploads</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {uploads.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-start gap-3 rounded-xl border border-card-border bg-surface-container-low px-3 py-2.5"
                    >
                      <div
                        className={`flex h-8 w-7 shrink-0 items-center justify-center rounded-md text-white text-[9px] font-bold uppercase
                          ${m.type === 'past-paper' ? 'bg-amber-600' : m.type === 'doc' ? 'bg-blue-600' : 'bg-red-600'}
                        `}
                      >
                        {m.type === 'past-paper' ? 'PAPER' : m.type === 'doc' ? 'DOC' : 'PDF'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body-sm font-semibold text-on-surface leading-snug">{m.title}</p>
                        <p className="text-label-xs text-on-surface-variant mt-0.5 mb-1">{m.subject}</p>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-label-xs font-semibold text-emerald-500">
                            <Download size={11} />
                            {(m.downloads || 0).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-label-xs font-semibold text-rose-500">
                            <Heart size={11} />
                            {(m.saves || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default UserProfilePanel;
