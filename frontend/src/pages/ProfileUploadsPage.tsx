import { motion } from 'framer-motion';
import { AlertTriangle, Eye, FileUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { IconButton } from '../components/ui/IconButton';
import type { Material } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { materialTypeIcon } from '../lib/materialIcons';
import { deleteMaterial, listMyUploadsForUI } from '../services/materialsService';
import { subscribeToMaterialDeletions } from '../services/materialSyncService';
import { parseRejectionMeta } from '../services/adminService';

const statusStyles: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-tertiary-container/20 text-tertiary',
  rejected: 'bg-error-container text-error',
};

const statusLabel: Record<string, string> = {
  approved: 'Approved',
  pending: 'Pending Review',
  rejected: 'Rejected',
};

export function ProfileUploadsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploads, setUploads] = useState<Material[]>([]);

  useEffect(() => {
    if (!user) return;
    listMyUploadsForUI(user.id).then(setUploads);
  }, [user]);

  // Real-time synchronization: remove deleted materials immediately across all students and admins
  useEffect(() => {
    const unsubscribe = subscribeToMaterialDeletions((deletedId) => {
      setUploads((prev) => prev.filter((item) => item.id !== deletedId));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleUploadsUpdated = () => {
      if (user?.id) {
        listMyUploadsForUI(user.id).then(setUploads);
      }
    };
    window.addEventListener('answersbro_user_uploads_updated', handleUploadsUpdated);
    return () => window.removeEventListener('answersbro_user_uploads_updated', handleUploadsUpdated);
  }, [user?.id]);

  const handleDelete = async (material: Material) => {
    const confirmMessage = material.status === 'approved'
      ? `Remove "${material.title}" from your account? It will remain available in community search for other students.`
      : `Delete "${material.title}"? This can't be undone.`;
    if (!window.confirm(confirmMessage)) return;

    setUploads((prev) => prev.filter((item) => item.id !== material.id));
    try {
      await deleteMaterial(material.id, material.filePath, material.status, user?.id);
    } catch {
      if (user) listMyUploadsForUI(user.id).then(setUploads);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">My Uploads</h1>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant">Manage your contributed study materials.</p>
        </div>
        <Link
          to="/upload"
          aria-label="Upload new material"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-card-hover transition-transform duration-150 hover:scale-105"
        >
          <Plus size={20} />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {uploads.map((upload, index) => {
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
                  <p className="text-body-md font-semibold text-on-surface">{upload.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Chip>{upload.subject}</Chip>
                    <span className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${statusStyles[upload.status]}`}>
                      {statusLabel[upload.status]}
                    </span>
                  </div>
                  {upload.status !== 'rejected' && (
                    <div className="mt-2 flex items-center gap-4 text-label-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Eye size={14} /> {upload.views.toLocaleString()} views
                      </span>
                      <span>{upload.downloads.toLocaleString()} downloads</span>
                    </div>
                  )}
                  {upload.status === 'rejected' && (() => {
                    const { reason, meta } = parseRejectionMeta(upload.rejectionReason);
                    const displayReason = (reason && reason !== 'Guidelines not met')
                      ? reason
                      : upload.rejectionReason && !upload.rejectionReason.startsWith('REJECTED:')
                      ? upload.rejectionReason
                      : 'Content did not meet submission guidelines.';
                    const reviewer = meta?.adminName || upload.rejectedByAdminName;
                    return (
                      <div className="mt-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 p-2.5 text-body-xs text-rose-700 dark:text-rose-300 space-y-1">
                        <div className="flex items-start gap-1.5 font-semibold">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                          <span className="text-rose-800 dark:text-rose-200">Reason for rejection:</span>
                          <span className="font-normal text-on-surface">{displayReason}</span>
                        </div>
                        {reviewer && (
                          <p className="text-[11px] text-on-surface-variant pl-4">
                            Reviewed by <strong className="text-on-surface font-semibold">{reviewer}</strong>
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <IconButton label="Delete upload" onClick={() => handleDelete(upload)}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </Card>
            </motion.div>
          );
        })}

        <EmptyState
          icon={<FileUp size={22} />}
          title="You haven't uploaded any more materials"
          description="Share your knowledge with the community!"
          actionLabel="Upload Material"
          onAction={() => navigate('/upload')}
        />
      </div>
    </div>
  );
}

export default ProfileUploadsPage;
