import { motion } from 'framer-motion';
import { ChevronRight, Download, Edit, Lock, School, Trash2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { IconButton } from '../components/ui/IconButton';
import { myUploads, recentActivity } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { materialTypeIcon } from '../lib/materialIcons';

const settingsLinks = [
  { label: 'Personal Information', icon: User },
  { label: 'Academic Details', icon: School },
  { label: 'Security & Privacy', icon: Lock },
];

export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <Card hoverable={false} className="relative flex flex-col items-center bg-inverse-surface py-10 text-center text-inverse-on-surface">
        <button
          type="button"
          aria-label="Edit profile photo"
          className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-inverse-on-surface hover:bg-white/20 cursor-pointer"
        >
          <Edit size={16} />
        </button>
        <Avatar name={user.name} src={user.avatar} size={96} className="ring-4 ring-white/10" />
        <h1 className="mt-4 text-headline-lg text-inverse-on-surface">{user.name}</h1>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-label-sm">
            <School size={14} /> {user.university}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-label-sm">
            {user.major}
          </span>
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
              {settingsLinks.map((link) => (
                <Link
                  key={link.label}
                  to="/settings"
                  className="flex items-center gap-3 border-b border-card-border px-4 py-3.5 text-body-sm text-on-surface last:border-b-0 hover:bg-surface-soft"
                >
                  <link.icon size={18} className="text-on-surface-variant" />
                  <span className="flex-1">{link.label}</span>
                  <ChevronRight size={16} className="text-outline" />
                </Link>
              ))}
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
    </div>
  );
}

export default ProfilePage;
