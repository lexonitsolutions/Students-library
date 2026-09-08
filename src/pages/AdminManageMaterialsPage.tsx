import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Eye,
  FileQuestion,
  Files,
  FileText,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { UserProfilePanel, type UploaderProfile } from '../components/ui/UserProfilePanel';
import { AdminMaterialViewerModal } from '../components/admin/AdminMaterialViewerModal';
import { cn } from '../lib/cn';
import { cleanDocumentTitle } from '../lib/materialMapper';
import * as adminService from '../services/adminService';

export type DocumentSection = 'all' | 'materials' | 'assignments' | 'testpapers';

export function getDocumentSection(item: { type?: string; title?: string }): 'materials' | 'assignments' | 'testpapers' {
  const t = (item.type || '').toLowerCase().trim();
  const title = (item.title || '').toLowerCase();

  // 1. Assignments
  if (
    t === 'doc' ||
    t === 'assignment' ||
    t === 'assignments' ||
    title.includes('assignment') ||
    title.includes('solution') ||
    title.includes('homework') ||
    title.includes('lab manual') ||
    title.includes('lab report')
  ) {
    return 'assignments';
  }

  // 2. Test Papers
  if (
    t === 'past-paper' ||
    t === 'past-papers' ||
    t === 'test-paper' ||
    t === 'testpaper' ||
    t === 'paper' ||
    t === 'papers' ||
    title.includes('paper') ||
    title.includes('test') ||
    title.includes('exam') ||
    title.includes('mid') ||
    title.includes('quiz')
  ) {
    return 'testpapers';
  }

  // 3. Materials
  return 'materials';
}


export function AdminManageMaterialsPage() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<adminService.AdminMaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<DocumentSection>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [materialToDelete, setMaterialToDelete] = useState<adminService.AdminMaterialItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewItem, setPreviewItem] = useState<adminService.ModerationItem | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UploaderProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const data = await adminService.listAllMaterialsForAdmin();
      setMaterials(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
      showToast('Could not load documents list.', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sectionCounts = useMemo(() => {
    return {
      all: materials.length,
      materials: materials.filter((m) => getDocumentSection(m) === 'materials').length,
      assignments: materials.filter((m) => getDocumentSection(m) === 'assignments').length,
      testpapers: materials.filter((m) => getDocumentSection(m) === 'testpapers').length,
    };
  }, [materials]);

  const statusCounts = useMemo(() => {
    const scoped = selectedSection === 'all'
      ? materials
      : materials.filter((m) => getDocumentSection(m) === selectedSection);

    return {
      all: scoped.length,
      approved: scoped.filter((m) => m.status === 'approved').length,
      pending: scoped.filter((m) => m.status === 'pending').length,
      rejected: scoped.filter((m) => m.status === 'rejected').length,
    };
  }, [materials, selectedSection]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((mat) => {
      // 1. Section filter
      if (selectedSection !== 'all') {
        const sec = getDocumentSection(mat);
        if (sec !== selectedSection) return false;
      }
      // 2. Status filter
      if (statusFilter !== 'all' && mat.status !== statusFilter) return false;
      // 3. Search query
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        mat.title.toLowerCase().includes(q) ||
        mat.subject.toLowerCase().includes(q) ||
        mat.course.toLowerCase().includes(q) ||
        mat.uploaderName.toLowerCase().includes(q)
      );
    });
  }, [materials, selectedSection, statusFilter, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!materialToDelete) return;
    const target = materialToDelete;
    setIsDeleting(true);

    // Optimistic UI update
    setMaterials((prev) => prev.filter((m) => m.id !== target.id));
    setMaterialToDelete(null);

    try {
      await adminService.deleteMaterialByAdmin(target.id, target.filePath, target.status);
      showToast(`Material "${cleanDocumentTitle(target.title)}" has been permanently deleted.`, 'success');
      loadData(true);
    } catch (err) {
      console.error('Failed to delete material:', err);
      showToast('Failed to delete material. Please try again.', 'error');
      loadData(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* -- Toast Notification -- */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={cn(
              'fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-semibold shadow-xl border backdrop-blur-md',
              toastMessage.type === 'success' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
              toastMessage.type === 'error' && 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
              toastMessage.type === 'warning' && 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            )}
          >
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* -- Navigation Breadcrumb & Header -- */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                Manage Documents
              </h1>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {materials.length} total
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">
              Review and manage study materials, assignments, and test papers across disciplines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadData(true)}
              disabled={isRefreshing || loading}
              className="gap-1.5"
            >
              <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin')} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 3 Core Sections KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Documents */}
        <button
          type="button"
          onClick={() => setSelectedSection('all')}
          className={cn(
            'flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer',
            selectedSection === 'all'
              ? 'border-indigo-500/50 bg-indigo-500/[0.08] shadow-sm'
              : 'border-card-border bg-surface-container-low hover:bg-surface-container'
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <Files size={18} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-on-surface tabular-nums">
              {sectionCounts.all}
            </div>
            <p className="text-xs text-on-surface-variant font-medium">All Documents</p>
          </div>
        </button>

        {/* Study Materials */}
        <button
          type="button"
          onClick={() => setSelectedSection('materials')}
          className={cn(
            'flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer',
            selectedSection === 'materials'
              ? 'border-blue-500/50 bg-blue-500/[0.08] shadow-sm'
              : 'border-card-border bg-surface-container-low hover:bg-surface-container'
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-on-surface tabular-nums">
              {sectionCounts.materials}
            </div>
            <p className="text-xs text-on-surface-variant font-medium">Materials</p>
          </div>
        </button>

        {/* Assignments */}
        <button
          type="button"
          onClick={() => setSelectedSection('assignments')}
          className={cn(
            'flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer',
            selectedSection === 'assignments'
              ? 'border-emerald-500/50 bg-emerald-500/[0.08] shadow-sm'
              : 'border-card-border bg-surface-container-low hover:bg-surface-container'
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <ClipboardList size={18} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-on-surface tabular-nums">
              {sectionCounts.assignments}
            </div>
            <p className="text-xs text-on-surface-variant font-medium">Assignments</p>
          </div>
        </button>

        {/* Test Papers */}
        <button
          type="button"
          onClick={() => setSelectedSection('testpapers')}
          className={cn(
            'flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer',
            selectedSection === 'testpapers'
              ? 'border-amber-500/50 bg-amber-500/[0.08] shadow-sm'
              : 'border-card-border bg-surface-container-low hover:bg-surface-container'
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <FileQuestion size={18} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-on-surface tabular-nums">
              {sectionCounts.testpapers}
            </div>
            <p className="text-xs text-on-surface-variant font-medium">Test Papers</p>
          </div>
        </button>
      </div>

      {/* ── Filter Bar & Table Card ── */}
      <Card padded={false} hoverable={false} className="overflow-hidden">
        {/* Section Tabs Header */}
        <div className="flex items-center gap-2 p-2 border-b border-card-border bg-surface-container-low overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => setSelectedSection('materials')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
              selectedSection === 'materials'
                ? 'bg-surface-container-lowest text-blue-600 dark:text-blue-400 shadow-xs border border-card-border/80'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <BookOpen size={14} className="text-blue-500" />
            <span>Materials</span>
            <span className="rounded-full px-1.5 py-0.2 text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              {sectionCounts.materials}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSection('assignments')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
              selectedSection === 'assignments'
                ? 'bg-surface-container-lowest text-emerald-600 dark:text-emerald-400 shadow-xs border border-card-border/80'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <ClipboardList size={14} className="text-emerald-500" />
            <span>Assignments</span>
            <span className="rounded-full px-1.5 py-0.2 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              {sectionCounts.assignments}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSection('testpapers')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
              selectedSection === 'testpapers'
                ? 'bg-surface-container-lowest text-amber-600 dark:text-amber-400 shadow-xs border border-card-border/80'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <FileQuestion size={14} className="text-amber-500" />
            <span>Test Papers</span>
            <span className="rounded-full px-1.5 py-0.2 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              {sectionCounts.testpapers}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSection('all')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ml-auto',
              selectedSection === 'all'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs border border-card-border/80'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <Files size={14} />
            <span>All Documents</span>
            <span className="rounded-full px-1.5 py-0.2 text-[10px] bg-surface-container text-on-surface-variant font-bold">
              {sectionCounts.all}
            </span>
          </button>
        </div>

        {/* Table Controls (Search & Status Filters) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-card-border bg-surface-container-lowest">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${selectedSection === 'all' ? 'documents' : selectedSection}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 pl-8.5 pr-3 text-xs rounded-xl bg-surface-container border border-card-border focus:border-primary focus:outline-none w-full placeholder:text-on-surface-variant/50 text-on-surface"
            />
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface-container border border-card-border select-none self-start sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap',
                statusFilter === 'all' ? 'bg-surface-container-lowest text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              All ({statusCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap',
                statusFilter === 'approved' ? 'bg-surface-container-lowest text-emerald-600 dark:text-emerald-400 font-bold shadow-xs' : 'text-on-surface-variant hover:text-emerald-600'
              )}
            >
              Approved ({statusCounts.approved})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap',
                statusFilter === 'pending' ? 'bg-surface-container-lowest text-amber-600 dark:text-amber-400 font-bold shadow-xs' : 'text-on-surface-variant hover:text-amber-600'
              )}
            >
              Pending ({statusCounts.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap',
                statusFilter === 'rejected' ? 'bg-surface-container-lowest text-rose-600 dark:text-rose-400 font-bold shadow-xs' : 'text-on-surface-variant hover:text-rose-600'
              )}
            >
              Rejected ({statusCounts.rejected})
            </button>
          </div>
        </div>

        {/* Materials Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-card-border bg-surface-container text-xs font-semibold text-on-surface-variant">
                <th className="px-5 py-3">Document Title</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Contributor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Performance</th>
                <th className="px-4 py-3">Uploaded Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {filteredMaterials.map((mat) => {
                const section = getDocumentSection(mat);
                return (
                  <tr key={mat.id} className="hover:bg-surface-container/60 transition-colors">
                    {/* Document Title & Subject */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                          section === 'materials' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                          section === 'assignments' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                          section === 'testpapers' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        )}>
                          {section === 'assignments' && <ClipboardList size={16} />}
                          {section === 'testpapers' && <FileQuestion size={16} />}
                          {section === 'materials' && <BookOpen size={16} />}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewItem({
                                id: mat.id,
                                title: mat.title,
                                description: mat.description,
                                subject: mat.subject,
                                course: mat.course,
                                filePath: mat.filePath,
                                fileUrl: mat.fileUrl,
                                fileSizeMb: mat.fileSizeMb,
                                pages: mat.pages,
                                type: mat.type,
                                uploader: mat.uploaderName,
                                uploaderDetails: mat.uploaderDetails || {
                                  id: '',
                                  name: mat.uploaderName,
                                },
                                date: new Date(mat.createdAt).toLocaleDateString(),
                                status: mat.status,
                                rejectionReason: mat.rejectionReason,
                                views: mat.views,
                                downloads: mat.downloads,
                              });
                            }}
                            className="font-semibold text-xs sm:text-sm text-on-surface hover:text-primary transition-colors text-left truncate block max-w-[220px] cursor-pointer"
                          >
                            {cleanDocumentTitle(mat.title)}
                          </button>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-on-surface-variant truncate max-w-[130px]">
                              {mat.subject}
                            </span>
                            <span className="inline-flex items-center rounded px-1.5 py-px text-[9px] font-semibold bg-surface-container text-on-surface-variant border border-card-border">
                              {mat.course}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Section Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {section === 'materials' && (
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <BookOpen size={10} /> Material
                        </span>
                      )}
                      {section === 'assignments' && (
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <ClipboardList size={10} /> Assignment
                        </span>
                      )}
                      {section === 'testpapers' && (
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <FileQuestion size={10} /> Test Paper
                        </span>
                      )}
                    </td>

                  {/* Contributor */}
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedProfile({
                          uploaderId: mat.uploaderDetails?.id || '',
                          uploaderName: mat.uploaderName,
                          uploaderAvatar: mat.uploaderDetails?.avatarUrl || '',
                          uploaderUniversity: mat.uploaderDetails?.university,
                          uploaderCollege: mat.uploaderDetails?.college,
                        })
                      }
                      className="flex items-center gap-2.5 group cursor-pointer text-left"
                    >
                      <Avatar
                        src={mat.uploaderDetails?.avatarUrl}
                        name={mat.uploaderName}
                        size={28}
                        className="shrink-0 group-hover:ring-2 group-hover:ring-primary/40 transition-all"
                      />
                      <span className="text-xs font-medium text-on-surface group-hover:text-primary transition-colors truncate max-w-[130px]">
                        {mat.uploaderName}
                      </span>
                    </button>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5">
                    {mat.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={11} /> Approved
                      </span>
                    )}
                    {mat.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock size={11} /> Pending
                      </span>
                    )}
                    {mat.status === 'rejected' && (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 w-fit">
                          <XCircle size={11} /> Rejected
                        </span>
                        {mat.rejectionReason && (
                          <span className="text-[10px] text-on-surface-variant truncate max-w-[140px]" title={mat.rejectionReason}>
                            {mat.rejectionReason}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Performance */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-on-surface font-semibold" title="Views">
                        <Eye size={12} className="text-on-surface-variant" />
                        <span>{mat.views}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-on-surface font-semibold" title="Downloads">
                        <Download size={12} className="text-on-surface-variant" />
                        <span>{mat.downloads}</span>
                      </div>
                    </div>
                  </td>

                  {/* Uploaded Date */}
                  <td className="px-4 py-3.5 text-xs text-on-surface-variant whitespace-nowrap">
                    {mat.createdAt
                      ? new Date(mat.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Unknown'}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewItem({
                            id: mat.id,
                            title: mat.title,
                            description: mat.description,
                            subject: mat.subject,
                            course: mat.course,
                            filePath: mat.filePath,
                            fileUrl: mat.fileUrl,
                            fileSizeMb: mat.fileSizeMb,
                            pages: mat.pages,
                            type: mat.type,
                            uploader: mat.uploaderName,
                            uploaderDetails: mat.uploaderDetails || {
                              id: '',
                              name: mat.uploaderName,
                            },
                            date: new Date(mat.createdAt).toLocaleDateString(),
                            status: mat.status,
                            rejectionReason: mat.rejectionReason,
                            views: mat.views,
                            downloads: mat.downloads,
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-card-border bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface transition-all cursor-pointer"
                        title="View document preview"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMaterialToDelete(mat)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        title="Delete this material"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

              {filteredMaterials.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-on-surface-variant">
                    {searchQuery.trim()
                      ? `No documents matching "${searchQuery}".`
                      : 'No documents found in this section.'}
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-primary" />
                      <span>Loading documents...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* -- Document Viewer Modal -- */}
      <AdminMaterialViewerModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      {/* -- Student Profile Drawer -- */}
      <UserProfilePanel
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        side="right"
      />

      {/* ── Delete Document Confirmation Modal ── */}
      <Modal
        open={Boolean(materialToDelete)}
        onClose={() => !isDeleting && setMaterialToDelete(null)}
        title="Delete Document"
      >
        {materialToDelete && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-card-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">
                  {cleanDocumentTitle(materialToDelete.title)}
                </p>
                <p className="text-xs text-on-surface-variant truncate">
                  {materialToDelete.subject} &bull; Contributed by {materialToDelete.uploaderName}
                </p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete this document? This will remove the database record and permanently delete the physical file from Supabase storage.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-card-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMaterialToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Document'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminManageMaterialsPage;
