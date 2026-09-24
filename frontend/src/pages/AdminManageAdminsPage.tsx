import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Plus, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import * as adminService from '../services/adminService';

export function AdminManageAdminsPage() {
  const [entries, setEntries] = useState<adminService.AdminAllowlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    adminService
      .listAdminEmails()
      .then(setEntries)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    setIsSubmitting(true);
    try {
      await adminService.addAdminEmail(email);
      setNewEmail('');
      setShowAddModal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (email: string) => {
    setEntries((prev) => prev.filter((entry) => entry.email !== email));
    try {
      await adminService.removeAdminEmail(email);
    } catch {
      load();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">Manage Admins</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Authorize emails to access the admin workspace.
          </p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
          Add Admin
        </Button>
      </div>

      <Card hoverable={false} padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-body-sm">
            <thead>
              <tr className="border-y border-card-border text-label-sm text-on-surface-variant">
                <th className="px-6 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Added</th>
                <th className="px-6 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.email} className="border-b border-card-border last:border-b-0">
                  <td className="px-6 py-3 font-medium text-on-surface">
                    <span className="flex items-center gap-2">
                      {entry.isRoot ? (
                        <>
                          <ShieldCheck size={16} className="shrink-0 text-primary" />
                          <span className="font-semibold text-on-surface">{entry.email}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
                            Main Admin (Fixed)
                          </span>
                        </>
                      ) : (
                        <span>{entry.email}</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.hasAccount ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-0.5 text-label-sm font-medium text-emerald-700 dark:text-emerald-400 w-fit">
                        <CheckCircle2 size={13} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-full bg-tertiary-container/20 px-2.5 py-0.5 text-label-sm font-medium text-tertiary w-fit">
                        <Clock size={13} /> Awaiting password setup
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        aria-label={`Remove ${entry.email}`}
                        disabled={entry.isRoot}
                        onClick={() => handleRemove(entry.email)}
                        title={entry.isRoot ? 'The main admin is fixed and cannot be removed' : undefined}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-error-container text-error hover:bg-error-container/80 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant">
                    No admin emails yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Admin">
        <motion.form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-lg bg-surface-soft p-3 text-body-sm text-on-surface-variant">
            <UserPlus size={18} className="mt-0.5 shrink-0 text-primary" />
            <p>
              This email gains admin access immediately. If it already has an account, it's promoted right away.
              Otherwise, they'll be asked to set a password the first time they sign in.
            </p>
          </div>
          <Input
            label="Email address"
            type="email"
            placeholder="name@lexonit.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="text-body-sm text-error">{error}</p>}
          <div className="mt-1 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Admin'}
            </Button>
          </div>
        </motion.form>
      </Modal>
    </div>
  );
}

export default AdminManageAdminsPage;
