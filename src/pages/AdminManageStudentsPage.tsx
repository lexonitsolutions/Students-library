import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Download,
  Eye,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { UserProfilePanel, type UploaderProfile } from '../components/ui/UserProfilePanel';
import { cn } from '../lib/cn';
import * as adminService from '../services/adminService';

export function AdminManageStudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<adminService.StudentUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_uploads' | 'no_uploads'>('all');
  const [studentToDelete, setStudentToDelete] = useState<adminService.StudentUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      const data = await adminService.listStudents();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
      showToast('Could not load students list.', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (student.email?.toLowerCase() === 'hr@lexonit.com') return false;
      if (filterType === 'with_uploads' && student.uploadsCount === 0) return false;
      if (filterType === 'no_uploads' && student.uploadsCount > 0) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        student.name.toLowerCase().includes(q) ||
        (student.username && student.username.toLowerCase().includes(q)) ||
        (student.email && student.email.toLowerCase().includes(q)) ||
        (student.university && student.university.toLowerCase().includes(q)) ||
        (student.college && student.college.toLowerCase().includes(q)) ||
        (student.branch && student.branch.toLowerCase().includes(q))
      );
    });
  }, [students, filterType, searchQuery]);

  const activeUploadersCount = useMemo(() => {
    return students.filter((s) => s.uploadsCount > 0).length;
  }, [students]);

  const totalUploadsCount = useMemo(() => {
    return students.reduce((sum, s) => sum + (s.uploadsCount || 0), 0);
  }, [students]);

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    const target = studentToDelete;
    setIsDeleting(true);

    // Optimistic UI update
    setStudents((prev) => prev.filter((s) => s.id !== target.id));
    setStudentToDelete(null);

    try {
      await adminService.deleteStudent(target.id);
      showToast(`Student "${target.name}" has been permanently deleted.`, 'success');
      // Background refresh to ensure sync
      loadData(true);
    } catch (err) {
      console.error('Failed to delete student:', err);
      showToast('Failed to delete student account. Please try again.', 'error');
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
                Manage Users
              </h1>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {students.length} users
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">
              Inspect user profiles, monitor contributions, and remove unauthorized accounts.
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

      {/* -- Quick Metrics -- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 2xl:gap-5">
        <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-card-border bg-surface-container-low">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users size={18} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-on-surface tabular-nums">
              {students.length}
            </div>
            <p className="text-xs text-on-surface-variant">Total Registered Students</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-card-border bg-surface-container-low">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-on-surface tabular-nums">
              {activeUploadersCount}
            </div>
            <p className="text-xs text-on-surface-variant">Active Document Contributors</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-card-border bg-surface-container-low">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <Download size={18} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-on-surface tabular-nums">
              {totalUploadsCount}
            </div>
            <p className="text-xs text-on-surface-variant">Materials Published by Students</p>
          </div>
        </div>
      </div>

      {/* -- Filter Bar & Table Card -- */}
      <Card padded={false} hoverable={false} className="overflow-hidden">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-card-border bg-surface-container-lowest">
          <div className="relative flex-1 max-w-sm 2xl:max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, college, branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 pl-8.5 pr-3 text-xs rounded-xl bg-surface-container border border-card-border focus:border-primary focus:outline-none w-full placeholder:text-on-surface-variant/50 text-on-surface"
            />
          </div>

          <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-surface-container border border-card-border select-none self-start sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                filterType === 'all' ? 'bg-surface-container-lowest text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              All ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('with_uploads')}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                filterType === 'with_uploads' ? 'bg-surface-container-lowest text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              With Uploads ({activeUploadersCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('no_uploads')}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                filterType === 'no_uploads' ? 'bg-surface-container-lowest text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              No Uploads ({students.length - activeUploadersCount})
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-card-border bg-surface-container text-xs font-semibold text-on-surface-variant">
                <th className="px-5 py-3">Student</th>
                <th className="px-4 py-3">Academic Info</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-surface-container/60 transition-colors">
                  {/* Student profile */}
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedProfile({
                          uploaderId: student.id,
                          uploaderName: student.name,
                          uploaderUsername: student.username,
                          uploaderAvatar: student.avatarUrl || '',
                          uploaderUniversity: student.university || undefined,
                          uploaderCollege: student.college || undefined,
                          uploaderUploadsCount: student.uploadsCount,
                          uploaderJoinedAt: student.createdAt,
                        })
                      }
                      className="flex items-center gap-3 text-left group cursor-pointer"
                    >
                      <Avatar
                        src={student.avatarUrl || undefined}
                        name={student.name}
                        size={36}
                        className="shrink-0 ring-1 ring-card-border group-hover:ring-2 group-hover:ring-primary/50 transition-all"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate block max-w-[200px] xl:max-w-xs 2xl:max-w-md">
                            {student.name}
                          </span>
                          {student.role === 'admin' && (
                            <span
                              className="h-2 w-2 rounded-full bg-red-500 shrink-0 shadow-xs"
                              title="Admin"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {student.username && (
                            <span className="text-[11px] font-medium text-primary truncate max-w-[100px] xl:max-w-[140px]">
                              {student.username}
                            </span>
                          )}
                          {student.email && (
                            <span className="text-[11px] text-on-surface-variant truncate max-w-[150px] xl:max-w-[220px] 2xl:max-w-xs" title={student.email}>
                              {student.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </td>

                  {/* Academic Info */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-on-surface truncate max-w-[180px] xl:max-w-xs 2xl:max-w-sm" title={student.college || student.university || 'Not specified'}>
                        {student.college || student.university || 'General Student'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {student.branch && (
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-surface-container text-on-surface-variant border border-card-border truncate max-w-[120px] xl:max-w-[180px]">
                            {student.branch}
                          </span>
                        )}
                        {student.year && (
                          <span className="text-[10px] text-on-surface-variant">
                            Year {student.year}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Activity Stats */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs font-semibold text-on-surface" title="Uploaded Materials">
                        <BookOpen size={13} className="text-primary" />
                        <span>{student.uploadsCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-on-surface-variant" title="Downloads Count">
                        <Download size={13} />
                        <span>{student.downloadsCount}</span>
                      </div>
                    </div>
                  </td>

                  {/* Joined Date */}
                  <td className="px-4 py-3.5 text-xs text-on-surface-variant whitespace-nowrap">
                    {student.createdAt
                      ? new Date(student.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Unknown'}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedProfile({
                            uploaderId: student.id,
                            uploaderName: student.name,
                            uploaderUsername: student.username,
                            uploaderAvatar: student.avatarUrl || '',
                            uploaderUniversity: student.university || undefined,
                            uploaderCollege: student.college || undefined,
                            uploaderUploadsCount: student.uploadsCount,
                            uploaderJoinedAt: student.createdAt,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-card-border bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface transition-all cursor-pointer"
                        title="View student profile and uploads"
                      >
                        <Eye size={12} />
                        <span>Profile</span>
                      </button>

                      {student.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => setStudentToDelete(student)}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Delete student account"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-on-surface-variant">
                    {searchQuery.trim()
                      ? `No students matching "${searchQuery}".`
                      : 'No student accounts found.'}
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-primary" />
                      <span>Loading students...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* -- Student Profile Drawer (Opens on Right) -- */}
      <UserProfilePanel
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        side="right"
      />

      {/* -- Delete Student Confirmation Modal -- */}
      <Modal
        open={Boolean(studentToDelete)}
        onClose={() => !isDeleting && setStudentToDelete(null)}
        title="Delete Student Account"
      >
        {studentToDelete && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-card-border">
              <Avatar
                src={studentToDelete.avatarUrl || undefined}
                name={studentToDelete.name}
                size={40}
                className="shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">
                  {studentToDelete.name}
                </p>
                <p className="text-xs text-on-surface-variant truncate">
                  {studentToDelete.email || studentToDelete.username || 'No email registered'}
                </p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete this student account?
              {studentToDelete.uploadsCount > 0 && (
                <span className="block mt-1 font-semibold text-rose-600 dark:text-rose-400">
                  This will also purge all {studentToDelete.uploadsCount} uploaded document{studentToDelete.uploadsCount > 1 ? 's' : ''} from the library and storage.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-card-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStudentToDelete(null)}
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
                {isDeleting ? 'Deleting...' : 'Yes, Delete Student'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminManageStudentsPage;
