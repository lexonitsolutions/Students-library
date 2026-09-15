import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Check,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  ThumbsUp,
  Loader2,
  MessageSquare,
  Sparkles,
  University,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSignupRedirect } from '../../hooks/useSignupRedirect';
import { generateQuickId } from '../../lib/idUtils';
import { supabase } from '../../lib/supabaseClient';
import { Avatar } from './Avatar';
import type { Material } from '../../data/types';
import { toMaterial } from '../../lib/materialMapper';
import { timeAgo } from '../../lib/timeAgo';
import { getLocalLikesCount } from '../../services/likesService';
import { getConversation } from '../../services/messagesService';
import { startDirectAdminConversation } from '../../services/messageRequestService';
import { ROOT_ADMIN_EMAIL } from '../../services/adminService';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface UploaderProfile {
  uploaderId: string;
  uploaderName: string;
  uploaderUsername?: string | null;
  uploaderAvatar: string;
  uploaderCoverImage?: string | null;
  uploaderUniversity?: string;
  uploaderCollege?: string;
  uploaderLocation?: string;
  uploaderUploadsCount?: number;
  uploaderJoinedAt?: string | null;
}

interface Props {
  profile: UploaderProfile | null;
  onClose: () => void;
  side?: 'left' | 'right';
}

// ── Component ─────────────────────────────────────────────────────────────────
export function UserProfilePanel({ profile, onClose, side = 'right' }: Props) {
  const { user, isExploring } = useAuth();
  const { openSignupModal } = useSignupRedirect();
  const navigate = useNavigate();

  const [totalViews, setTotalViews] = useState<number>(0);
  const [totalLikes, setTotalLikes] = useState<number>(0);
  const [totalUploads, setTotalUploads] = useState<number>(0);
  const [recentUploads, setRecentUploads] = useState<Material[]>([]);
  const [joinedAt, setJoinedAt] = useState<string | null>(profile?.uploaderJoinedAt || null);
  const [displayName, setDisplayName] = useState<string>(profile?.uploaderName || 'Student');
  const [displayUsername, setDisplayUsername] = useState<string | null>(profile?.uploaderUsername || null);
  const [displayCollege, setDisplayCollege] = useState<string>(
    profile?.uploaderCollege || profile?.uploaderUniversity || '',
  );
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isCheckingChat, setIsCheckingChat] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(profile?.uploaderCoverImage || null);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleCopyId = () => {
    if (!profile) return;
    navigator.clipboard.writeText(generateQuickId(profile.uploaderId));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Sync state with profile prop updates
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.uploaderName || 'Student');
      if (profile.uploaderUsername) setDisplayUsername(profile.uploaderUsername);
      if (profile.uploaderJoinedAt) setJoinedAt(profile.uploaderJoinedAt);
      if (profile.uploaderCollege || profile.uploaderUniversity) {
        setDisplayCollege(profile.uploaderCollege || profile.uploaderUniversity || '');
      }
      const localCover =
        typeof window !== 'undefined'
          ? localStorage.getItem(`quicklearnit.cover_${profile.uploaderId}`)
          : null;
      setCoverImage(profile.uploaderCoverImage || localCover || null);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.uploaderId) return;

    let isMounted = true;
    setIsLoadingStats(true);

    const fetchStats = async () => {
      // 1. Fetch public profile (for username, joined_at, college, university, name)
      try {
        const { data: prof } = await supabase
          .from('public_profiles')
          .select('name, username, university, college, joined_at, cover_image, is_deleted')
          .eq('id', profile.uploaderId)
          .maybeSingle();

        let foundCover: string | null = (prof as any)?.cover_image || null;
        if (prof && isMounted) {
          if (prof.is_deleted) setIsDeleted(true);
          if (prof.name) setDisplayName(prof.name);
          if (prof.username) setDisplayUsername(prof.username);
          if (prof.joined_at) setJoinedAt(prof.joined_at);
          const col = prof.college || prof.university;
          if (col && col.trim()) setDisplayCollege(col.trim());
          if (foundCover) setCoverImage(foundCover);
        }

        // If college/university or joined_at or cover_image is still missing, check profiles table
        if ((!prof?.college && !prof?.university) || !prof?.joined_at || !foundCover) {
          const { data: fullP } = await supabase
            .from('profiles')
            .select('created_at, college, university, username, cover_image')
            .eq('id', profile.uploaderId)
            .maybeSingle();
          if (fullP && isMounted) {
            if (fullP.created_at && !prof?.joined_at) setJoinedAt(fullP.created_at);
            if (fullP.username && !displayUsername) setDisplayUsername(fullP.username);
            const col = fullP.college || fullP.university;
            if (col && col.trim()) setDisplayCollege(col.trim());
            if ((fullP as any).cover_image) {
              setCoverImage((fullP as any).cover_image);
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching profile details:', err);
      }

      // 2. Fetch user's approved materials to calculate total views, likes, and get recent uploads
      try {
        const { data: materials } = await supabase
          .from('materials')
          .select('*')
          .eq('uploader_id', profile.uploaderId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (materials && isMounted) {
          setTotalUploads(materials.length);

          let views = 0;
          let likes = 0;
          materials.forEach((m) => {
            views += m.views_count || 0;
            const localLikes = getLocalLikesCount(m.id, (m as any).likes_count ?? (m as any).saves_count ?? 0);
            likes += localLikes;
          });

          setTotalViews(views);
          setTotalLikes(likes);

          // Map top 3 recent uploads to Material objects
          const recent = materials.slice(0, 3).map((row) =>
            toMaterial(row, {
              id: profile.uploaderId,
              name: profile.uploaderName,
              avatar_url: profile.uploaderAvatar,
              username: displayUsername,
              university: profile.uploaderUniversity || null,
              college: profile.uploaderCollege || null,
              branch: null,
              major: null,
              joined_at: joinedAt || undefined,
            }),
          );

          setRecentUploads(recent);
        }
      } catch (err) {
        console.warn('Error fetching materials for profile:', err);
      }

      if (isMounted) setIsLoadingStats(false);
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [profile, displayUsername, joinedAt, displayCollege]);

  if (!profile) return null;

  const uploaderQuickId = generateQuickId(profile.uploaderId);

  const formattedDate = joinedAt
    ? new Date(joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'September 2026';

  const usernameHandle = displayUsername
    ? displayUsername.startsWith('@')
      ? displayUsername
      : `@${displayUsername}`
    : `@${displayName.toLowerCase().replace(/\s+/g, '')}`;

  const collegeName =
    (displayCollege && displayCollege.trim()) ||
    (profile.uploaderCollege && profile.uploaderCollege.trim()) ||
    (profile.uploaderUniversity && profile.uploaderUniversity.trim()) ||
    '-';

  // ── Handle Message Click ──
  const handleMessageClick = async () => {
    if (!profile) return;
    if (isExploring || !user) {
      openSignupModal('/messages');
      return;
    }
    if (user.id === profile.uploaderId) return;

    setIsCheckingChat(true);
    try {
      const isMainAdmin = user.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();

      if (isMainAdmin) {
        const directConv = await startDirectAdminConversation({
          adminId: user.id,
          studentId: profile.uploaderId,
        });
        onClose();
        if (directConv?.conversationId) {
          navigate('/messages', { state: { conversationId: directConv.conversationId } });
          return;
        }
      }

      // Check if they already have an active conversation (are friends / connected)
      const conv = await getConversation(user.id, profile.uploaderId);
      onClose();

      if (conv) {
        // Direct friend/connection: open chat page immediately
        navigate('/messages', { state: { conversationId: conv.id } });
      } else {
        // Not in chat list: redirect to send message request tab with user preloaded
        navigate('/messages', {
          state: {
            tab: 'search',
            quickId: uploaderQuickId,
            targetUserId: profile.uploaderId,
          },
        });
      }
    } catch (err) {
      console.error('Failed to resolve conversation:', err);
      onClose();
      navigate('/messages', {
        state: {
          tab: 'search',
          quickId: uploaderQuickId,
          targetUserId: profile.uploaderId,
        },
      });
    } finally {
      setIsCheckingChat(false);
    }
  };

  const isOwnProfile = user?.id === profile.uploaderId;

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
            initial={{ x: side === 'left' ? '-100%' : '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: side === 'left' ? '-100%' : '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className={`fixed top-0 z-50 flex h-full w-full max-w-sm flex-col bg-surface ${
              side === 'left' ? 'left-0 border-r' : 'right-0 border-l'
            } border-card-border shadow-2xl overflow-y-auto`}
          >
            {/* ── Banner / Top Cover ── */}
            <div className="relative h-28 w-full bg-gradient-to-br from-primary/25 via-primary/10 to-indigo-500/15 overflow-hidden shrink-0 border-b border-card-border/40">
              {coverImage ? (
                <>
                  <img
                    src={coverImage}
                    alt="Profile Banner"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                  {/* Gradient overlay for top button contrast and smooth transition */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />
                </>
              ) : (
                <>
                  {/* Subtle decorative glow */}
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-indigo-500/15 blur-xl pointer-events-none" />
                </>
              )}

              {/* Tag / Profile Indicator */}
              <div className="absolute top-3.5 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface/80 border border-card-border/50 backdrop-blur-md text-[11px] font-medium text-on-surface-variant shadow-2xs">
                <Sparkles size={12} className="text-primary" />
                <span>Student Profile</span>
              </div>

              {/* Header Action Buttons (Message & Close) */}
              <div className="absolute top-3.5 right-4 flex items-center gap-2 z-10">
                {!isOwnProfile && (
                  <button
                    type="button"
                    onClick={handleMessageClick}
                    disabled={isCheckingChat}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/85 hover:bg-surface text-primary hover:text-primary-hover shadow-xs border border-card-border/60 backdrop-blur-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    title={`Send message to ${displayName}`}
                    aria-label="Send message"
                  >
                    {isCheckingChat ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <MessageSquare size={15} />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/85 hover:bg-surface text-on-surface-variant hover:text-on-surface shadow-xs border border-card-border/60 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                  aria-label="Close profile"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* ── Profile Identity Section ── */}
            <div className="relative px-6 pb-2 pt-0 flex flex-col items-center text-center">
              {/* Overlapping Avatar */}
              <div className="-mt-12 ring-4 ring-surface rounded-full shadow-lg bg-surface">
                <Avatar
                  name={displayName}
                  src={profile.uploaderAvatar}
                  size={84}
                  className="rounded-full"
                />
              </div>

              {/* Name & Handle */}
              <h2 className="mt-3 text-title-md font-bold text-on-surface tracking-tight leading-tight">
                {displayName}
              </h2>

              <p className="text-body-sm font-medium text-primary">
                {usernameHandle}
              </p>

              {!(isDeleted || displayName.toLowerCase() === 'studex user') && (
                <>
                  {/* User ID (Interactive Monospace Pill with Copy Feedback) */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-card-border/70 text-[11px] font-mono font-medium text-on-surface-variant transition-colors cursor-pointer group shadow-2xs"
                      title="Click to copy User ID"
                    >
                      <span className="text-on-surface-variant/60 font-sans text-[10px] uppercase font-bold tracking-wider">
                        ID
                      </span>
                      <span>{uploaderQuickId}</span>
                      {copiedId ? (
                        <Check size={12} className="text-emerald-500 animate-in fade-in" />
                      ) : (
                        <Copy
                          size={12}
                          className="text-on-surface-variant/40 group-hover:text-on-surface-variant transition-colors"
                        />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {!(isDeleted || displayName.toLowerCase() === 'studex user') && (
              <>

            {/* ── College & Member Since Info Card ── */}
            <div className="mx-5 my-4 rounded-2xl bg-surface-container-low border border-card-border/60 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-on-surface">
                {collegeName !== '-' ? (
                  <>
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <University size={14} />
                    </div>
                    <span className="font-semibold truncate">{collegeName}</span>
                  </>
                ) : (
                  <span className="font-semibold text-on-surface-variant pl-1">-</span>
                )}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-on-surface-variant">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant/70">
                  <Calendar size={13} />
                </div>
                <span className="font-medium">Member since {formattedDate}</span>
              </div>
            </div>

            {/* ── Stats Grid (Uploads, Views, Likes) ── */}
            <div className="grid grid-cols-3 gap-2.5 px-5 mb-4">
              <div className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-surface-container-low border border-card-border/60 py-3 px-2 shadow-2xs hover:border-primary/30 transition-colors">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText size={15} />
                </div>
                <span className="text-title-sm font-bold text-on-surface">
                  {isLoadingStats ? '-' : totalUploads}
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant">Uploads</span>
              </div>

              <div className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-surface-container-low border border-card-border/60 py-3 px-2 shadow-2xs hover:border-emerald-500/30 transition-colors">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Eye size={15} />
                </div>
                <span className="text-title-sm font-bold text-on-surface">
                  {isLoadingStats ? '-' : totalViews}
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant">Views</span>
              </div>

              <div className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-surface-container-low border border-card-border/60 py-3 px-2 shadow-2xs hover:border-primary/30 transition-colors">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ThumbsUp size={15} />
                </div>
                <span className="text-title-sm font-bold text-on-surface">
                  {isLoadingStats ? '-' : totalLikes}
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant">Likes</span>
              </div>
            </div>

            {/* ── Recent Uploads Section ── */}
            <div className="flex-1 px-5 py-3 border-t border-card-border/60">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Recent Uploads
                </h3>
                {recentUploads.length > 0 && (
                  <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                    {totalUploads} total
                  </span>
                )}
              </div>

              {isLoadingStats ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : recentUploads.length > 0 ? (
                <div className="flex flex-col gap-2.5 pb-6">
                  {recentUploads.map((material) => (
                    <Link
                      key={material.id}
                      to={`/materials/${material.id}`}
                      onClick={onClose}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-card-border/60 hover:bg-surface-container-high hover:border-primary/30 transition-all group shadow-2xs"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <FileText size={17} />
                        </div>
                        <div className="flex flex-col overflow-hidden text-left">
                          <span className="text-body-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                            {material.title}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {timeAgo(material.uploadedAt)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center flex flex-col items-center gap-2 py-6">
                  <FileText size={28} className="text-on-surface-variant/40" />
                  <p className="text-body-sm text-on-surface-variant">
                    No materials uploaded yet.
                  </p>
                </div>
              )}
            </div>
            </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default UserProfilePanel;

