'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { CATEGORY_SEEDS } from '@/lib/constants';
import type { Submission, CategorySlug, SubmissionStatus } from '@/lib/types';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  Calendar,
  ThumbsUp,
  FileText,
  Video,
  ExternalLink,
  X,
  AlertTriangle,
  User,
  SearchX,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryName(slug: CategorySlug): string {
  return CATEGORY_SEEDS.find((c) => c.id === slug)?.name ?? slug;
}

function formatDate(ts: string | Date | { toDate?: () => Date } | null): string {
  if (!ts) return '—';
  const date =
    typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof ts.toDate === 'function'
      ? ts.toDate()
      : new Date(ts as string | Date);

  if (isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────────

interface ConfirmDialogProps {
  type: 'approve' | 'reject' | 'delete';
  submissionTitle: string;
  participantName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmDialog({
  type,
  submissionTitle,
  participantName,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  const configs = {
    approve: {
      title: 'Approve Submission',
      description: `Are you sure you want to approve "${submissionTitle}" by ${participantName}? It will become immediately visible in the public competition gallery for community voting.`,
      icon: CheckCircle,
      iconClass: 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400',
      confirmClass: 'bg-green-600 hover:bg-green-700 text-white',
      confirmLabel: 'Approve Submission',
    },
    reject: {
      title: 'Reject Submission',
      description: `Are you sure you want to reject "${submissionTitle}" by ${participantName}? The entry will be hidden from the public gallery and will not be eligible for voting.`,
      icon: AlertTriangle,
      iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      confirmLabel: 'Reject Submission',
    },
    delete: {
      title: 'Permanently Delete Submission',
      description: `This action cannot be undone. "${submissionTitle}" by ${participantName} will be permanently removed from the database.`,
      icon: Trash2,
      iconClass: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
      confirmLabel: 'Delete Permanently',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', config.iconClass)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-serif font-bold text-foreground">
              {config.title}
            </h3>
            <p className="text-sm text-foreground/70 mt-1.5 leading-relaxed">
              {config.description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-foreground/10">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-foreground/15 text-sm font-medium hover:bg-foreground/5 text-foreground/80 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50',
              config.confirmClass
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{config.confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Submission View Modal ────────────────────────────────────────────────────

function ViewModal({ submission, onClose }: { submission: Submission; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-black/10 dark:border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-saffron/15 text-saffron">
              {getCategoryName(submission.categoryId)}
            </span>
            <StatusBadge status={submission.status} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">
              {submission.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-foreground/60 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-foreground/80">
                <User className="w-3.5 h-3.5 text-saffron" />
                {submission.participantName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Submitted on {formatDate(submission.createdAt)}
              </span>
              <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
                <ThumbsUp className="w-3.5 h-3.5" />
                {submission.voteCount} votes
              </span>
            </div>
          </div>

          {/* Media Preview */}
          {submission.fileUrl && (
            <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-foreground/10 flex items-center justify-center max-h-96">
              {submission.fileType === 'image' && (
                <img
                  src={submission.fileUrl}
                  alt={submission.title}
                  className="max-h-96 w-full object-contain"
                />
              )}
              {submission.fileType === 'video' && (
                <video
                  src={submission.fileUrl}
                  controls
                  className="max-h-96 w-full rounded-xl"
                />
              )}
              {submission.fileType === 'pdf' && (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-12 h-12 text-saffron mx-auto" />
                  <p className="font-medium text-sm">PDF Document Attached</p>
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-saffron hover:underline font-semibold"
                  >
                    <span>Open in new tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-foreground/50 mb-1.5">
              Description
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line bg-foreground/[0.02] p-4 rounded-xl border border-foreground/5">
              {submission.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-foreground/10 bg-foreground/[0.02] flex items-center justify-between">
          {submission.fileUrl ? (
            <a
              href={submission.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron hover:text-saffron-light"
            >
              <span>Download Original Asset</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-foreground/15 hover:bg-foreground/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Submissions Page ────────────────────────────────────────────────────

type ActionTarget = {
  type: 'approve' | 'reject' | 'delete';
  submission: Submission;
} | null;

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategorySlug>('all');

  // Dialogs
  const [actionPending, setActionPending] = useState<ActionTarget>(null);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);

  const fetchSubmissionsData = useCallback(async () => {
    try {
      const res = await fetch('/api/submissions?status=all', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load submissions');
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setLoading(true);
    await fetchSubmissionsData();
  }, [fetchSubmissionsData]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/submissions?status=all', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { submissions: [] }))
      .then((data) => {
        if (!isMounted) return;
        setSubmissions(data.submissions || []);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!isMounted) return;
        setError((e as Error).message);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Execute confirmed action (approve, reject, delete)
  const handleConfirmAction = async () => {
    if (!actionPending) return;
    const { type, submission } = actionPending;
    setActionLoading(submission.id);

    try {
      if (type === 'approve' || type === 'reject') {
        const res = await fetch(`/api/submissions/${submission.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: type === 'approve' ? 'approved' : 'rejected' }),
        });
        if (!res.ok) throw new Error('Failed to update submission status');
      } else if (type === 'delete') {
        const res = await fetch(`/api/submissions/${submission.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete submission');
      }

      await fetchSubmissionsData();
      setActionPending(null);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter and search logic
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && sub.categoryId !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        const matchesTitle = sub.title?.toLowerCase().includes(queryLower);
        const matchesParticipant = sub.participantName?.toLowerCase().includes(queryLower);
        const matchesDescription = sub.description?.toLowerCase().includes(queryLower);
        if (!matchesTitle && !matchesParticipant && !matchesDescription) return false;
      }

      return true;
    });
  }, [submissions, statusFilter, categoryFilter, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: submissions.length,
      pending: submissions.filter((s) => s.status === 'pending').length,
      approved: submissions.filter((s) => s.status === 'approved').length,
      rejected: submissions.filter((s) => s.status === 'rejected').length,
    };
  }, [submissions]);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-saffron font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Management Console</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Submissions
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Review, approve, and manage participant entries for all competition categories
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-foreground/15 text-sm font-medium hover:bg-foreground/5 text-foreground/80 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-saffron')} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filters & Search Control Bar ───────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-4 sm:p-5 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { key: 'all', label: 'All Submissions', count: counts.all },
              { key: 'pending', label: 'Pending Review', count: counts.pending },
              { key: 'approved', label: 'Approved', count: counts.approved },
              { key: 'rejected', label: 'Rejected', count: counts.rejected },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all',
                statusFilter === tab.key
                  ? 'bg-burgundy text-white shadow-sm font-semibold'
                  : 'bg-foreground/5 hover:bg-foreground/10 text-foreground/70'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  statusFilter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-foreground/10 text-foreground/60'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Category Filter Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-foreground/5">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-foreground/40 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by participant name, title, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl text-sm border border-foreground/15 bg-zinc-50 dark:bg-zinc-800/60 text-foreground focus:border-saffron focus:ring-1 focus:ring-saffron outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-foreground/40 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Select */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-foreground/60 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | CategorySlug)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs sm:text-sm border border-foreground/15 bg-zinc-50 dark:bg-zinc-800/60 text-foreground focus:border-saffron focus:ring-1 focus:ring-saffron outline-none font-medium cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="home-decor">Home Decor</option>
              <option value="reel-making">Reel Making</option>
              <option value="literature">Literature</option>
              <option value="faculty-corner">Faculty Corner</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table & Submissions Content ─────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 p-16 flex flex-col items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-saffron mb-3" />
          <p className="text-sm text-foreground/60">Loading submissions...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 p-16 text-center shadow-sm max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-foreground/5 text-foreground/40 flex items-center justify-center mx-auto">
            <SearchX className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-lg text-foreground">
            No Submissions Found
          </h3>
          <p className="text-xs text-foreground/60 leading-relaxed">
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'No submissions matched your current search filters. Try clearing some criteria.'
              : 'There are no submissions currently registered in the system.'}
          </p>
          {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-saffron text-white hover:bg-saffron-light transition-all shadow-sm mt-2"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
          {/* Submissions Table (Desktop & Tablet) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-foreground/10 bg-foreground/[0.02]">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                    Entry
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-foreground/60 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {filteredSubmissions.map((sub) => {
                  const isPendingAction = actionLoading === sub.id;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-foreground/[0.02] transition-colors"
                    >
                      {/* Entry: Thumbnail + Title */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center flex-shrink-0 border border-foreground/10">
                            {sub.fileType === 'image' && sub.fileUrl ? (
                              <img
                                src={sub.fileUrl}
                                alt={sub.title}
                                className="w-full h-full object-cover"
                              />
                            ) : sub.fileType === 'video' ? (
                              <Video className="w-5 h-5 text-saffron" />
                            ) : (
                              <FileText className="w-5 h-5 text-saffron" />
                            )}
                          </div>
                          <div className="max-w-xs">
                            <p className="font-semibold text-foreground line-clamp-1" title={sub.title}>
                              {sub.title}
                            </p>
                            <p className="text-xs text-foreground/50 line-clamp-1 mt-0.5">
                              {sub.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Participant */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-foreground/80 font-medium">
                        {sub.participantName}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-saffron/10 text-saffron">
                          {getCategoryName(sub.categoryId)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={sub.status} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-foreground/60">
                        {formatDate(sub.createdAt)}
                      </td>

                      {/* Vote Count */}
                      <td className="px-4 py-3.5 text-center font-bold text-sm text-foreground">
                        {sub.voteCount || 0}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Modal */}
                          <button
                            onClick={() => setViewingSubmission(sub)}
                            className="p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
                            title="View Full Submission"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Approve */}
                          {sub.status !== 'approved' && (
                            <button
                              disabled={isPendingAction}
                              onClick={() =>
                                setActionPending({ type: 'approve', submission: sub })
                              }
                              className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors disabled:opacity-50"
                              title="Approve Entry"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Quick Reject */}
                          {sub.status !== 'rejected' && (
                            <button
                              disabled={isPendingAction}
                              onClick={() =>
                                setActionPending({ type: 'reject', submission: sub })
                              }
                              className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors disabled:opacity-50"
                              title="Reject Entry"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            disabled={isPendingAction}
                            onClick={() =>
                              setActionPending({ type: 'delete', submission: sub })
                            }
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                            title="Delete Submission"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Submissions Card Grid (Mobile & Small Tablets) */}
          <div className="lg:hidden divide-y divide-foreground/10">
            {filteredSubmissions.map((sub) => (
              <div key={sub.id} className="p-4 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center flex-shrink-0 border border-foreground/10">
                      {sub.fileType === 'image' && sub.fileUrl ? (
                        <img
                          src={sub.fileUrl}
                          alt={sub.title}
                          className="w-full h-full object-cover"
                        />
                      ) : sub.fileType === 'video' ? (
                        <Video className="w-5 h-5 text-saffron" />
                      ) : (
                        <FileText className="w-5 h-5 text-saffron" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">
                        {sub.title}
                      </h4>
                      <p className="text-xs text-foreground/60 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-saffron" />
                        {sub.participantName}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>

                <div className="flex items-center justify-between text-xs text-foreground/50 pt-2 border-t border-foreground/5">
                  <span className="font-medium text-saffron bg-saffron/10 px-2 py-0.5 rounded-full">
                    {getCategoryName(sub.categoryId)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>{formatDate(sub.createdAt)}</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-purple-600" />
                      {sub.voteCount || 0}
                    </span>
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-foreground/5">
                  <button
                    onClick={() => setViewingSubmission(sub)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-foreground/15 hover:bg-foreground/5 text-foreground flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  {sub.status !== 'approved' && (
                    <button
                      onClick={() =>
                        setActionPending({ type: 'approve', submission: sub })
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {sub.status !== 'rejected' && (
                    <button
                      onClick={() =>
                        setActionPending({ type: 'reject', submission: sub })
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1 shadow-sm"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setActionPending({ type: 'delete', submission: sub })
                    }
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer with Summary */}
          <div className="px-5 py-3.5 bg-foreground/[0.02] border-t border-foreground/10 text-xs text-foreground/50 flex items-center justify-between">
            <span>
              Showing {filteredSubmissions.length} of {submissions.length} submission
              {submissions.length !== 1 ? 's' : ''}
            </span>
            <span className="font-medium">
              Approved: {counts.approved} | Pending: {counts.pending} | Rejected:{' '}
              {counts.rejected}
            </span>
          </div>
        </div>
      )}

      {/* ── Modals & Dialogs ──────────────────────────────────────────────── */}
      {viewingSubmission && (
        <ViewModal
          submission={viewingSubmission}
          onClose={() => setViewingSubmission(null)}
        />
      )}

      {actionPending && (
        <ConfirmDialog
          type={actionPending.type}
          submissionTitle={actionPending.submission.title}
          participantName={actionPending.submission.participantName}
          loading={!!actionLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => setActionPending(null)}
        />
      )}
    </div>
  );
}
