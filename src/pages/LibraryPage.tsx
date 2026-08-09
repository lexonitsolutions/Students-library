import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Grid2x2, List, MoreVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { IconButton } from '../components/ui/IconButton';
import { Tabs } from '../components/ui/Tabs';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { accentBg, materialTypeIcon } from '../lib/materialIcons';
import { cn } from '../lib/cn';
import { timeAgo } from '../lib/timeAgo';
import { listDownloadedMaterialsForUI, listSavedMaterialsForUI } from '../services/materialsService';

const tabs = ['Saved', 'Downloaded', 'Recently Viewed'] as const;

export function LibraryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Saved');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'Recently Viewed') {
      setItems([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      const data =
        activeTab === 'Saved' ? await listSavedMaterialsForUI(user.id) : await listDownloadedMaterialsForUI(user.id);
      if (active) {
        setItems(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeTab, user]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">Your Library</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">Manage and organize your study materials.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-surface-container-low p-1">
          <IconButton
            label="Grid view"
            size={32}
            onClick={() => setView('grid')}
            className={view === 'grid' ? 'bg-white shadow-sm' : undefined}
          >
            <Grid2x2 size={16} />
          </IconButton>
          <IconButton
            label="List view"
            size={32}
            onClick={() => setView('list')}
            className={view === 'list' ? 'bg-white shadow-sm' : undefined}
          >
            <List size={16} />
          </IconButton>
        </div>
      </div>

      <Tabs tabs={tabs as unknown as string[]} active={activeTab} onChange={(tab) => setActiveTab(tab as (typeof tabs)[number])} />

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {!loading && items.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState
                icon={<BookOpen size={24} />}
                title={`No ${activeTab.toLowerCase()} materials yet`}
                description="Your documents, videos, and study resources will appear here. Start exploring to build your personal library."
                actionLabel="Explore Resources"
                onAction={() => navigate('/explore')}
              />
            </motion.div>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                view === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col gap-3',
              )}
            >
              {items.map((item) => {
                const TypeIcon = materialTypeIcon[item.type];
                return (
                  <Card
                    key={item.id}
                    hoverable={false}
                    onClick={() => navigate(`/materials/${item.id}`)}
                    className="flex cursor-pointer items-start gap-3"
                  >
                    <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', accentBg[item.accentColor])}>
                      <TypeIcon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-label-sm text-on-surface-variant">{item.subject}</p>
                      <p className="truncate text-body-md font-semibold text-on-surface">{item.title}</p>
                      <p className="mt-1 text-label-sm text-outline">Added {timeAgo(item.uploadedAt)}</p>
                    </div>
                    <IconButton label="More options">
                      <MoreVertical size={16} />
                    </IconButton>
                  </Card>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LibraryPage;
