import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { generateQuickId } from '../../lib/idUtils';
import { timeAgo } from '../../lib/timeAgo';
import { cn } from '../../lib/cn';
import {
  claimStudentQuery,
  resolveStudentQuery,
  type StudentQuery,
} from '../../services/queryService';

interface Props {
  readonly query: StudentQuery;
  readonly currentAdminId: string;
  readonly currentAdminName: string;
  readonly onBack?: () => void;
  readonly onQueryUpdated: () => void;
}

export function AdminQueryDetailView({
  query,
  currentAdminId,
  currentAdminName,
  onBack,
  onQueryUpdated,
}: Props) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null);

  const studentQuickId = generateQuickId(query.studentId);
  const isAssignedToMe = query.assignedAdminId === currentAdminId;
  const isAssignedToOther = query.assignedAdminId && query.assignedAdminId !== currentAdminId;
  const isPending = query.status === 'Pending' && !query.assignedAdminId;
  const isResolved = query.status === 'Resolved';

  const cleanPhone = query.studentPhone ? query.studentPhone.replace(/[^0-9]/g, '') : '';

  const handleCopy = (text: string, field: 'phone' | 'email') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle Query Claim
  const handleClaim = async () => {
    setIsClaiming(true);
    setClaimError(null);
    try {
      const result = await claimStudentQuery(query.id, currentAdminId, currentAdminName);
      if (result.success) {
        onQueryUpdated();
      } else {
        setClaimError(result.reason || 'This query has already been assigned to another admin.');
        onQueryUpdated();
      }
    } catch (err: any) {
      setClaimError(err?.message || 'Failed to claim query.');
      onQueryUpdated();
    } finally {
      setIsClaiming(false);
    }
  };

  // Handle Query Resolution
  const handleResolve = async () => {
    if (!window.confirm('Mark this query as resolved? Please confirm you have contacted the student via mobile or email.')) return;
    setIsResolving(true);
    try {
      const res = await resolveStudentQuery(query.id, currentAdminId);
      if (res.success) {
        onQueryUpdated();
      } else {
        alert(res.reason || 'Failed to resolve query.');
      }
    } catch {
      alert('Failed to resolve query.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface overflow-hidden">
      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HelpCircle className="w-5 h-5 stroke-[2]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-on-surface truncate leading-tight">
                {query.subject}
              </h2>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0',
                  query.status === 'Pending' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
                  query.status === 'Opened' && 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
                  query.status === 'Resolved' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                )}
              >
                {query.status === 'Opened' ? 'Assigned' : query.status}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant truncate">
              {query.category} • Submitted {timeAgo(query.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isAssignedToMe && !isResolved && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResolve}
              disabled={isResolving}
              className="text-xs font-semibold px-3 py-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              {isResolving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              <span>Mark as Resolved</span>
            </Button>
          )}

          {isResolved && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolved</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {/* Concurrency Error Banner */}
        {claimError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{claimError}</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Another administrator claimed this query before your action finished.
              </p>
            </div>
          </div>
        )}

        {/* Assigned to another admin warning */}
        {isAssignedToOther && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>
              This query is currently assigned to{' '}
              <strong>{query.assignedAdminName || 'another administrator'}</strong>.
            </span>
          </div>
        )}

        {/* ── Student Information & Contact Details Card ── */}
        <div className="rounded-2xl border border-card-border/70 bg-surface-container-low p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-card-border/60">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant font-bold shadow-2xs">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface leading-tight">
                  {query.studentName}
                </p>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                  Student ID: <span className="text-primary font-semibold">{studentQuickId}</span>
                </p>
              </div>
            </div>

            {/* Quick Contact Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {query.studentPhone ? (
                <div className="flex items-center gap-1.5 text-xs bg-surface-container px-3 py-1.5 rounded-xl border border-card-border/60">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-mono text-[11px] font-semibold text-on-surface">
                    {query.studentPhone}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(query.studentPhone, 'phone')}
                    className="ml-1 p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    title="Copy phone number"
                  >
                    {copiedField === 'phone' ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg border border-card-border/50">
                  No mobile provided
                </span>
              )}

              {query.studentEmail && (
                <div className="flex items-center gap-1.5 text-xs bg-surface-container px-3 py-1.5 rounded-xl border border-card-border/60">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span className="font-mono text-[11px] text-on-surface">
                    {query.studentEmail}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(query.studentEmail, 'email')}
                    className="ml-1 p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    title="Copy email address"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Query Description Body */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Inquiry Description
              </p>
              <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                {query.category}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-card-border/60 text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
              {query.description}
            </div>
          </div>
        </div>

        {/* ── Contact Student Channels (Mobile & Mail Only) ── */}
        <div className="rounded-2xl border border-card-border/70 bg-surface-container-low p-4 sm:p-5 shadow-xs">
          <div className="mb-3">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Direct Contact Channels
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Contact the student directly via their registered mobile number or email address.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Mobile Phone Call */}
            {query.studentPhone ? (
              <a
                href={`tel:${query.studentPhone}`}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-card-border/80 bg-surface hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-on-surface flex items-center gap-1 leading-tight">
                    <span>Call Mobile</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </p>
                  <p className="text-[11px] font-mono text-on-surface-variant truncate mt-0.5">
                    {query.studentPhone}
                  </p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-card-border/50 bg-surface/50 opacity-60">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface leading-tight">Call Mobile</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">No phone provided</p>
                </div>
              </div>
            )}

            {/* 2. WhatsApp Direct */}
            {query.studentPhone ? (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-card-border/80 bg-surface hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-on-surface flex items-center gap-1 leading-tight">
                    <span>WhatsApp</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                    Message via WhatsApp
                  </p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-card-border/50 bg-surface/50 opacity-60">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface leading-tight">WhatsApp</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">No phone provided</p>
                </div>
              </div>
            )}

            {/* 3. Send Email */}
            {query.studentEmail ? (
              <a
                href={`mailto:${query.studentEmail}?subject=Regarding your Studexa query: ${encodeURIComponent(query.subject)}`}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-card-border/80 bg-surface hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-on-surface flex items-center gap-1 leading-tight">
                    <span>Send Email</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </p>
                  <p className="text-[11px] font-mono text-on-surface-variant truncate mt-0.5">
                    {query.studentEmail}
                  </p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-card-border/50 bg-surface/50 opacity-60">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface leading-tight">Send Email</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">No email provided</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Resolution Status Card (when resolved) ── */}
        {isResolved && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Query Resolved</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                This student query was marked as resolved {query.resolvedAt ? `(${timeAgo(query.resolvedAt)})` : ''}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Action Bar (Claim / Mark as Resolved) ── */}
      {!isResolved && (
        <div className="shrink-0 p-3 sm:p-4 border-t border-card-border/70 bg-surface">
          {isPending ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-container-low border border-card-border/70 text-xs">
              <div>
                <p className="font-semibold text-on-surface">Unclaimed Student Query</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Claim this query to assign it to yourself and coordinate with the student.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleClaim}
                disabled={isClaiming}
                className="text-xs font-semibold px-4 py-2 shrink-0"
              >
                {isClaiming ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                )}
                <span>Claim Query</span>
              </Button>
            </div>
          ) : isAssignedToOther ? (
            <div className="p-3 text-center rounded-xl bg-surface-container-low border border-card-border/70 text-xs text-on-surface-variant">
              This query is assigned to another admin. Only the assigned administrator can resolve it.
            </div>
          ) : isAssignedToMe ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
              <div>
                <p className="font-semibold text-on-surface">You are handling this query</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Contact the student via phone or email above. Once resolved, mark it complete.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleResolve}
                disabled={isResolving}
                className="text-xs font-semibold px-4 py-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isResolving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                )}
                <span>Mark as Resolved</span>
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}