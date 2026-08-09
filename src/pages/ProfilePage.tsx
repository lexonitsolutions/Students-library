import { motion } from 'framer-motion';
import { BookOpen, Camera, ChevronRight, Download, Edit, Lock, School, Trash2, Upload, User } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { IconButton } from '../components/ui/IconButton';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { myUploads, recentActivity, universities } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { materialTypeIcon } from '../lib/materialIcons';

const AVATAR_PRESETS = [
  'https://i.pravatar.cc/160?img=12',
  'https://i.pravatar.cc/160?img=33',
  'https://i.pravatar.cc/160?img=68',
  'https://i.pravatar.cc/160?img=47',
  'https://i.pravatar.cc/160?img=11',
];

const collegesList = [...universities, 'College of Engineering', 'College of Science', 'School of Engineering'];
const branchesList = ['Computer Science', 'Mathematics', 'Electronics & Communication', 'Civil Engineering', 'Mechanical Engineering'];
const yearsList = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const semestersList = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editName, setEditName] = useState(user?.name ?? '');
  const [editUsername, setEditUsername] = useState(user?.username ?? '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar ?? '');

  const [editCollege, setEditCollege] = useState(user?.college || user?.university || collegesList[0]);
  const [editBranch, setEditBranch] = useState(user?.branch || user?.major || branchesList[0]);
  const [editYear, setEditYear] = useState(user?.year || yearsList[1]);
  const [editSemester, setEditSemester] = useState(user?.semester || semestersList[3]);

  if (!user) return null;

  const handleOpenEditModal = () => {
    setEditName(user.name);
    setEditUsername(user.username ?? user.name.toLowerCase().replace(/\s+/g, ''));
    setEditAvatar(user.avatar);
    setIsEditModalOpen(true);
  };

  const handleOpenAcademicModal = () => {
    setEditCollege(user.college || user.university || collegesList[0]);
    setEditBranch(user.branch || user.major || branchesList[0]);
    setEditYear(user.year || yearsList[1]);
    setEditSemester(user.semester || semestersList[3]);
    setIsAcademicModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: editName,
      username: editUsername,
      avatar: editAvatar,
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
      <Card hoverable={false} className="relative flex flex-col items-center bg-inverse-surface py-10 text-center text-inverse-on-surface">
        <button
          type="button"
          aria-label="Edit profile"
          onClick={handleOpenEditModal}
          className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-inverse-on-surface hover:bg-white/20 cursor-pointer transition-colors"
        >
          <Edit size={16} />
        </button>
        <Avatar name={user.name} src={user.avatar} size={96} className="ring-4 ring-white/10" />
        <h1 className="mt-4 text-headline-lg text-inverse-on-surface">{user.name}</h1>
        {user.username && (
          <p className="mt-0.5 text-body-sm text-inverse-on-surface/70">@{user.username}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-label-sm">
            <School size={14} /> {user.college || user.university}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-label-sm">
            {user.branch || user.major}
          </span>
          {(user.year || user.semester) && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-label-sm">
              <BookOpen size={14} /> {[user.year, user.semester].filter(Boolean).join(' • ')}
            </span>
          )}
        </div>

        <div className="mt-8 grid w-full max-w-sm grid-cols-3 gap-4 rounded-xl bg-white px-4 py-4 text-on-surface">
          <div>
            <p className="text-headline-lg text-on-surface">{user.stats.uploads}</p>
            <p className="text-label-sm text-on-surface-variant">Uploads</p>
          </div>
          <div>
            <p className="text-headline-lg text-on-surface">{user.stats.downloads}</p>
            <p className="text-label-sm text-on-surface-variant">Downloads</p>
          </div>
          <div>
            <p className="text-headline-lg text-on-surface">{user.stats.saved}</p>
            <p className="text-label-sm text-on-surface-variant">Saved</p>
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
            {myUploads.slice(0, 2).map((upload, index) => {
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
                        <span>Uploaded {upload.uploadedAt}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <IconButton label="Edit upload">
                        <Edit size={16} />
                      </IconButton>
                      <IconButton label="Delete upload">
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
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
            <h2 className="mb-3 text-headline-md text-on-surface">Recent Activity</h2>
            <Card hoverable={false} padded={false}>
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 border-b border-card-border px-4 py-3.5 last:border-b-0">
                  <Download size={16} className="mt-0.5 shrink-0 text-outline" />
                  <p className="text-body-sm text-on-surface-variant">
                    <span className="font-medium text-on-surface">{activity.label}</span> {activity.target}
                    <span className="mt-0.5 block text-label-sm text-outline">{activity.timestamp}</span>
                  </p>
                </div>
              ))}
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

            <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <Avatar name={editName || 'User'} src={editAvatar} size={88} className="transition-opacity group-hover:opacity-80" />
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
            <Select
              label="Year"
              options={yearsList}
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
