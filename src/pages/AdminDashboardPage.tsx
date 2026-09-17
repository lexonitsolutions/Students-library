import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  FolderCheck,
  Library,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/ui/Footer';
import { Modal } from '../components/ui/Modal';
import { UserProfilePanel, type UploaderProfile } from '../components/ui/UserProfilePanel';
import { AdminMaterialViewerModal } from '../components/admin/AdminMaterialViewerModal';
import { RejectMaterialModal } from '../components/admin/RejectMaterialModal';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/cn';
import { cleanDocumentTitle } from '../lib/materialMapper';
import * as adminService from '../services/adminService';
import { updateMaterialStatus } from '../services/materialsService';

function formatApprovalTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return diffMin + 'm ago';
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return diffHrs + 'h ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<adminService.AdminStats | null>(null);
  const [queue, setQueue] = useState<adminService.ModerationItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isResolvingBatch, setIsResolvingBatch] = useState(false);
  const [recentApprovals, setRecentApprovals] = useState<adminService.RecentApprovalItem[]>([]);
  const [recentRejections, setRecentRejections] = useState<adminService.RecentRejectionItem[]>([]);
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'mine' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UploaderProfile | null>(null);
  const [previewItem, setPreviewItem] = useState<adminService.ModerationItem | null>(null);
  const [isApprovedPreview, setIsApprovedPreview] = useState(false);
  const [rejectingItem, setRejectingItem] = useState<adminService.ModerationItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [showClearApprovalsConfirm, setShowClearApprovalsConfirm] = useState(false);
  const [showClearRejectionsConfirm, setShowClearRejectionsConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3200);
  };

  const currentAdminName = useMemo(() => {
    if (user?.name && !['admin', 'administrator', 'system', 'user'].includes(user.name.toLowerCase().trim())) {
      return user.name;
    }
    if (user?.username && !['admin', 'administrator', 'system', 'user'].includes(user.username.toLowerCase().trim())) {
      return user.username;
    }
    if (user?.email && user.email.includes('@')) {
      return user.email.split('@')[0];
    }
    return user?.name || 'Admin';
  }, [user]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [s, q, r, rej] = await Promise.all([
        adminService.getAdminStats(),
        adminService.listModerationQueue(),
        adminService.listRecentApprovals({
          id: user?.id,
          name: currentAdminName,
          email: user?.email,
          avatar: user?.avatar,
        }),
        adminService.listRecentRejections({
          id: user?.id,
          name: currentAdminName,
          email: user?.email,
          avatar: user?.avatar,
        }),
      ]);
      setStats(s);
      setQueue(q);
      setRecentApprovals(r);
      setRecentRejections(rej);
    } catch (err) {
      console.error('Error refreshing admin dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, currentAdminName]);

  const toggleSelectAll = () => {
    if (selectedItemIds.size === queue.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(queue.map((item) => item.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resolve = async (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    const itemToResolve = queue.find((item) => item.id === id);
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setSelectedItemIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      const adminInfo = {
        id: user?.id,
        name: currentAdminName,
        email: user?.email,
        avatar: user?.avatar,
      };

      const metaStr = status === 'approved'
        ? adminService.encodeApprovalMeta({
            adminId: user?.id,
            adminEmail: user?.email,
            adminName: currentAdminName,
            adminAvatar: adminInfo.avatar,
            approvedAt: new Date().toISOString(),
          })
        : adminService.encodeRejectionMeta({
            adminId: user?.id,
            adminEmail: user?.email,
            adminName: currentAdminName,
            adminAvatar: adminInfo.avatar,
            rejectedAt: new Date().toISOString(),
            reason: rejectionReason || 'Guidelines not met',
          });

      await updateMaterialStatus(id, status, metaStr);
      adminService.getAdminStats().then(setStats);

      if (status === 'approved') {
        adminService.removeStoredRejection(id);
        setRecentRejections((prev) => prev.filter((item) => item.id !== id));
        if (itemToResolve) {
          adminService.recordApproval(itemToResolve, adminInfo);
          setRecentApprovals((prev) => [
            {
              id: itemToResolve.id,
              title: itemToResolve.title,
              subject: itemToResolve.subject,
              course: itemToResolve.course,
              uploaderName: itemToResolve.uploader,
              uploaderDetails: itemToResolve.uploaderDetails,
              approvedAt: new Date().toISOString(),
              approvedByAdminId: adminInfo.id,
              approvedByAdminName: adminInfo.name,
              approvedByAdminAvatar: adminInfo.avatar,
              approvedByAdminEmail: adminInfo.email,
              filePath: itemToResolve.filePath,
              fileUrl: itemToResolve.fileUrl,
              description: itemToResolve.description,
              fileSizeMb: itemToResolve.fileSizeMb,
              pages: itemToResolve.pages,
              type: itemToResolve.type,
            },
            ...prev.filter((p) => p.id !== id),
          ]);
        }
        showToast('Document approved & published successfully.', 'success');
      } else {
        if (itemToResolve) {
          adminService.recordRejection(itemToResolve, adminInfo, rejectionReason);
          setRecentRejections((prev) => [
            {
              id: itemToResolve.id,
              title: itemToResolve.title,
              subject: itemToResolve.subject,
              course: itemToResolve.course,
              uploaderName: itemToResolve.uploader,
              uploaderDetails: itemToResolve.uploaderDetails,
              rejectedAt: new Date().toISOString(),
              rejectionReason: rejectionReason || 'Guidelines not met',
              rejectedByAdminId: adminInfo.id,
              rejectedByAdminName: adminInfo.name,
              rejectedByAdminAvatar: adminInfo.avatar,
              rejectedByAdminEmail: adminInfo.email,
              filePath: itemToResolve.filePath,
              fileUrl: itemToResolve.fileUrl,
              description: itemToResolve.description,
              fileSizeMb: itemToResolve.fileSizeMb,
              pages: itemToResolve.pages,
              type: itemToResolve.type,
            },
            ...prev.filter((p) => p.id !== id),
          ]);
        }
        showToast('Material rejected. Student notified.', 'warning');
      }
    } catch {
      adminService.listModerationQueue().then(setQueue);
      showToast('Action failed. Please try again.', 'error');
    }
  };

  const resolveBatch = async (status: 'approved' | 'rejected') => {
    if (selectedItemIds.size === 0) return;
    const idsToProcess = Array.from(selectedItemIds);
    setIsResolvingBatch(true);
    const itemsToResolve = queue.filter((item) => selectedItemIds.has(item.id));

    // Optimistically update UI
    setQueue((prev) => prev.filter((item) => !selectedItemIds.has(item.id)));
    setSelectedItemIds(new Set());

    try {
      const adminInfo = {
        id: user?.id,
        name: currentAdminName,
        email: user?.email,
        avatar: user?.avatar,
      };

      const metaStr = status === 'approved'
        ? adminService.encodeApprovalMeta({
            adminId: user?.id,
            adminEmail: user?.email,
            adminName: currentAdminName,
            adminAvatar: adminInfo.avatar,
            approvedAt: new Date().toISOString(),
          })
        : adminService.encodeRejectionMeta({
            adminId: user?.id,
            adminEmail: user?.email,
            adminName: currentAdminName,
            adminAvatar: adminInfo.avatar,
            rejectedAt: new Date().toISOString(),
            reason: 'Batch rejection',
          });

      await Promise.all(idsToProcess.map((id) => updateMaterialStatus(id, status, metaStr)));
      adminService.getAdminStats().then(setStats);

      if (status === 'approved') {
        idsToProcess.forEach((id) => adminService.removeStoredRejection(id));
        setRecentRejections((prev) => prev.filter((r) => !idsToProcess.includes(r.id)));

        const newApprovals: adminService.RecentApprovalItem[] = [];
        for (const item of itemsToResolve) {
          adminService.recordApproval(item, adminInfo);
          newApprovals.push({
            id: item.id,
            title: item.title,
            subject: item.subject,
            course: item.course,
            uploaderName: item.uploader,
            uploaderDetails: item.uploaderDetails,
            approvedAt: new Date().toISOString(),
            approvedByAdminId: adminInfo.id,
            approvedByAdminName: adminInfo.name,
            approvedByAdminAvatar: adminInfo.avatar,
            approvedByAdminEmail: adminInfo.email,
            filePath: item.filePath,
            fileUrl: item.fileUrl,
            description: item.description,
            fileSizeMb: item.fileSizeMb,
            pages: item.pages,
            type: item.type,
          });
        }
        setRecentApprovals((prev) => [...newApprovals, ...prev.filter((p) => !idsToProcess.includes(p.id))]);
        showToast(`Approved and published ${idsToProcess.length} document${idsToProcess.length > 1 ? 's' : ''}.`, 'success');
      } else {
        const newRejections: adminService.RecentRejectionItem[] = [];
        for (const item of itemsToResolve) {
          adminService.recordRejection(item, adminInfo, 'Batch rejection');
          newRejections.push({
            id: item.id,
            title: item.title,
            subject: item.subject,
            course: item.course,
            uploaderName: item.uploader,
            uploaderDetails: item.uploaderDetails,
            rejectedAt: new Date().toISOString(),
            rejectionReason: 'Batch rejection',
            rejectedByAdminId: adminInfo.id,
            rejectedByAdminName: adminInfo.name,
            rejectedByAdminAvatar: adminInfo.avatar,
            rejectedByAdminEmail: adminInfo.email,
            filePath: item.filePath,
            fileUrl: item.fileUrl,
            description: item.description,
            fileSizeMb: item.fileSizeMb,
            pages: item.pages,
            type: item.type,
          });
        }
        setRecentRejections((prev) => [...newRejections, ...prev.filter((p) => !idsToProcess.includes(p.id))]);
        showToast(`Rejected ${idsToProcess.length} document${idsToProcess.length > 1 ? 's' : ''}.`, 'warning');
      }
    } catch (err) {
      console.error('Error in batch resolution:', err);
      adminService.listModerationQueue().then(setQueue);
      showToast('Batch action failed. Please try again.', 'error');
    } finally {
      setIsResolvingBatch(false);
    }
  };

  const handleClearAllApprovals = async () => {
    setIsClearing(true);
    try {
      await adminService.deleteAllApprovedMaterials();
      setRecentApprovals([]);
      adminService.getAdminStats().then(setStats);
      showToast('All approved materials and audit logs removed.', 'success');
      setShowClearApprovalsConfirm(false);
    } catch (err) {
      console.error('Failed to clear approvals:', err);
      showToast('Failed to remove approved materials.', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteSingleApproval = async (item: adminService.RecentApprovalItem) => {
    try {
      await adminService.deleteApprovedMaterial(item.id, item.filePath);
      setRecentApprovals((prev) => prev.filter((a) => a.id !== item.id));
      adminService.getAdminStats().then(setStats);
      showToast(`Removed "${cleanDocumentTitle(item.title)}".`, 'success');
    } catch (err) {
      console.error('Failed to remove approval:', err);
      showToast('Failed to remove material.', 'error');
    }
  };

  const handleClearAllRejections = async () => {
    setIsClearing(true);
    try {
      await adminService.deleteAllRejectedMaterials();
      setRecentRejections([]);
      adminService.getAdminStats().then(setStats);
      showToast('All rejection records cleared.', 'success');
      setShowClearRejectionsConfirm(false);
    } catch (err) {
      console.error('Failed to clear rejections:', err);
      showToast('Failed to clear rejections.', 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteSingleRejection = async (item: adminService.RecentRejectionItem) => {
    try {
      await adminService.deleteRejectedMaterial(item.id, item.filePath);
      setRecentRejections((prev) => prev.filter((r) => r.id !== item.id));
      adminService.getAdminStats().then(setStats);
      showToast(`Removed "${cleanDocumentTitle(item.title)}".`, 'success');
    } catch (err) {
      console.error('Failed to remove rejection:', err);
      showToast('Failed to remove rejected record.', 'error');
    }
  };

  const filteredApprovals = useMemo(() => {
    return recentApprovals.filter((app) => {
      if (approvalFilter === 'mine') {
        const myEmail = (user?.email || '').trim().toLowerCase();
        const myId = (user?.id || '').trim();
        const myName = currentAdminName.trim().toLowerCase();

        const approvedEmail = (app.approvedByAdminEmail || '').trim().toLowerCase();
        const approvedId = (app.approvedByAdminId || '').trim();
        const approvedName = (app.approvedByAdminName || '').trim().toLowerCase();

        const matchId = Boolean(myId && approvedId && myId === approvedId);
        const matchEmail = Boolean(myEmail && approvedEmail && myEmail === approvedEmail);
        const matchName = Boolean(
          myName &&
          approvedName &&
          (myName === approvedName || (approvedName.includes(myName) && myName.length >= 3)) &&
          !['admin', 'administrator', 'system'].includes(approvedName)
        );

        if (!matchId && !matchEmail && !matchName) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          app.title.toLowerCase().includes(q) ||
          app.subject.toLowerCase().includes(q) ||
          app.uploaderName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [recentApprovals, approvalFilter, searchQuery, user, currentAdminName]);

  const filteredRejections = useMemo(() => {
    return recentRejections.filter((rej) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          rej.title.toLowerCase().includes(q) ||
          rej.subject.toLowerCase().includes(q) ||
          rej.uploaderName.toLowerCase().includes(q) ||
          (rej.rejectedByAdminName || '').toLowerCase().includes(q) ||
          (rej.rejectionReason || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [recentRejections, searchQuery]);

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-card-border bg-surface-container-lowest/95 backdrop-blur-md shadow-xl text-on-surface select-none"
          >
            {toastMessage.type === 'success' && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
            {toastMessage.type === 'error' && <X size={16} className="text-rose-500 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
            <span className="text-sm font-medium">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-card-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck size={12} />
              Admin Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant max-w-xl">
            Review submitted coursework, monitor content moderation, and track platform metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-card-border bg-surface-container-low hover:bg-surface-container hover:border-card-border-high text-xs font-medium text-on-surface transition-all cursor-pointer disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw size={13} className={cn(isRefreshing && 'animate-spin')} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ── Pending Alert Banner (If items waiting) ── */}
      {queue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] backdrop-blur-xs"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">
                {queue.length} submission{queue.length > 1 ? 's' : ''} awaiting moderation
              </p>
              <p className="text-xs text-on-surface-variant">
                Students are waiting for verification before their study documents go live.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('moderation-queue')?.scrollIntoView({ behavior: 'smooth' })}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-colors cursor-pointer shadow-xs"
          >
            Review Queue
          </button>
        </motion.div>
      )}

      {/* ── KPI Metric Tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 2xl:gap-5">
        {/* Total Students */}
        <button
          type="button"
          onClick={() => navigate('/admin/students')}
          className="group flex flex-col justify-between p-4 sm:p-5 2xl:p-6 rounded-2xl border border-card-border bg-surface-container-low hover:bg-surface-container hover:border-primary/50 hover:shadow-md transition-all text-left cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3 w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant group-hover:text-primary transition-colors flex items-center gap-1.5">
              <span>Students</span>
              <ArrowRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface tabular-nums">
              {(stats?.totalStudents ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-on-surface-variant">Registered scholars</p>
              <span className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Manage &rarr;
              </span>
            </div>
          </div>
        </button>

        {/* Total Documents */}
        <button
          type="button"
          onClick={() => navigate('/admin/documents')}
          className="group flex flex-col justify-between p-4 sm:p-5 2xl:p-6 rounded-2xl border border-card-border bg-surface-container-low hover:bg-surface-container hover:border-indigo-500/50 hover:shadow-md transition-all text-left cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3 w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant group-hover:text-indigo-500 transition-colors flex items-center gap-1.5">
              <span>Documents</span>
              <ArrowRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-500" />
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <Library size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface tabular-nums">
                {(stats?.totalDocuments ?? stats?.totalMaterials ?? 0).toLocaleString()}
              </div>
              <span className="text-xs font-semibold text-on-surface-variant">
                total docs
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-on-surface-variant truncate">
                {stats?.totalMaterials ?? 0} mat &bull; {stats?.totalAssignments ?? 0} assign &bull; {stats?.totalTestPapers ?? 0} papers
              </p>
              <span className="text-[11px] font-semibold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                Manage &rarr;
              </span>
            </div>
          </div>
        </button>

        {/* Active Downloads */}
        <div className="group flex flex-col justify-between p-4 sm:p-5 2xl:p-6 rounded-2xl border border-card-border bg-surface-container-low hover:bg-surface-container hover:border-card-border-high transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Downloads
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Download size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface tabular-nums">
              {(stats?.activeDownloads ?? 0).toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">Activity past 24h</p>
          </div>
        </div>

        {/* Pending Queue */}
        <div
          className={cn(
            'group flex flex-col justify-between p-4 sm:p-5 2xl:p-6 rounded-2xl border transition-all',
            queue.length > 0
              ? 'border-amber-500/40 bg-amber-500/[0.04]'
              : 'border-card-border bg-surface-container-low hover:bg-surface-container hover:border-card-border-high'
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Pending Queue
            </span>
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl',
                queue.length > 0
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-surface-container text-on-surface-variant'
              )}
            >
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface tabular-nums">
              {queue.length}
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">
              {queue.length > 0 ? 'Requires attention' : 'Inbox clear'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Moderation Queue Section ── */}
      <div id="moderation-queue" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-on-surface tracking-tight">Pending Review Queue</h2>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold border',
                queue.length > 0
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-surface-container text-on-surface-variant border-card-border'
              )}
            >
              {queue.length} pending
            </span>
          </div>
        </div>

        {queue.length === 0 ? (
          /* Premium Inbox Zero Card */
          <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl border border-card-border bg-surface-container-low text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-500/20">
              <FolderCheck size={22} />
            </div>
            <h3 className="text-base font-semibold text-on-surface">Queue is clear</h3>
            <p className="mt-1 text-xs text-on-surface-variant max-w-sm">
              All submitted student documents have been verified and processed. New uploads will appear here in real time.
            </p>
          </div>
        ) : (
          /* Active Queue Table */
          <Card padded={false} hoverable={false} className="relative overflow-hidden">
            {/* Batch Toolbar if items selected */}
            {selectedItemIds.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 bg-primary/10 border-b border-primary/20 text-xs">
                <div className="flex items-center gap-2 text-on-surface font-semibold">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary text-[11px]">
                    {selectedItemIds.size}
                  </span>
                  <span>{selectedItemIds.size} document{selectedItemIds.size > 1 ? 's' : ''} selected</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isResolvingBatch}
                    onClick={() => resolveBatch('approved')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    Approve Selected ({selectedItemIds.size})
                  </button>
                  <button
                    type="button"
                    disabled={isResolvingBatch}
                    onClick={() => resolveBatch('rejected')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X size={13} />
                    Reject Selected ({selectedItemIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedItemIds(new Set())}
                    className="text-on-surface-variant hover:text-on-surface px-1.5 py-1 text-[11px] transition-colors cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-surface-container text-xs font-semibold text-on-surface-variant">
                    <th className="w-10 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        aria-label="Select all documents"
                        className="rounded border-card-border-high text-primary focus:ring-primary cursor-pointer h-4 w-4"
                        checked={queue.length > 0 && selectedItemIds.size === queue.length}
                        onChange={toggleSelectAll}
                        title={selectedItemIds.size === queue.length ? 'Deselect all' : 'Select all'}
                      />
                    </th>
                    <th className="px-5 py-3">Document</th>
                    <th className="px-4 py-3">Uploader</th>
                    <th className="px-4 py-3">Course / Subject</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {queue.map((item) => {
                    const isSelected = selectedItemIds.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          'hover:bg-surface-container transition-colors',
                          isSelected && 'bg-primary/5 dark:bg-primary/10'
                        )}
                      >
                        <td className="w-10 px-3 py-3.5 text-center">
                          <input
                            type="checkbox"
                            aria-label={`Select document ${item.title}`}
                            className="rounded border-card-border-high text-primary focus:ring-primary cursor-pointer h-4 w-4"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.id)}
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewItem(item);
                                  setIsApprovedPreview(false);
                                }}
                                className="font-semibold text-on-surface hover:text-primary transition-colors text-left truncate block max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl cursor-pointer"
                              >
                                {cleanDocumentTitle(item.title)}
                              </button>
                              <span className="text-xs text-on-surface-variant">
                                {item.fileSizeMb ? item.fileSizeMb + ' MB' : 'PDF'}
                                {item.pages ? ' · ' + item.pages + ' pages' : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProfile({
                                uploaderId: item.uploaderDetails.id,
                                uploaderName: item.uploaderDetails.name,
                                uploaderAvatar: item.uploaderDetails.avatarUrl || '',
                                uploaderUniversity: item.uploaderDetails.university,
                                uploaderCollege: item.uploaderDetails.college,
                                uploaderUploadsCount: item.uploaderDetails.uploadsCount,
                              })
                            }
                            className="flex items-center gap-2 group cursor-pointer text-left"
                          >
                            <Avatar
                              src={item.uploaderDetails.avatarUrl}
                              name={item.uploaderDetails.name}
                              size={28}
                              className="shrink-0 group-hover:ring-2 group-hover:ring-primary/40 transition-all"
                            />
                            <span className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors truncate max-w-[120px]">
                              {item.uploaderDetails.name}
                            </span>
                          </button>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-on-surface">{item.subject}</span>
                            <span className="inline-flex items-center w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold bg-surface-container-high text-on-surface-variant border border-card-border">
                              {item.course}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-on-surface-variant whitespace-nowrap">
                          {item.date}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewItem(item);
                                setIsApprovedPreview(false);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-card-border bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-all cursor-pointer"
                            >
                              <Eye size={13} />
                              Review
                            </button>
                            <button
                              type="button"
                              onClick={() => resolve(item.id, 'approved')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 size={13} />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingItem(item)}
                              className="inline-flex items-center p-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Reject document"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* ── Recent Approvals & Rejections (Audit Log) ── */}
      <div className="flex flex-col gap-3">
        <Card padded={false} hoverable={false} className="overflow-hidden">
          {/* Card Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-card-border bg-surface-container-lowest">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface tracking-tight">Audit Log</h2>
                {approvalFilter === 'rejected' ? (
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    {recentRejections.length} rejected
                  </span>
                ) : (
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-surface-container text-on-surface-variant border border-card-border">
                    {recentApprovals.length} approved
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {approvalFilter === 'rejected'
                  ? 'History of rejected student materials and moderation reasons.'
                  : 'History of reviewed and published student materials.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2.5">
              {/* Search input */}
              <div className="relative w-full sm:w-auto">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by title, student, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 text-xs rounded-xl bg-surface-container border border-card-border focus:border-primary focus:outline-none w-full sm:w-56 xl:w-72 2xl:w-80 placeholder:text-on-surface-variant/50 text-on-surface"
                />
              </div>

              {/* Segmented control: All Approvals vs My Approvals vs Rejected */}
              <div className="relative flex items-center p-0.5 rounded-xl bg-surface-container border border-card-border select-none overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setApprovalFilter('all')}
                  className={cn(
                    'relative px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer z-10',
                    approvalFilter === 'all' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                  )}
                >
                  {approvalFilter === 'all' && (
                    <motion.div
                      layoutId="adminApprovalTab"
                      className="absolute inset-0 rounded-lg bg-surface-container-lowest shadow-xs border border-card-border/60"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">All Approvals</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter('mine')}
                  className={cn(
                    'relative px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer z-10',
                    approvalFilter === 'mine' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                  )}
                >
                  {approvalFilter === 'mine' && (
                    <motion.div
                      layoutId="adminApprovalTab"
                      className="absolute inset-0 rounded-lg bg-surface-container-lowest shadow-xs border border-card-border/60"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">My Approvals</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalFilter('rejected')}
                  className={cn(
                    'relative flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer z-10',
                    approvalFilter === 'rejected' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-on-surface-variant hover:text-rose-500'
                  )}
                >
                  {approvalFilter === 'rejected' && (
                    <motion.div
                      layoutId="adminApprovalTab"
                      className="absolute inset-0 rounded-lg bg-surface-container-lowest shadow-xs border border-rose-500/30"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span>Rejected</span>
                    {recentRejections.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        {recentRejections.length}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              {/* Clear History Buttons */}
              {approvalFilter !== 'rejected' ? (
                recentApprovals.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearApprovalsConfirm(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    title="Remove all approved materials and records"
                  >
                    <Trash2 size={13} />
                    <span>Clear All Approvals</span>
                  </button>
                )
              ) : (
                recentRejections.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearRejectionsConfirm(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    title="Clear all rejected history"
                  >
                    <Trash2 size={13} />
                    <span>Clear Rejections</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Audit Table */}
          <div className="overflow-x-auto">
            {approvalFilter === 'rejected' ? (
              /* Rejected Materials Table */
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-surface-container text-xs font-semibold text-on-surface-variant">
                    <th className="px-5 py-2.5">Document</th>
                    <th className="px-4 py-2.5">Contributor</th>
                    <th className="px-4 py-2.5">Rejected By</th>
                    <th className="px-4 py-2.5">Reason</th>
                    <th className="px-4 py-2.5">Rejected Date</th>
                    <th className="px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {filteredRejections.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            <FileText size={15} />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewItem({
                                  id: item.id,
                                  title: item.title,
                                  description: item.description,
                                  subject: item.subject,
                                  course: item.course,
                                  filePath: item.filePath || '',
                                  fileUrl: item.fileUrl,
                                  fileSizeMb: item.fileSizeMb,
                                  pages: item.pages,
                                  type: item.type,
                                  uploader: item.uploaderName,
                                  uploaderDetails: item.uploaderDetails || {
                                    id: '',
                                    name: item.uploaderName,
                                  },
                                  date: formatApprovalTime(item.rejectedAt),
                                  status: 'rejected',
                                  rejectionReason: item.rejectionReason,
                                  rejectedByAdminName: item.rejectedByAdminName,
                                });
                                setIsApprovedPreview(false);
                              }}
                              className="font-semibold text-xs sm:text-sm text-on-surface hover:text-rose-500 transition-colors text-left truncate block max-w-[220px] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl cursor-pointer"
                            >
                              {cleanDocumentTitle(item.title)}
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-on-surface-variant truncate max-w-[130px] xl:max-w-[220px] 2xl:max-w-xs">
                                {item.subject}
                              </span>
                              <span className="inline-flex items-center rounded px-1.5 py-px text-[9px] font-semibold bg-surface-container text-on-surface-variant border border-card-border">
                                {item.course}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProfile({
                              uploaderId: item.uploaderDetails?.id || '',
                              uploaderName: item.uploaderName,
                              uploaderAvatar: item.uploaderDetails?.avatarUrl || '',
                              uploaderUniversity: item.uploaderDetails?.university,
                              uploaderCollege: item.uploaderDetails?.college,
                            })
                          }
                          className="flex items-center gap-2 group cursor-pointer text-left"
                        >
                          <Avatar
                            src={item.uploaderDetails?.avatarUrl}
                            name={item.uploaderName}
                            size={24}
                            className="shrink-0 group-hover:ring-2 group-hover:ring-primary/40 transition-all"
                          />
                          <span className="text-xs font-medium text-on-surface group-hover:text-primary transition-colors truncate max-w-[120px] xl:max-w-[180px] 2xl:max-w-xs">
                            {item.uploaderName}
                          </span>
                        </button>
                      </td>

                      {/* Rejected By Column */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={item.rejectedByAdminAvatar}
                            name={item.rejectedByAdminName || 'Admin'}
                            size={22}
                            className="shrink-0 ring-1 ring-rose-500/30"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-on-surface truncate block max-w-[130px] xl:max-w-[180px] 2xl:max-w-xs" title={item.rejectedByAdminName || 'Admin'}>
                              {item.rejectedByAdminName || 'Admin'}
                            </span>
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-0.5">
                              <ShieldAlert size={10} />
                              Moderator
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rejection Reason Column */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 max-w-[180px] xl:max-w-[280px] 2xl:max-w-md truncate" title={adminService.parseRejectionMeta(item.rejectionReason).reason || 'Did not meet guidelines'}>
                          {adminService.parseRejectionMeta(item.rejectionReason).reason || 'Did not meet guidelines'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                        {formatApprovalTime(item.rejectedAt)}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewItem({
                                id: item.id,
                                title: item.title,
                                description: item.description,
                                subject: item.subject,
                                course: item.course,
                                filePath: item.filePath || '',
                                fileUrl: item.fileUrl,
                                fileSizeMb: item.fileSizeMb,
                                pages: item.pages,
                                type: item.type,
                                uploader: item.uploaderName,
                                uploaderDetails: item.uploaderDetails || {
                                  id: '',
                                  name: item.uploaderName,
                                },
                                date: formatApprovalTime(item.rejectedAt),
                                status: 'rejected',
                                rejectionReason: item.rejectionReason,
                                rejectedByAdminName: item.rejectedByAdminName,
                                rejectedByAdminAvatar: item.rejectedByAdminAvatar,
                              });
                              setIsApprovedPreview(false);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-card-border bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleRejection(item)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-card-border bg-surface-container hover:bg-rose-500/15 hover:text-rose-600 text-on-surface-variant transition-colors cursor-pointer"
                            title="Delete this record"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRejections.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-xs text-on-surface-variant">
                        No rejected materials recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* Approved Materials Table */
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-surface-container text-xs font-semibold text-on-surface-variant">
                    <th className="px-5 py-2.5">Document</th>
                    <th className="px-4 py-2.5">Contributor</th>
                    <th className="px-4 py-2.5">Approved By</th>
                    <th className="px-4 py-2.5">Verified Date</th>
                    <th className="px-5 py-2.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {filteredApprovals.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary border border-card-border">
                            <FileText size={15} />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewItem({
                                  id: item.id,
                                  title: item.title,
                                  description: item.description,
                                  subject: item.subject,
                                  course: item.course,
                                  filePath: item.filePath || '',
                                  fileUrl: item.fileUrl,
                                  fileSizeMb: item.fileSizeMb,
                                  pages: item.pages,
                                  type: item.type,
                                  uploader: item.uploaderName,
                                  uploaderDetails: item.uploaderDetails || {
                                    id: '',
                                    name: item.uploaderName,
                                  },
                                  date: formatApprovalTime(item.approvedAt),
                                  status: 'approved',
                                  views: item.views ?? 0,
                                  downloads: item.downloads ?? 0,
                                  likes: 0,
                                  shares: 0,
                                });
                                setIsApprovedPreview(true);
                              }}
                              className="font-semibold text-xs sm:text-sm text-on-surface hover:text-primary transition-colors text-left truncate block max-w-[220px] sm:max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl cursor-pointer"
                            >
                              {cleanDocumentTitle(item.title)}
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-on-surface-variant truncate max-w-[130px] xl:max-w-[220px] 2xl:max-w-xs">
                                {item.subject}
                              </span>
                              <span className="inline-flex items-center rounded px-1.5 py-px text-[9px] font-semibold bg-surface-container text-on-surface-variant border border-card-border">
                                {item.course}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProfile({
                              uploaderId: item.uploaderDetails?.id || '',
                              uploaderName: item.uploaderName,
                              uploaderAvatar: item.uploaderDetails?.avatarUrl || '',
                              uploaderUniversity: item.uploaderDetails?.university,
                              uploaderCollege: item.uploaderDetails?.college,
                            })
                          }
                          className="flex items-center gap-2 group cursor-pointer text-left"
                        >
                          <Avatar
                            src={item.uploaderDetails?.avatarUrl}
                            name={item.uploaderName}
                            size={24}
                            className="shrink-0 group-hover:ring-2 group-hover:ring-primary/40 transition-all"
                          />
                          <span className="text-xs font-medium text-on-surface group-hover:text-primary transition-colors truncate max-w-[120px] xl:max-w-[180px] 2xl:max-w-xs">
                            {item.uploaderName}
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={item.approvedByAdminAvatar}
                            name={item.approvedByAdminName}
                            size={24}
                            className="shrink-0 ring-1.5 ring-emerald-500/30"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-on-surface truncate max-w-[110px] xl:max-w-[160px] 2xl:max-w-xs">
                              {item.approvedByAdminName}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck size={10} /> Verified
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                        {formatApprovalTime(item.approvedAt)}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewItem({
                                id: item.id,
                                title: item.title,
                                description: item.description,
                                subject: item.subject,
                                course: item.course,
                                filePath: item.filePath || '',
                                fileUrl: item.fileUrl,
                                fileSizeMb: item.fileSizeMb,
                                pages: item.pages,
                                type: item.type,
                                uploader: item.uploaderName,
                                uploaderDetails: item.uploaderDetails || {
                                  id: '',
                                  name: item.uploaderName,
                                },
                                date: formatApprovalTime(item.approvedAt),
                                status: 'approved',
                                views: item.views ?? 0,
                                downloads: item.downloads ?? 0,
                                likes: 0,
                                shares: 0,
                                approvedByAdminName: item.approvedByAdminName,
                                approvedByAdminAvatar: item.approvedByAdminAvatar,
                              });
                              setIsApprovedPreview(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-card-border bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleApproval(item)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-card-border bg-surface-container hover:bg-rose-500/15 hover:text-rose-600 text-on-surface-variant transition-colors cursor-pointer"
                            title="Delete this approved document"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredApprovals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-xs text-on-surface-variant">
                        {approvalFilter === 'mine'
                          ? "You haven't approved any submissions yet."
                          : 'No approved records matching your search.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* ── User Profile Drawer (Opens on Right) ── */}
      <UserProfilePanel
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        side="right"
      />

      {/* ── Document Viewer & Details Modal ── */}
      <AdminMaterialViewerModal
        item={previewItem}
        queue={!isApprovedPreview && previewItem?.status !== 'rejected' ? queue : undefined}
        onNavigate={(item) => setPreviewItem(item)}
        onClose={() => setPreviewItem(null)}
        onApprove={
          !isApprovedPreview && previewItem?.status !== 'rejected'
            ? (id) => resolve(id, 'approved')
            : undefined
        }
        onReject={
          !isApprovedPreview && previewItem?.status !== 'rejected'
            ? () => {
                const current = previewItem;
                setPreviewItem(null);
                setRejectingItem(current);
              }
            : undefined
        }
      />

      {/* ── Rejection Reason Modal ── */}
      <RejectMaterialModal
        isOpen={!!rejectingItem}
        itemTitle={rejectingItem?.title || ''}
        onClose={() => setRejectingItem(null)}
        onConfirm={(reason) => {
          if (rejectingItem) {
            resolve(rejectingItem.id, 'rejected', reason);
            setRejectingItem(null);
          }
        }}
      />

      {/* ── Clear All Approvals Confirmation Modal ── */}
      <Modal
        open={showClearApprovalsConfirm}
        onClose={() => !isClearing && setShowClearApprovalsConfirm(false)}
        title="Clear All Approvals Data"
      >
        <div className="space-y-4 pt-1">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Are you sure you want to permanently remove all approved materials? This will delete all approved documents from the database, purge storage files, and clear the audit log history.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-card-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowClearApprovalsConfirm(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearAllApprovals}
              disabled={isClearing}
            >
              {isClearing ? 'Removing...' : 'Yes, Delete All'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Clear All Rejections Confirmation Modal ── */}
      <Modal
        open={showClearRejectionsConfirm}
        onClose={() => !isClearing && setShowClearRejectionsConfirm(false)}
        title="Clear Rejections History"
      >
        <div className="space-y-4 pt-1">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Are you sure you want to clear the entire rejected materials log? This will remove all rejection records and reasons from the audit history.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-card-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowClearRejectionsConfirm(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearAllRejections}
              disabled={isClearing}
            >
              {isClearing ? 'Clearing...' : 'Yes, Clear All'}
            </Button>
          </div>
        </div>
      </Modal>
      <Footer />
    </div>
  );
}

export default AdminDashboardPage;
