import { motion } from 'framer-motion';
import { Bookmark, BookOpen, Calendar, Camera, ChevronRight, Download, Edit, Eye, Lock, School, Upload, User, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { CollegeAutocomplete } from '../components/ui/CollegeAutocomplete';
import { universities } from '../data/mockData';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { materialTypeIcon } from '../lib/materialIcons';
import { timeAgo } from '../lib/timeAgo';
import { listRecentActivity, type ActivityItem } from '../services/activityService';
import { listMyUploadsForUI } from '../services/materialsService';
import { uploadAvatar } from '../services/profileService';
import { resizeImageFile } from '../lib/imageUtils';
import { cn } from '../lib/cn';

const AVATAR_PRESETS = [
  'https://i.pravatar.cc/400?img=12',
  'https://i.pravatar.cc/400?img=33',
  'https://i.pravatar.cc/400?img=68',
  'https://i.pravatar.cc/400?img=47',
  'https://i.pravatar.cc/400?img=11',
];

const collegesList = [...universities, 'College of Engineering', 'College of Science', 'School of Engineering'];
const branchesList = ['Computer Science', 'Mathematics', 'Electronics & Communication', 'Civil Engineering', 'Mechanical Engineering'];
const yearsList = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const semestersList = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

export function ProfilePage() {
  const { user, isExploring, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAcademicSaving, setIsAcademicSaving] = useState(false);
  const [academicError, setAcademicError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [editName, setEditName] = useState(user?.name ?? '');
  const [editUsername, setEditUsername] = useState(user?.username ?? '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar ?? '');
  const [editCover, setEditCover] = useState(user?.coverImage ?? '');

  const [editCollege, setEditCollege] = useState(user?.college || user?.university || collegesList[0]);
  const [editBranch, setEditBranch] = useState(user?.branch || user?.major || branchesList[0]);
  const [editYear, setEditYear] = useState(user?.year || yearsList[1]);
  const [editSemester, setEditSemester] = useState(user?.semester || semestersList[3]);

  const [uploads, setUploads] = useState<Material[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'uploaded' | 'saved' | 'viewed' | 'downloaded'>('all');

  const filteredActivities = activityItems.filter((item) => {
    if (activityFilter === 'all') return true;
    return item.type === activityFilter;
  });

  useEffect(() => {
    if (isExploring) {
      navigate('/', { replace: true });
    }
  }, [isExploring, navigate]);

  useEffect(() => {
    if (!user || !user.id) return;
    listMyUploadsForUI(user.id).then(setUploads);
    listRecentActivity(user.id).then(setActivityItems);
  }, [user]);

  if (!user) return null;

  const handleOpenEditModal = () => {
    setEditName(user.name);
    setEditUsername(user.username ?? user.name.toLowerCase().replace(/\s+/g, ''));
    setEditAvatar(user.avatar);
    setEditCover(user.coverImage ?? '');
    setSaveError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenAcademicModal = () => {
    setEditCollege(user.college || user.university || collegesList[0]);
    setEditBranch(user.branch || user.major || branchesList[0]);
    setEditYear(user.year || yearsList[1]);
    setEditSemester(user.semester || semestersList[3]);
    setAcademicError(null);
    setIsAcademicModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadAvatar(user.id, file);
      setEditAvatar(publicUrl);
    } catch (err) {
      try {
        const dataUrl = await resizeImageFile(file, 800);
        setEditAvatar(dataUrl);
      } catch (e) {
        console.error('Failed to resize avatar', e);
      }
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await resizeImageFile(file, 1200);
        setEditCover(dataUrl);
      } catch (e) {
        console.error('Failed to resize cover', e);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateUser({
        name: editName.trim(),
        username: editUsername.trim(),
        avatar: editAvatar,
        coverImage: editCover,
      });
      setIsEditModalOpen(false);
      showToast('Profile updated successfully!');
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      let msg = 'Failed to save changes. Please try again.';
      if (err?.code === '23505' || err?.message?.includes('duplicate key') || err?.message?.includes('username')) {
        msg = 'This username is already taken. Please choose another username.';
      } else if (err?.message) {
        msg = err.message;
      }
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAcademic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAcademicSaving) return;
    setIsAcademicSaving(true);
    setAcademicError(null);
    try {
      await updateUser({
        college: editCollege,
        university: editCollege,
        branch: editBranch,
        major: editBranch,
        year: editYear,
        semester: editSemester,
      });
      setIsAcademicModalOpen(false);
      showToast('Academic details updated successfully!');
    } catch (err: any) {
      console.error('Failed to save academic details:', err);
      setAcademicError(err?.message || 'Failed to save academic details. Please try again.');
    } finally {
      setIsAcademicSaving(false);
    }
  };

  const [activeProfileTab, setActiveProfileTab] = useState<'uploads' | 'activity'>('uploads');

  const memberSince = (() => {
    if (user?.createdAt) {
      const d = new Date(user.createdAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    }
    return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  })();

  return (
    <div className="flex flex-col gap-6 relative">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-3 shadow-lg border border-card-border animate-fade-in">
          {toastMessage.type === 'success' ? (
            <CheckCircle size={18} className="text-emerald-500" />
          ) : (
            <AlertCircle size={18} className="text-error" />
          )}
          <span className="text-body-sm font-medium text-on-surface">{toastMessage.text}</span>
        </div>
      )}

      {/* ── 1. Clean Profile Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-card-border bg-surface-container-low shadow-xs">
        {/* Cover Image Banner */}
        <div className="relative h-44 sm:h-52 md:h-56 w-full overflow-hidden bg-surface-container-high">
          {user.coverImage ? (
            <img src={user.coverImage} alt="Cover" className="h-full w-full object-cover object-center" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-primary/20 via-indigo-500/10 to-surface-container-high" />
          )}
          <button
            type="button"
            aria-label="Edit cover image"
            onClick={handleOpenEditModal}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 cursor-pointer transition-colors backdrop-blur-md"
            title="Update Cover Image"
          >
            <Camera size={14} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-0">
          {/* Top Row: Avatar & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            <div className="relative inline-block">
              <Avatar
                name={user.name}
                src={user.avatar}
                size={92}
                className="ring-4 ring-surface shadow-lg bg-surface"
              />
              <button
                type="button"
                onClick={handleOpenEditModal}
                title="Change Avatar"
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:scale-105 transition-transform cursor-pointer"
              >
                <Camera size={13} />
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Edit size={14} />}
                onClick={handleOpenEditModal}
              >
                Edit Profile
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Lock size={14} />}
                onClick={() => navigate('/settings')}
              >
                Settings
              </Button>
            </div>
          </div>

          {/* User Info Details */}
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">{user.name}</h1>
              {user.username && (
                <span className="text-sm font-medium text-on-surface-variant">@{user.username}</span>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-on-surface-variant">
              {(user.college || user.university) && (
                <span className="flex items-center gap-1.5">
                  <School size={14} className="text-primary shrink-0" />
                  {user.college || user.university}
                </span>
              )}
              {(user.branch || user.major) && (
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} className="text-on-surface-variant/70 shrink-0" />
                  {user.branch || user.major}
                </span>
              )}
              {(user.year || user.semester) && (
                <span>{[user.year, user.semester].filter(Boolean).join(' • ')}</span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-on-surface-variant/70 shrink-0" />
                Joined {memberSince}
              </span>
            </div>
          </div>

          {/* Stat Counters */}
          <div className="mt-5 pt-4 border-t border-card-border/60 flex items-center gap-8">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-on-surface">{user.stats.uploads}</span>
              <span className="text-xs text-on-surface-variant font-medium">Uploads</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-on-surface">{user.stats.downloads}</span>
              <span className="text-xs text-on-surface-variant font-medium">Downloads</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-on-surface">{user.stats.saved}</span>
              <span className="text-xs text-on-surface-variant font-medium">Saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Content Grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Tabbed Content (Uploads & Activity) */}
        <section className="flex flex-col gap-4">
          {/* Elevated Segmented Switcher */}
          <div className="flex items-center justify-between">
            <div className="inline-flex p-1 rounded-xl bg-surface-container-high/60 border border-card-border/70 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveProfileTab('uploads')}
                className={cn(
                  'relative flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer select-none',
                  activeProfileTab === 'uploads'
                    ? 'text-on-surface font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                )}
              >
                {activeProfileTab === 'uploads' && (
                  <motion.div
                    layoutId="activeProfileTabPill"
                    className="absolute inset-0 rounded-lg bg-surface-bright shadow-xs border border-card-border/80"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Upload size={15} className={activeProfileTab === 'uploads' ? 'text-primary' : ''} />
                  <span>My Uploads</span>
                </span>
                <span
                  className={cn(
                    'relative z-10 rounded-full px-1.5 py-0.2 text-[11px] font-semibold',
                    activeProfileTab === 'uploads'
                      ? 'bg-primary/10 text-primary font-bold ring-1 ring-primary/20'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  )}
                >
                  {uploads.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProfileTab('activity')}
                className={cn(
                  'relative flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer select-none',
                  activeProfileTab === 'activity'
                    ? 'text-on-surface font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                )}
              >
                {activeProfileTab === 'activity' && (
                  <motion.div
                    layoutId="activeProfileTabPill"
                    className="absolute inset-0 rounded-lg bg-surface-bright shadow-xs border border-card-border/80"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Eye size={15} className={activeProfileTab === 'activity' ? 'text-primary' : ''} />
                  <span>Recent Activity</span>
                </span>
                <span
                  className={cn(
                    'relative z-10 rounded-full px-1.5 py-0.2 text-[11px] font-semibold',
                    activeProfileTab === 'activity'
                      ? 'bg-primary/10 text-primary font-bold ring-1 ring-primary/20'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  )}
                >
                  {activityItems.length}
                </span>
              </button>
            </div>

            {activeProfileTab === 'uploads' && uploads.length > 0 && (
              <Link to="/profile/uploads" className="text-xs font-semibold text-primary hover:underline">
                View All ({uploads.length})
              </Link>
            )}
          </div>

          {/* Tab 1: Uploads Content */}
          {activeProfileTab === 'uploads' && (
            <div className="flex flex-col gap-3">
              {uploads.length > 0 ? (
                uploads.slice(0, 4).map((upload, index) => {
                  const TypeIcon = materialTypeIcon[upload.type];
                  return (
                    <motion.div
                      key={upload.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.04 }}
                    >
                      <Link to={`/materials/${upload.id}`} className="block group">
                        <Card hoverable className="flex items-start gap-3.5 p-4 transition-all">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                            <TypeIcon size={18} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-on-surface group-hover:text-primary transition-colors">
                              {upload.title}
                            </p>
                            {upload.description && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-on-surface-variant">
                                {upload.description}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-2.5 text-[11.5px] text-on-surface-variant/70">
                              <span className="rounded-md bg-surface-container px-2 py-0.5 font-medium text-on-surface">
                                {upload.subject}
                              </span>
                              <span>Uploaded {timeAgo(upload.uploadedAt)}</span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border bg-surface-container-low/50 py-12 px-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                    <Upload size={22} />
                  </div>
                  <h3 className="text-base font-semibold text-on-surface">No uploads yet</h3>
                  <p className="mt-1 text-xs text-on-surface-variant max-w-sm">
                    Share your study notes, past exam papers, or syllabus materials with fellow students.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    icon={<Upload size={14} />}
                    onClick={() => navigate('/upload')}
                  >
                    Upload Material
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Activity Content */}
          {activeProfileTab === 'activity' && (
            <div className="flex flex-col gap-3">
              {/* Activity Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(['all', 'uploaded', 'saved', 'viewed'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActivityFilter(filter)}
                    className={cn(
                      'capitalize px-3 py-1 rounded-lg transition-colors cursor-pointer font-medium',
                      activityFilter === filter
                        ? 'bg-primary text-white shadow-2xs font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container'
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <Card hoverable={false} padded={false} className="overflow-hidden">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => {
                    let Icon = Download;
                    let iconBg = 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400';
                    let labelStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';

                    if (activity.type === 'uploaded') {
                      Icon = Upload;
                      iconBg = 'text-primary bg-primary/10';
                      labelStyle = 'bg-primary/10 text-primary';
                    } else if (activity.type === 'saved') {
                      Icon = Bookmark;
                      iconBg = 'text-amber-600 bg-amber-500/10 dark:text-amber-400';
                      labelStyle = 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
                    } else if (activity.type === 'viewed') {
                      Icon = Eye;
                      iconBg = 'text-sky-600 bg-sky-500/10 dark:text-sky-400';
                      labelStyle = 'bg-sky-500/10 text-sky-700 dark:text-sky-300';
                    }

                    const rowContent = (
                      <div className="flex items-start gap-3 border-b border-card-border/60 px-4 py-3 last:border-b-0 hover:bg-surface-container-high/40 transition-colors cursor-pointer">
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                          <Icon size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] text-on-surface-variant">
                            <span className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider mr-1.5 ${labelStyle}`}>
                              {activity.label}
                            </span>
                            <span className="font-semibold text-on-surface hover:underline">{activity.target}</span>
                          </p>
                          <span className="mt-0.5 block text-[11px] text-on-surface-variant/70">{activity.timestamp}</span>
                        </div>
                      </div>
                    );

                    if (activity.materialId) {
                      return (
                        <Link key={activity.id} to={`/materials/${activity.materialId}`} className="block">
                          {rowContent}
                        </Link>
                      );
                    }

                    return <div key={activity.id}>{rowContent}</div>;
                  })
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-on-surface-variant">
                      No recent {activityFilter === 'all' ? 'activity' : `${activityFilter} materials`} found.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </section>

        {/* Right Column: Academic Information & Quick Settings */}
        <div className="flex flex-col gap-5">
          {/* Academic Card */}
          <Card hoverable={false} className="p-4">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <School size={16} className="text-primary" />
                <h3 className="text-[13.5px] font-bold text-on-surface">Academic Details</h3>
              </div>
              <button
                type="button"
                onClick={handleOpenAcademicModal}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-on-surface-variant/70 font-medium">Institution</span>
                <span className="font-semibold text-on-surface">{user.college || user.university || 'Not specified'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-on-surface-variant/70 font-medium">Branch / Department</span>
                <span className="font-semibold text-on-surface">{user.branch || user.major || 'Not specified'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-card-border/60">
                <div>
                  <span className="text-[11px] text-on-surface-variant/70 font-medium">Year</span>
                  <p className="font-semibold text-on-surface">{user.year || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-[11px] text-on-surface-variant/70 font-medium">Semester</span>
                  <p className="font-semibold text-on-surface">{user.semester || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Settings Card */}
          <Card hoverable={false} padded={false} className="overflow-hidden">
            <div className="px-4 py-3 border-b border-card-border/60 bg-surface-container-low/50">
              <h3 className="text-[13.5px] font-bold text-on-surface">Account Settings</h3>
            </div>
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="flex w-full items-center gap-3 border-b border-card-border/60 px-4 py-3 text-left text-xs text-on-surface hover:bg-surface-container-high/40 cursor-pointer transition-colors"
            >
              <User size={16} className="text-on-surface-variant" />
              <span className="flex-1 font-medium">Personal Information</span>
              <ChevronRight size={14} className="text-outline" />
            </button>
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-3 text-xs text-on-surface hover:bg-surface-container-high/40 cursor-pointer transition-colors"
            >
              <Lock size={16} className="text-on-surface-variant" />
              <span className="flex-1 font-medium">Security & Password</span>
              <ChevronRight size={14} className="text-outline" />
            </Link>
          </Card>
        </div>
      </div>

      {/* Edit Personal Information Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Personal Information">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.JPG,.JPEG,.PNG,.WEBP,.HEIC"
            className="hidden"
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
            onChange={handleFileChange}
          />
          <input
            type="file"
            ref={coverInputRef}
            accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.JPG,.JPEG,.PNG,.WEBP,.HEIC"
            className="hidden"
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
            onChange={handleCoverChange}
          />

          {/* Banner & Avatar Section */}
          <div className="relative">
            {/* Cover Banner Preview */}
            <div className="relative h-32 w-full rounded-xl overflow-hidden bg-surface-container-high border border-card-border/80 shadow-2xs">
              {editCover ? (
                <img src={editCover} alt="Cover Preview" className="h-full w-full object-cover object-center" />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-primary/15 via-indigo-500/10 to-surface-container-high" />
              )}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium px-2.5 py-1.5 backdrop-blur-md transition-all shadow-xs cursor-pointer"
                >
                  <Camera size={13} />
                  <span>{editCover ? 'Change banner' : 'Add banner'}</span>
                </button>
                {editCover && (
                  <button
                    type="button"
                    onClick={() => setEditCover('')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-xs cursor-pointer"
                    title="Remove banner"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Avatar & Photo Action Row */}
            <div className="flex items-end gap-3.5 px-2 -mt-9 mb-3">
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload profile photo"
              >
                <Avatar
                  name={editName || 'User'}
                  src={editAvatar}
                  size={72}
                  className="ring-4 ring-surface shadow-md bg-surface"
                />
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera size={20} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white ring-2 ring-surface shadow-xs group-hover:scale-110 transition-transform">
                  <Camera size={12} />
                </div>
              </div>

              <div className="flex flex-col gap-0.5 pb-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  >
                    Upload Photo
                  </button>
                  {editAvatar && (
                    <>
                      <span className="text-on-surface-variant/30 text-xs">•</span>
                      <button
                        type="button"
                        onClick={() => setEditAvatar('')}
                        className="text-xs font-medium text-error hover:underline transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-on-surface-variant/70">JPG, PNG or WEBP · Max 5MB</span>
              </div>
            </div>
          </div>

          {/* Preset Avatars Selector */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-container-high/30 border border-card-border/60 text-xs">
            <span className="text-[11px] text-on-surface-variant font-medium shrink-0">Avatar presets:</span>
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setEditAvatar(preset)}
                  className={cn(
                    'rounded-full p-0.5 border-2 transition-all cursor-pointer shrink-0',
                    editAvatar === preset
                      ? 'border-primary scale-110 shadow-xs'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  )}
                  title={`Preset ${idx + 1}`}
                >
                  <Avatar name={`Preset ${idx + 1}`} src={preset} size={26} />
                </button>
              ))}
            </div>
          </div>

          {/* Name & Username Inputs */}
          <div className="flex flex-col gap-3.5 mt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">
                Full Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="h-11 w-full rounded-xl bg-surface-container-lowest border border-card-border/90 px-3.5 text-sm font-medium text-on-surface placeholder:text-outline/50 shadow-2xs transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-on-surface">
                  Username <span className="text-error">*</span>
                </label>
                <span className="text-[11px] text-on-surface-variant/70">Public handle</span>
              </div>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3.5 text-sm font-semibold text-on-surface-variant/50 select-none">
                  @
                </span>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  required
                  className="h-11 w-full rounded-xl bg-surface-container-lowest border border-card-border/90 pl-8 pr-3.5 text-sm font-medium text-on-surface placeholder:text-outline/50 shadow-2xs transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono"
                />
              </div>
              <span className="text-[11px] text-on-surface-variant/70">
                Visible on your public profile and uploaded study materials.
              </span>
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 rounded-lg bg-error-container/20 border border-error/30 p-3 text-body-sm text-error">
              <AlertCircle size={18} className="shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-2.5 pt-3 border-t border-card-border/60">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Academic Details Modal */}
      <Modal open={isAcademicModalOpen} onClose={() => setIsAcademicModalOpen(false)} title="Edit Academic Details">
        <form onSubmit={handleSaveAcademic} className="flex flex-col gap-4">
          <CollegeAutocomplete
            label="College / University"
            placeholder="Type your college or university name"
            value={editCollege}
            onChange={setEditCollege}
          />

          <Select
            label="Branch / Major"
            options={branchesList}
            value={editBranch}
            onChange={(e) => setEditBranch(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Student Year"
              placeholder="1st year, 2nd year ..."
              value={editYear}
              onChange={(e) => setEditYear(e.target.value)}
            />

            <Select
              label="Semester"
              options={semestersList}
              value={editSemester}
              onChange={(e) => setEditSemester(e.target.value)}
            />
          </div>

          {academicError && (
            <div className="flex items-center gap-2 rounded-lg bg-error-container/20 border border-error/30 p-3 text-body-sm text-error">
              <AlertCircle size={18} className="shrink-0" />
              <span>{academicError}</span>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsAcademicModalOpen(false)} disabled={isAcademicSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isAcademicSaving}>
              {isAcademicSaving ? 'Saving...' : 'Save Academic Details'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProfilePage;
