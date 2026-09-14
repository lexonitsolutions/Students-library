import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  Grid2x2,
  ThumbsUp,
  List,
  Plus,
  Search,
  Trash2,
  Upload,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatedTextarea } from '../components/ui/AnimatedInput';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { useSignupRedirect } from '../hooks/useSignupRedirect';
import { cn } from '../lib/cn';
import { accentBg, materialTypeIcon } from '../lib/materialIcons';
import { timeAgo } from '../lib/timeAgo';
import { listRecentActivity, type ActivityItem } from '../services/activityService';
import { removeBookmark } from '../services/bookmarksService';
import { parseRejectionMeta } from '../services/adminService';
import {
  deleteMaterialForUI,
  listMyUploadsForUI,
  listSavedMaterialsForUI,
  updateMaterialDetails,
} from '../services/materialsService';

const tabs = ['Saved', 'Manage Uploads', 'Recent Activity'] as const;

function StatusBadge({ status }: { readonly status: 'approved' | 'pending' | 'rejected' }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
        <Clock size={11} />
        <span>Under Review</span>
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
        <XCircle size={11} />
        <span>Rejected</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 size={11} />
      <span>Approved & Published</span>
    </span>
  );
}

export function LibraryPage() {
  const { user, isExploring } = useAuth();
  const { openSignupModal } = useSignupRedirect();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTabState] = useState<(typeof tabs)[number]>(() => {
    if (tabParam === 'uploads' || tabParam === 'manage-uploads') return 'Manage Uploads';
    if (tabParam === 'activity' || tabParam === 'recent-activity') return 'Recent Activity';
    return 'Saved';
  });

  const [view, setView] = useState<'grid' | 'list'>('list');
  const [items, setItems] = useState<Material[]>([]);
  const [counts, setCounts] = useState<{ saved: number; uploads: number }>({ saved: 0, uploads: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'uploaded' | 'saved' | 'viewed'>('all');
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
    } else if (tabParam === 'activity' || tabParam === 'recent-activity') {
      setActiveTabState('Recent Activity');
    }
  }, [tabParam]);

  const setActiveTab = (tab: (typeof tabs)[number]) => {
    setActiveTabState(tab);
    setSearchQuery('');
    setStatusFilter('all');
    if (tab === 'Manage Uploads') {
      setSearchParams({ tab: 'uploads' }, { replace: true });
    } else if (tab === 'Recent Activity') {
      setSearchParams({ tab: 'activity' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // Preload counts
  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      listSavedMaterialsForUI(user.id),
      listMyUploadsForUI(user.id),
    ])
      .then(([saved, uploads]) => {
        setCounts({ saved: saved.length, uploads: uploads.length });
      })
      .catch(() => {});
  }, [user?.id]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (activeTab === 'Saved') {
        const data = user.id ? await listSavedMaterialsForUI(user.id) : [];
        setItems(data);
        setCounts((prev) => ({ ...prev, saved: data.length }));
      } else if (activeTab === 'Manage Uploads') {
        const data = user.id ? await listMyUploadsForUI(user.id) : [];
        setItems(data);
        setCounts((prev) => ({ ...prev, uploads: data.length }));
      } else if (activeTab === 'Recent Activity') {
        const activities = user.id ? await listRecentActivity(user.id) : [];
        setActivityItems(activities);
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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSubject = item.subject?.toLowerCase().includes(q);
        const matchType = item.type?.toLowerCase().includes(q);
        if (!matchTitle && !matchSubject && !matchType) return false;
      }
      if (activeTab === 'Manage Uploads' && statusFilter !== 'all') {
        if (item.status !== statusFilter) return false;
      }
      return true;
    });
  }, [items, searchQuery, statusFilter, activeTab]);

  const filteredActivities = useMemo(() => {
    return activityItems.filter((item) => {
      if (activityFilter === 'all') return true;
      return item.type === activityFilter;
    });
  }, [activityItems, activityFilter]);

  const handleItemClick = (materialId: string) => {
    if (isExploring) {
      openSignupModal(`/materials/${materialId}`);
    } else {
      navigate(`/materials/${materialId}`);
    }
  };

  const handleOpenEdit = (item: Material, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.status === 'rejected') return;
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditSubject(item.subject || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const wasRejected = editingItem.status === 'rejected';

    await updateMaterialDetails(editingItem.id, {
      title: editTitle,
      description: editDescription,
      subject: editSubject,
      ...(wasRejected ? { status: 'pending', rejection_reason: null } : {}),
    });

    setItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              title: editTitle,
              description: editDescription,
              subject: editSubject,
              ...(wasRejected
                ? {
                    status: 'pending' as const,
                    rejectionReason: null,
                    rejectedByAdminName: null,
                  }
                : {}),
            }
          : item
      )
    );

    setEditingItem(null);
    showToast(
      wasRejected
        ? 'Material updated and resubmitted for admin review!'
        : 'Upload details updated successfully!'
    );
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    await deleteMaterialForUI(deletingItem.id, deletingItem.filePath);
    setItems((prev) => prev.filter((item) => item.id !== deletingItem.id));
    setCounts((prev) => ({ ...prev, uploads: Math.max(0, prev.uploads - 1) }));
    setDeletingItem(null);
    showToast('Material deleted successfully.');
  };

  const handleUnsave = async (materialId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    await removeBookmark(materialId, user.id);
    setItems((prev) => prev.filter((m) => m.id !== materialId));
    setCounts((prev) => ({ ...prev, saved: Math.max(0, prev.saved - 1) }));
    showToast('Removed from saved materials.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg"
          >
            <Check size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Your Library
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">
            Manage, review, and organize your study materials and downloads.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/upload')}
            className="gap-1.5 text-xs shadow-2xs"
          >
            <Plus size={15} />
            <span>Upload Material</span>
          </Button>

          {activeTab !== 'Recent Activity' && (
            <div className="flex items-center rounded-xl border border-card-border bg-surface-container-low p-0.5 shadow-2xs">
              <button
                type="button"
                title="Grid View"
                onClick={() => setView('grid')}
                className={cn(
                  'rounded-lg p-1.5 transition-colors cursor-pointer',
                  view === 'grid'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                <Grid2x2 size={16} />
              </button>
              <button
                type="button"
                title="List View"
                onClick={() => setView('list')}
                className={cn(
                  'rounded-lg p-1.5 transition-colors cursor-pointer',
                  view === 'list'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                <List size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex w-full items-center border-b border-card-border overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          const count =
            tab === 'Saved'
              ? counts.saved
              : tab === 'Manage Uploads'
                ? counts.uploads
                : null;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'relative flex flex-1 sm:flex-initial items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0',
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              <span>
                {tab === 'Manage Uploads' ? (
                  <>
                    <span className="hidden sm:inline">Manage </span>Uploads
                  </>
                ) : tab === 'Recent Activity' ? (
                  <>
                    Recent<span className="hidden sm:inline"> Activity</span>
                  </>
                ) : (
                  tab
                )}
              </span>
              {count !== null && (
                <span
                  className={cn(
                    'rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] font-bold transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-container text-on-surface-variant',
                  )}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="lib-tab-underline"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Sub-header: Search & Status Filters ── */}
      {activeTab !== 'Recent Activity' && items.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            />
            <input
              type="text"
              placeholder={`Search in ${activeTab === 'Saved' ? 'saved materials' : 'uploads'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-card-border bg-surface-container-low pl-9 pr-8 py-2 text-xs text-on-surface placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {activeTab === 'Manage Uploads' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'approved', label: 'Approved' },
                  { key: 'pending', label: 'Under Review' },
                  { key: 'rejected', label: 'Rejected' },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap',
                    statusFilter === key
                      ? 'bg-primary text-white shadow-xs'
                      : 'border border-card-border bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Content View ── */}
      {activeTab === 'Recent Activity' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold tracking-tight text-on-surface">Recent Activity</h2>
            <div className="flex items-center gap-1 rounded-lg bg-surface-container-low p-1 border border-card-border text-xs">
              {(['all', 'uploaded', 'saved', 'viewed'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActivityFilter(filter)}
                  className={cn(
                    'capitalize px-3 py-1 rounded-md transition-colors cursor-pointer font-medium',
                    activityFilter === filter
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <Card hoverable={false} padded={false} className="border-card-border overflow-hidden">
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => {
                let Icon = Eye;
                let iconBg = 'text-sky-600 bg-sky-500/10 dark:text-sky-400';
                let labelStyle = 'bg-sky-500/10 text-sky-700 dark:text-sky-300';

                if (activity.type === 'uploaded') {
                  Icon = Upload;
                  iconBg = 'text-primary bg-primary/10';
                  labelStyle = 'bg-primary/10 text-primary';
                } else if (activity.type === 'saved') {
                  Icon = Bookmark;
                  iconBg = 'text-amber-600 bg-amber-500/10 dark:text-amber-400';
                  labelStyle = 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
                } else if (activity.type === 'downloaded') {
                  Icon = Download;
                  iconBg = 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400';
                  labelStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
                }

                const rowContent = (
                  <div className="flex items-start gap-3 border-b border-card-border px-4 py-3.5 last:border-b-0 hover:bg-surface-container-low/60 transition-colors cursor-pointer">
                    <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', iconBg)}>
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-on-surface-variant">
                        <span className={cn('inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mr-1.5', labelStyle)}>
                          {activity.label}
                        </span>
                        <span className="font-semibold text-on-surface hover:underline">{activity.target}</span>
                        {activity.type === 'uploaded' && activity.status === 'pending' && (
                          <span className="inline-block align-middle ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                            Pending Approval
                          </span>
                        )}
                      </p>
                      <span className="mt-1 block text-[11px] text-outline">{activity.timestamp}</span>
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
              <div className="py-12 text-center">
                <Clock className="mx-auto h-8 w-8 text-outline mb-2" />
                <p className="text-xs text-on-surface-variant">No recent activity found.</p>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div>
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredItems.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyState
                  icon={activeTab === 'Manage Uploads' ? <UploadCloud size={24} /> : <BookOpen size={24} />}
                  title={
                    searchQuery
                      ? 'No matching materials found'
                      : activeTab === 'Manage Uploads'
                        ? 'No uploaded materials found'
                        : 'No saved materials yet'
                  }
                  description={
                    searchQuery
                      ? 'Try adjusting your search query or filter settings.'
                      : activeTab === 'Manage Uploads'
                        ? 'You have not uploaded any study materials, past papers, or assignments yet.'
                        : 'Save study materials by clicking the bookmark icon while browsing.'
                  }
                  actionLabel={
                    searchQuery
                      ? 'Clear Search'
                      : activeTab === 'Manage Uploads'
                        ? 'Upload Resource'
                        : 'Browse Materials'
                  }
                  onAction={() => {
                    if (searchQuery) {
                      setSearchQuery('');
                      setStatusFilter('all');
                    } else {
                      navigate(activeTab === 'Manage Uploads' ? '/upload' : '/');
                    }
                  }}
                />
              </motion.div>
            ) : view === 'list' ? (
              /* ── PROFESSIONAL LIST VIEW (TABLE ROWS) ── */
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col divide-y divide-card-border rounded-2xl border border-card-border bg-surface overflow-hidden shadow-xs"
              >
                {filteredItems.map((item) => {
                  const TypeIcon = materialTypeIcon[item.type] || FileText;
                  const isUserUpload = activeTab === 'Manage Uploads';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className="group flex flex-col p-4 transition-colors hover:bg-surface-container-low/60 cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Icon & Meta */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <span
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                              accentBg[item.accentColor] || 'bg-primary/10 text-primary',
                            )}
                          >
                            <TypeIcon size={20} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                                {item.title}
                              </h3>
                              {isUserUpload && (
                                <span className="sm:hidden shrink-0">
                                  <StatusBadge status={item.status} />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-on-surface-variant">
                              <span className="font-bold uppercase tracking-wider text-[10px] text-primary">
                                {item.type}
                              </span>
                              {item.subject && <span>&bull; {item.subject}</span>}
                              {item.semester && (
                                <span className="hidden md:inline">&bull; Sem {item.semester}</span>
                              )}
                              <span className="hidden sm:inline">&bull; {timeAgo(item.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Stats, Status & Actions */}
                        <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between sm:justify-end">
                          {/* Stats */}
                          {!(isUserUpload && item.status === 'rejected') && (
                            <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                              <span className="flex items-center gap-1" title="Views">
                                <Eye size={13} className="text-outline" />
                                <span>{item.views ?? 0}</span>
                              </span>
                              <span className="flex items-center gap-1" title="Downloads">
                                <Download size={13} className="text-outline" />
                                <span>{item.downloads ?? 0}</span>
                              </span>
                              <span className="flex items-center gap-1" title="Likes">
                                <ThumbsUp size={13} className={cn((item.likes ?? 0) > 0 ? "text-primary fill-primary" : "text-outline")} />
                                <span>{item.likes ?? 0}</span>
                              </span>
                            </div>
                          )}

                          {/* Status Badge (desktop) */}
                          {isUserUpload && (
                            <div className="hidden sm:block">
                              <StatusBadge status={item.status} />
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div
                            className="flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isUserUpload ? (
                              <>
                                {item.status !== 'rejected' && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEdit(item, e)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container hover:text-primary transition-all cursor-pointer"
                                  >
                                    <Edit3 size={13} />
                                    <span>Edit</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingItem(item);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200/50 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/30 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-900/50 transition-all cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleUnsave(item.id, e)}
                                className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold text-on-surface hover:text-rose-500 hover:border-rose-200 transition-all cursor-pointer"
                                title="Remove bookmark"
                              >
                                <Bookmark size={13} className="fill-primary text-primary" />
                                <span className="hidden sm:inline">Saved</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rejection Note */}
                      {isUserUpload && item.status === 'rejected' && (() => {
                        const { reason } = parseRejectionMeta(item.rejectionReason);
                        const displayReason = (reason && reason !== 'Guidelines not met')
                          ? reason
                          : item.rejectionReason && !item.rejectionReason.startsWith('REJECTED:')
                          ? item.rejectionReason
                          : 'Content did not meet academic guidelines.';
                        return (
                          <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                            <AlertTriangle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
                            <div className="min-w-0 flex-1 flex flex-wrap items-center gap-1.5 font-semibold">
                              <span className="text-rose-800 dark:text-rose-200">Rejection Reason:</span>
                              <span className="font-normal text-on-surface">{displayReason}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              /* ── PROFESSIONAL GRID VIEW ── */
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 min-[1900px]:grid-cols-5"
              >
                {filteredItems.map((item) => {
                  const TypeIcon = materialTypeIcon[item.type] || FileText;
                  const isUserUpload = activeTab === 'Manage Uploads';

                  return (
                    <Card
                      key={item.id}
                      hoverable={false}
                      onClick={() => handleItemClick(item.id)}
                      className="group flex flex-col justify-between p-5 cursor-pointer transition-all hover:shadow-md hover:border-primary/40 border border-card-border bg-surface"
                    >
                      <div>
                        {/* Top: Type & Status */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                                accentBg[item.accentColor] || 'bg-primary/10 text-primary',
                              )}
                            >
                              <TypeIcon size={16} />
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                              {item.type}
                            </span>
                          </div>
                          {isUserUpload && <StatusBadge status={item.status} />}
                        </div>

                        {/* Title */}
                        <h3 className="line-clamp-2 text-sm font-semibold text-on-surface group-hover:text-primary transition-colors leading-snug">
                          {item.title}
                        </h3>

                        {/* Subject & Semester */}
                        <p className="mt-1 text-xs text-on-surface-variant truncate">
                          {item.subject || 'General'}
                          {item.semester && <span> &bull; Sem {item.semester}</span>}
                        </p>

                        {/* Engagement stats */}
                        {!(isUserUpload && item.status === 'rejected') ? (
                          <div className="mt-4 flex items-center gap-3 text-xs text-on-surface-variant border-t border-card-border/60 pt-3">
                            <span className="flex items-center gap-1">
                              <Eye size={12} className="text-outline" />
                              <span>{item.views ?? 0}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Download size={12} className="text-outline" />
                              <span>{item.downloads ?? 0}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp size={12} className={cn((item.likes ?? 0) > 0 ? "text-primary fill-primary" : "text-outline")} />
                              <span>{item.likes ?? 0}</span>
                            </span>
                            <span className="ml-auto text-[10px] text-outline">
                              {timeAgo(item.uploadedAt)}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-4 flex items-center justify-end text-[10px] text-outline border-t border-card-border/60 pt-3">
                            <span>Uploaded {timeAgo(item.uploadedAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Footer */}
                      <div
                        className="mt-4 flex items-center justify-end gap-2 border-t border-card-border/60 pt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isUserUpload ? (
                          <>
                            {item.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenEdit(item, e)}
                                className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-on-surface hover:bg-surface-container hover:text-primary transition-all cursor-pointer"
                              >
                                <Edit3 size={13} />
                                <span>Edit</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingItem(item);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200/50 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/30 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-900/50 transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleUnsave(item.id, e)}
                            className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-on-surface hover:text-rose-500 hover:border-rose-200 transition-all cursor-pointer"
                          >
                            <Bookmark size={13} className="fill-primary text-primary" />
                            <span>Saved</span>
                          </button>
                        )}
                      </div>

                      {/* Rejection Alert */}
                      {isUserUpload && item.status === 'rejected' && (() => {
                        const { reason } = parseRejectionMeta(item.rejectionReason);
                        const displayReason = (reason && reason !== 'Guidelines not met')
                          ? reason
                          : item.rejectionReason && !item.rejectionReason.startsWith('REJECTED:')
                          ? item.rejectionReason
                          : 'Content did not meet academic guidelines.';
                        return (
                          <div className="mt-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 p-2 text-[11px] text-rose-700 dark:text-rose-300">
                            <div className="flex items-start gap-1.5 font-semibold text-rose-800 dark:text-rose-200">
                              <AlertTriangle size={13} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                              <div className="min-w-0 flex-1">
                                <span>Rejection Reason: </span>
                                <span className="font-normal text-on-surface line-clamp-2">{displayReason}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </Card>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

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
              className="w-full resize-none rounded-lg border border-card-border bg-surface-container px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-none"
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

