import { motion } from 'framer-motion';
import { Bookmark, BookOpen, Camera, ChevronRight, Download, Edit, Lock, School, Upload, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { universities } from '../data/mockData';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { materialTypeIcon } from '../lib/materialIcons';
import { timeAgo } from '../lib/timeAgo';
import { listRecentActivity, type ActivityItem } from '../services/activityService';
import { listMyUploadsForUI } from '../services/materialsService';
import { uploadAvatar } from '../services/profileService';
import { resizeImageFile } from '../lib/imageUtils';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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
  const [activityFilter, setActivityFilter] = useState<'all' | 'uploaded' | 'saved' | 'downloaded'>('all');

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
    setIsEditModalOpen(true);
  };

  const handleOpenAcademicModal = () => {
    setEditCollege(user.college || user.university || collegesList[0]);
    setEditBranch(user.branch || user.major || branchesList[0]);
    setEditYear(user.year || yearsList[1]);
    setEditSemester(user.semester || semestersList[3]);
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
    await updateUser({
      name: editName,
      username: editUsername,
      avatar: editAvatar,
      coverImage: editCover,
    });
    setIsEditModalOpen(false);
  };

  const handleSaveAcademic = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      college: editCollege,
      university: editCollege,
      branch: editBranch,
      major: editBranch,
      year: editYear,
      semester: editSemester,
    });
    setIsAcademicModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card hoverable={false} className="relative flex flex-col items-center pt-0 text-center overflow-hidden px-0">
        <div className="relative w-full h-40 md:h-48 bg-surface-container-high shrink-0">
          {user.coverImage && (
            <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover object-center" />
          )}
          <button
            type="button"
            aria-label="Edit profile"
            onClick={handleOpenEditModal}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 cursor-pointer transition-colors backdrop-blur-md"
          >
            <Edit size={14} />
          </button>
        </div>
        
        <div className="relative z-10 flex flex-col items-center w-full px-4 pb-6 -mt-10">
          <Avatar name={user.name} src={user.avatar} size={88} className="ring-4 ring-surface shadow-sm" />
          <h1 className="mt-2 text-headline-md text-on-surface">{user.name}</h1>
          {user.username && (
            <p className="mt-0.5 text-body-sm text-on-surface-variant">@{user.username}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-label-sm text-on-surface shadow-sm transition-transform hover:scale-105">
              <School size={14} /> {user.college || user.university}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-label-sm text-on-surface shadow-sm transition-transform hover:scale-105">
              {user.branch || user.major}
            </span>
            {(user.year || user.semester) && (
              <span className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-label-sm text-on-surface shadow-sm transition-transform hover:scale-105">
                <BookOpen size={14} /> {[user.year, user.semester].filter(Boolean).join(' • ')}
              </span>
            )}
          </div>

          <div className="mt-5 grid w-full max-w-sm grid-cols-3 gap-4 rounded-xl bg-surface-container-low px-4 py-4 text-on-surface shadow-sm">
            <div>
              <p className="text-headline-md font-bold text-on-surface">{user.stats.uploads}</p>
              <p className="text-label-sm text-on-surface-variant">Uploads</p>
            </div>
            <div>
              <p className="text-headline-md font-bold text-on-surface">{user.stats.downloads}</p>
              <p className="text-label-sm text-on-surface-variant">Downloads</p>
            </div>
            <div>
              <p className="text-headline-md font-bold text-on-surface">{user.stats.saved}</p>
              <p className="text-label-sm text-on-surface-variant">Saved</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-headline-md text-on-surface">My Uploads</h2>
            <Link to="/profile/uploads" className="text-label-md font-semibold text-primary">
              View All
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {uploads.slice(0, 2).map((upload, index) => {
              const TypeIcon = materialTypeIcon[upload.type];
              return (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card hoverable={false} className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                      <TypeIcon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-md font-semibold text-on-surface">{upload.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-label-sm text-on-surface-variant">{upload.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-label-sm text-outline">
                        <span className="rounded-full bg-surface-container-low px-2 py-0.5">{upload.subject}</span>
                        <span>Uploaded {timeAgo(upload.uploadedAt)}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
            {uploads.length === 0 && (
              <p className="text-body-sm text-on-surface-variant">No uploads yet.</p>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-3 text-headline-md text-on-surface">Profile Settings</h2>
            <Card hoverable={false} padded={false}>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="flex w-full items-center gap-3 border-b border-card-border px-4 py-3.5 text-left text-body-sm text-on-surface hover:bg-surface-soft cursor-pointer transition-colors"
              >
                <User size={18} className="text-on-surface-variant" />
                <span className="flex-1 font-medium">Personal Information</span>
                <ChevronRight size={16} className="text-outline" />
              </button>
              <button
                type="button"
                onClick={handleOpenAcademicModal}
                className="flex w-full items-center gap-3 border-b border-card-border px-4 py-3.5 text-left text-body-sm text-on-surface hover:bg-surface-soft cursor-pointer transition-colors"
              >
                <School size={18} className="text-on-surface-variant" />
                <span className="flex-1 font-medium">Academic Details</span>
                <ChevronRight size={16} className="text-outline" />
              </button>
              <Link
                to="/settings"
                className="flex items-center gap-3 px-4 py-3.5 text-body-sm text-on-surface hover:bg-surface-soft cursor-pointer transition-colors"
              >
                <Lock size={18} className="text-on-surface-variant" />
                <span className="flex-1 font-medium">Security & Privacy</span>
                <ChevronRight size={16} className="text-outline" />
              </Link>
            </Card>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-headline-md text-on-surface">Recent Activity</h2>
              <div className="flex items-center gap-1 rounded-lg bg-surface-container-low p-1 border border-card-border text-label-sm">
                {(['all', 'uploaded', 'saved', 'downloaded'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActivityFilter(filter)}
                    className={`capitalize px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                      activityFilter === filter
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-soft'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <Card hoverable={false} padded={false}>
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
                  }

                  const rowContent = (
                    <div className="flex items-start gap-3 border-b border-card-border px-4 py-3.5 last:border-b-0 hover:bg-surface-soft transition-colors cursor-pointer">
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-body-sm text-on-surface-variant">
                          <span className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider mr-1.5 ${labelStyle}`}>
                            {activity.label}
                          </span>
                          <span className="font-medium text-on-surface hover:underline">{activity.target}</span>
                          {activity.type === 'uploaded' && activity.status === 'pending' && (
                             <span className="inline-block align-middle ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 whitespace-nowrap">
                               Pending Approval
                             </span>
                          )}
                        </p>
                        <span className="mt-1 block text-label-sm text-outline">{activity.timestamp}</span>
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
                  <p className="text-body-sm text-on-surface-variant">
                    No recent {activityFilter === 'all' ? 'activity' : `${activityFilter} materials`} found.
                  </p>
                </div>
              )}
            </Card>
          </section>
        </div>
      </div>

      {/* Edit Personal Information Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Personal Information">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 py-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              type="file"
              ref={coverInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />

            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-surface-container-high mb-4 group flex items-center justify-center cursor-pointer" onClick={() => coverInputRef.current?.click()}>
              {editCover ? (
                <img src={editCover} alt="Cover" className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
              ) : (
                <span className="text-on-surface-variant flex flex-col items-center gap-2"><Upload size={20}/> Upload Cover Image</span>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={24} />
              </div>
            </div>

            <div className="relative cursor-pointer group -mt-16" onClick={() => fileInputRef.current?.click()}>
              <Avatar name={editName || 'User'} src={editAvatar} size={88} className="transition-opacity group-hover:opacity-80 ring-4 ring-surface" />
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md group-hover:scale-110 transition-transform">
                <Camera size={16} />
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Upload size={14} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Photo from Gallery
            </Button>

            <div className="mt-2 flex flex-col items-center gap-1.5 w-full">
              <p className="text-label-sm text-on-surface-variant font-medium">Or select a preset avatar</p>
              <div className="flex gap-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditAvatar(preset)}
                    className={`rounded-full p-0.5 border-2 transition-all cursor-pointer ${
                      editAvatar === preset ? 'border-primary scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Avatar name={`Preset ${idx + 1}`} src={preset} size={32} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Input
            label="Full Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Enter your full name"
            required
          />

          <Input
            label="Username (Displayed on Home Page)"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            placeholder="e.g. davood_dev"
            required
          />

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Academic Details Modal */}
      <Modal open={isAcademicModalOpen} onClose={() => setIsAcademicModalOpen(false)} title="Edit Academic Details">
        <form onSubmit={handleSaveAcademic} className="flex flex-col gap-4">
          <Select
            label="College / University"
            options={collegesList}
            value={editCollege}
            onChange={(e) => setEditCollege(e.target.value)}
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

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsAcademicModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Academic Details
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProfilePage;
