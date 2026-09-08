import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Eye, FileText, Heart, University, X, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { generateQuickId, isIdPublic } from '../../lib/idUtils';
import { supabase } from '../../lib/supabaseClient';
import { Avatar } from './Avatar';
import type { Material } from '../../data/types';
import { toMaterial } from '../../lib/materialMapper';
import { timeAgo } from '../../lib/timeAgo';
import { getLocalLikesCount } from '../../services/likesService';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface UploaderProfile {
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar: string;
  uploaderUniversity?: string;
  uploaderCollege?: string;
  uploaderLocation?: string;
  uploaderUploadsCount?: number;
  uploaderJoinedAt?: string;
}

interface Props {
  profile: UploaderProfile | null;
  onClose: () => void;
  side?: 'left' | 'right';
}

// ── Component ─────────────────────────────────────────────────────────────────
export function UserProfilePanel({ profile, onClose, side = 'right' }: Props) {
  const { user } = useAuth();
  const [totalViews, setTotalViews] = useState<number>(0);
  const [totalLikes, setTotalLikes] = useState<number>(0);
  const [totalUploads, setTotalUploads] = useState<number>(0);
  const [recentUploads, setRecentUploads] = useState<Material[]>([]);
  const [joinedAt, setJoinedAt] = useState<string | null>(profile?.uploaderJoinedAt || null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (!profile?.uploaderId) return;

    let isMounted = true;
    setIsLoadingStats(true);

    const fetchStats = async () => {
      // Fetch public profile if we don't have joinedAt yet
      if (!joinedAt) {
        const { data: prof } = await supabase
          .from('public_profiles')
          .select('joined_at')
          .eq('id', profile.uploaderId)
          .single();
        if (prof?.joined_at && isMounted) setJoinedAt(prof.joined_at);
      }

      // Fetch user's approved materials to calculate total views, likes, and get recent uploads
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
          const localLikes = getLocalLikesCount(m.id, (m as any).saves_count || 0);
          likes += localLikes;
        });
        
        setTotalViews(views);
        setTotalLikes(likes);

        // Map top 3 recent uploads to Material objects
        const recent = materials.slice(0, 3).map(row => toMaterial(row, {
          id: profile.uploaderId,
          name: profile.uploaderName,
          avatar_url: profile.uploaderAvatar,
          username: null,
          university: profile.uploaderUniversity || null,
          college: profile.uploaderCollege || null,
          branch: null,
          major: null,
        }));
        
        setRecentUploads(recent);
      }
      if (isMounted) setIsLoadingStats(false);
    };

    fetchStats();
    return () => { isMounted = false; };
  }, [profile]);

  // Update joined_at when profile changes if it has one
  useEffect(() => {
    if (profile?.uploaderJoinedAt) {
      setJoinedAt(profile.uploaderJoinedAt);
    }
  }, [profile]);

  if (!profile) return null;

  const uploaderQuickId = generateQuickId(profile.uploaderId);
  const showId = user?.id === profile.uploaderId || isIdPublic(profile.uploaderId);

  const formattedDate = joinedAt
    ? new Date(joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

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
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className={`fixed top-0 z-50 flex h-full w-full max-w-sm flex-col bg-surface ${
              side === 'left' ? 'left-0 border-r' : 'right-0 border-l'
            } border-card-border shadow-2xl overflow-y-auto`}
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
            </div>

            {/* ── Info rows ── */}
            <div className="flex flex-col gap-2 px-6 py-4 border-b border-card-border">
              {(profile.uploaderUniversity || profile.uploaderCollege) && (
                <div className="flex items-start gap-3 text-body-sm text-on-surface-variant">
                  <University size={15} className="shrink-0 mt-0.5 text-primary/70" />
                  <span>{profile.uploaderUniversity || profile.uploaderCollege}</span>
                </div>
              )}
              {formattedDate && (
                <div className="flex items-center gap-3 text-body-sm text-on-surface-variant">
                  <Calendar size={15} className="shrink-0 text-primary/70" />
                  <span>Member since {formattedDate}</span>
                </div>
              )}
            </div>

            {/* ── Stats grid ── */}
            <div className="grid grid-cols-3 gap-3 px-6 py-5 border-b border-card-border">
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-surface-container-low border border-card-border py-3.5 px-2">
                <FileText size={18} className="text-primary" />
                <span className="text-title-md font-bold text-on-surface">{isLoadingStats ? '-' : totalUploads}</span>
                <span className="text-label-xs text-on-surface-variant">Uploads</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-surface-container-low border border-card-border py-3.5 px-2">
                <Eye size={18} className="text-emerald-500" />
                <span className="text-title-md font-bold text-on-surface">{isLoadingStats ? '-' : totalViews}</span>
                <span className="text-label-xs text-on-surface-variant">Views</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-surface-container-low border border-card-border py-3.5 px-2">
                <Heart size={18} className="text-rose-500" />
                <span className="text-title-md font-bold text-on-surface">{isLoadingStats ? '-' : totalLikes}</span>
                <span className="text-label-xs text-on-surface-variant">Likes</span>
              </div>
            </div>

            {/* ── Recent Uploads ── */}
            <div className="flex-1 px-6 py-6 bg-surface">
              <h3 className="text-title-sm font-bold text-on-surface mb-4">Recent Uploads</h3>
              {isLoadingStats ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : recentUploads.length > 0 ? (
                <div className="flex flex-col gap-3 pb-6">
                  {recentUploads.map(material => (
                    <Link
                      key={material.id}
                      to={`/materials/${material.id}`}
                      onClick={onClose}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-card-border hover:bg-surface-container-high transition-colors group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-${material.accentColor}-100 text-${material.accentColor}-700`}>
                          <FileText size={20} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-body-md font-semibold text-on-surface truncate">
                            {material.title}
                          </span>
                          <span className="text-label-sm text-on-surface-variant">
                            {timeAgo(material.uploadedAt)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-on-surface-variant group-hover:text-primary transition-colors shrink-0 ml-2" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center flex flex-col items-center gap-2 py-4">
                  <FileText size={32} className="text-on-surface-variant/40" />
                  <p className="text-body-sm text-on-surface-variant">
                    This user hasn't uploaded any materials yet.
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default UserProfilePanel;
