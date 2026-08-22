import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Grid2x2,
  List,
  Trash2,
  UploadCloud,
  XCircle,
  Check,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatedTextarea } from '../components/ui/AnimatedInput';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { IconButton } from '../components/ui/IconButton';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { accentBg, materialTypeIcon } from '../lib/materialIcons';
import { cn } from '../lib/cn';
import { timeAgo } from '../lib/timeAgo';
import {
  deleteMaterialForUI,
  listDownloadedMaterialsForUI,
  listMyUploadsForUI,
  listSavedMaterialsForUI,
  updateMaterialDetails,
} from '../services/materialsService';

const tabs = ['Saved', 'Downloaded', 'Manage Uploads', 'Recently Viewed'] as const;

export function LibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTabState] = useState<(typeof tabs)[number]>(() => {
    if (tabParam === 'uploads' || tabParam === 'manage-uploads') return 'Manage Uploads';
    if (tabParam === 'downloaded') return 'Downloaded';
    return 'Saved';
  });

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Delete Modals state
  const [editingItem, setEditingItem] = useState<Material | null>(null);
  const [deletingItem, setDeletingItem] = useState<Material | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Form Fields
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSubject, setEditSubject] = useState('');

  useEffect(() => {
    if (tabParam === 'uploads' || tabParam === 'manage-uploads') {
      setActiveTabState('Manage Uploads');
    } else if (tabParam === 'downloaded') {
      setActiveTabState('Downloaded');
    }
  }, [tabParam]);

  const setActiveTab = (tab: (typeof tabs)[number]) => {
    setActiveTabState(tab);
    if (tab === 'Manage Uploads') {
      setSearchParams({ tab: 'uploads' }, { replace: true });
    } else if (tab === 'Downloaded') {
      setSearchParams({ tab: 'downloaded' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (activeTab === 'Saved') {
        const data = await listSavedMaterialsForUI(user.id);
        setItems(data);
      } else if (activeTab === 'Downloaded') {
        const data = await listDownloadedMaterialsForUI(user.id);
        setItems(data);
      } else if (activeTab === 'Manage Uploads') {
        const data = await listMyUploadsForUI(user.id);
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.warn('Error loading library tab data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, user]);

  const handleOpenEdit = (item: Material, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditSubject(item.subject || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    await updateMaterialDetails(editingItem.id, {
      title: editTitle,
      description: editDescription,
      subject: editSubject,
    });

    setItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              title: editTitle,
              description: editDescription,
              subject: editSubject,
            }
          : item
      )
    );

    setEditingItem(null);
    showToast('Upload details updated successfully!');
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    await deleteMaterialForUI(deletingItem.id, deletingItem.filePath);
    setItems((prev) => prev.filter((item) => item.id !== deletingItem.id));
    setDeletingItem(null);
    showToast('Material deleted successfully.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-body-sm font-semibold text-white shadow-md"
          >
            <Check size={18} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg font-bold">Your Library</h1>
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

      <div className="mt-2">
        <AnimatePresence mode="wait">
          {!loading && items.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState
                icon={activeTab === 'Manage Uploads' ? <UploadCloud size={24} /> : <BookOpen size={24} />}
                title={
                  activeTab === 'Manage Uploads'
                    ? 'No uploaded materials found'
                    : activeTab === 'Saved'
                      ? 'No saved materials yet'
                      : activeTab === 'Downloaded'
                        ? 'No downloaded materials yet'
                        : `No ${activeTab.toLowerCase()} materials yet`
                }
                description={
                  activeTab === 'Manage Uploads'
                    ? 'You have not uploaded any study materials, past papers, or assignments yet.'
                    : activeTab === 'Saved'
                      ? 'Save study materials by clicking the bookmark icon while browsing.'
                      : activeTab === 'Downloaded'
                        ? 'Materials you download for offline studying will appear here.'
                        : 'Your documents and study resources will appear here.'
                }
                actionLabel={activeTab === 'Manage Uploads' ? 'Upload Resource' : 'Browse Home'}
                onAction={() => navigate(activeTab === 'Manage Uploads' ? '/upload' : '/')}
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
                const TypeIcon = materialTypeIcon[item.type] || FileText;
                const isUserUpload = activeTab === 'Manage Uploads';

                return (
                  <Card
                    key={item.id}
                    hoverable={false}
                    onClick={() => navigate(`/materials/${item.id}`)}
                    className="flex flex-col justify-between p-5 cursor-pointer transition-shadow hover:shadow-md border border-card-border"
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accentBg[item.accentColor])}>
                        <TypeIcon size={22} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-label-sm font-bold text-primary uppercase">{item.type}</span>
                          <span className="text-label-sm text-on-surface-variant">&bull; {item.subject}</span>
                        </div>
                        <p className="truncate text-body-md font-bold text-on-surface mt-0.5">{item.title}</p>
                        <p className="mt-1 text-label-sm text-outline">Uploaded {timeAgo(item.uploadedAt)}</p>
                      </div>
                    </div>

                    {/* Manage Uploads Specific Action Toolbar */}
                    {isUserUpload && (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-card-border pt-3">
                        {item.status === 'pending' ? (
                          <span className="flex items-center gap-1.5 text-label-sm font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-full">
                            <Clock size={13} />
                            <span>Under Admin Approval</span>
                          </span>
                        ) : item.status === 'rejected' ? (
                          <span className="flex items-center gap-1.5 text-label-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1 rounded-full">
                            <XCircle size={13} />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-label-sm font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
                            <CheckCircle2 size={13} />
                            <span>Approved & Published</span>
                          </span>
                        )}

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Edit3 size={14} />}
                            onClick={(e) => handleOpenEdit(item, e)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-error hover:bg-error/10 hover:text-error cursor-pointer"
                            icon={<Trash2 size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingItem(item);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Upload Modal */}
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Uploaded Material">
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
          <Input
            label="Material Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-label-md text-on-surface-variant">Description</label>
            <AnimatedTextarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-transparent bg-surface-soft px-4 py-3 text-body-md text-on-surface focus:bg-white focus:border-primary-container focus:outline-none"
            />
          </div>

          <Input
            label="Subject"
            value={editSubject}
            onChange={(e) => setEditSubject(e.target.value)}
          />

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deletingItem} onClose={() => setDeletingItem(null)} title="Delete Uploaded Material">
        <div className="flex flex-col gap-4 py-2">
          <p className="text-body-md text-on-surface">
            Are you sure you want to delete <span className="font-bold text-on-surface">&quot;{deletingItem?.title}&quot;</span>?
          </p>
          <p className="text-body-sm text-on-surface-variant">
            This action cannot be undone. The material will be removed from the library and community search.
          </p>

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setDeletingItem(null)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" className="bg-error hover:bg-error/90 text-white" onClick={handleConfirmDelete}>
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LibraryPage;
