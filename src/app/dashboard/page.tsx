'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORY_SEEDS } from '@/lib/constants';
import type { Submission, CategorySlug, AppUser, SubmissionStatus } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  User,
  CheckCircle2,
  Clock,
  XCircle,
  ThumbsUp,
  FileText,
  Video,
  Eye,
  PlusCircle,
  ExternalLink,
  Loader2,
  Calendar,
  X,
  Mail,
  ShieldAlert,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubmissionDetailModal } from '@/components/gallery/SubmissionDetailModal';

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

// ─── Dashboard Component ──────────────────────────────────────────────────────

function ParticipantDashboardContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<SubmissionStatus | 'all'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    fetch(`/api/submissions?participantId=${user.uid}&status=all`, {
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : { submissions: [] }))
      .then((data) => {
        if (!isMounted) return;
        setSubmissions(data.submissions || []);
        setProfile({
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: (user.role as 'participant' | 'admin') || 'participant',
          createdAt: new Date().toISOString(),
          emailVerified: user.emailVerified,
          image: user.photoURL,
        });
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(err);
        setError((err as Error).message || 'Failed to load dashboard data.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Stats calculation
  const totalSubmissions = submissions.length;
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;
  const totalVotes = submissions.reduce((acc, curr) => acc + (curr.voteCount || 0), 0);

  // Filtered submissions
  const filteredSubmissions =
    activeTab === 'all'
      ? submissions
      : submissions.filter((s) => s.status === activeTab);

  const participantName =
    profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Participant';
  const isEmailVerified = Boolean(user?.emailVerified);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-10">
      {/* ── Header & Profile Section ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-black/5 dark:border-white/5 shadow-sm p-5 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-start gap-3.5 sm:gap-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={participantName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-saffron/30 flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-saffron/15 text-saffron flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-burgundy dark:text-foreground truncate">
                  {participantName}
                </h1>
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-burgundy/10 text-burgundy dark:text-saffron">
                  Participant
                </span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/60 mt-1 flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap w-full sm:w-auto">
            <Link
              href="/submit"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-saffron hover:bg-saffron-light text-white px-4 sm:px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Entry</span>
            </Link>
            <Link
              href="/categories"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 border border-foreground/15 hover:bg-foreground/5 text-foreground px-3.5 sm:px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all"
            >
              <span>Explore Gallery</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Email Verification Status Card */}
        <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-foreground/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isEmailVerified ? 'Verified Account' : 'Google Account'}</span>
            </div>
            <p className="text-xs text-foreground/60 leading-relaxed">
              Your account is authenticated with Google and eligible to cast votes in all categories.
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Overview ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-[11px] sm:text-xs font-medium text-foreground/60 uppercase tracking-wider">
            Total Entries
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground">{totalSubmissions}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-[11px] sm:text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending Review
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
            {pendingCount}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-[11px] sm:text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
            {approvedCount}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <p className="text-[11px] sm:text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
            {rejectedCount}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[11px] sm:text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            Votes Received
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">
            {totalVotes}
          </p>
        </div>
      </div>

      {/* ── Submissions Section ────────────────────────────────────────────── */}
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">Your Submissions</h2>
            <p className="text-xs sm:text-sm text-foreground/60 mt-0.5">
              Track the approval status and community votes for your competition entries
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-foreground/5 border border-foreground/10 overflow-x-auto max-w-full pb-1 sm:pb-1 scrollbar-none self-start sm:self-auto">
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'approved', label: 'Approved' },
                { key: 'rejected', label: 'Rejected' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm font-semibold'
                    : 'text-foreground/60 hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-saffron" />
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-saffron/10 text-saffron flex items-center justify-center mx-auto">
              <PlusCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground">
              {activeTab === 'all' ? 'No Submissions Yet' : `No ${activeTab} Submissions`}
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {activeTab === 'all'
                ? 'You have not submitted any entries to the competition yet. Choose a category and share your creative work!'
                : `You currently have no entries with "${activeTab}" status.`}
            </p>
            {activeTab === 'all' && (
              <Link
                href="/submit"
                className="inline-block bg-saffron hover:bg-saffron-light text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-md mt-2"
              >
                Submit Your First Entry
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((sub) => {
              const isRejected = sub.status === 'rejected';
              const isPending = sub.status === 'pending';
              const isApproved = sub.status === 'approved';

              return (
                <div
                  key={sub.id}
                  className={cn(
                    'bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md',
                    isRejected
                      ? 'border-red-200 dark:border-red-900/40'
                      : 'border-black/5 dark:border-white/5'
                  )}
                >
                  {/* Card Media Preview Header */}
                  <div className="relative h-44 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                    {sub.fileType === 'image' && sub.fileUrl ? (
                      <img
                        src={sub.fileUrl}
                        alt={sub.title}
                        className="w-full h-full object-cover"
                      />
                    ) : sub.fileType === 'video' ? (
                      <div className="flex flex-col items-center gap-2 text-foreground/50">
                        <Video className="w-10 h-10 text-saffron" />
                        <span className="text-xs font-medium">Video Submission</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-foreground/50">
                        <FileText className="w-10 h-10 text-saffron" />
                        <span className="text-xs font-medium">Document / PDF</span>
                      </div>
                    )}

                    {/* Status Badge Over Preview */}
                    <div className="absolute top-3 right-3 shadow-md">
                      <StatusBadge status={sub.status} />
                    </div>

                    {/* Category pill */}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium">
                      {getCategoryName(sub.categoryId)}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-foreground line-clamp-1">
                        {sub.title}
                      </h3>
                      <p className="text-xs text-foreground/60 mt-1 line-clamp-2">
                        {sub.description}
                      </p>
                    </div>

                    {/* Status callout banner */}
                    {isRejected && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600" />
                        <span className="font-medium">
                          Rejected by admin: Entry is not visible in public gallery.
                        </span>
                      </div>
                    )}

                    {isPending && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0 text-amber-600" />
                        <span>Awaiting admin review before publishing.</span>
                      </div>
                    )}

                    {isApproved && (
                      <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 text-green-700 dark:text-green-300 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          Live & Public
                        </span>
                        <Link
                          href={`/category/${sub.categoryId}`}
                          className="text-saffron hover:underline font-semibold text-xs inline-flex items-center gap-0.5"
                        >
                          <span>View Gallery</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {/* Metadata footer */}
                    <div className="pt-3 border-t border-foreground/10 flex items-center justify-between text-xs text-foreground/50">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(sub.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{sub.voteCount || 0}</span>
                        </div>

                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="p-1.5 rounded-lg hover:bg-foreground/5 text-foreground/70 hover:text-foreground transition-colors flex items-center gap-1 font-medium"
                          title="View Submission Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          isOpen={Boolean(selectedSubmission)}
          onClose={() => setSelectedSubmission(null)}
          onSubmissionUpdated={(updated) => {
            setSubmissions((prev) =>
              prev.map((s) => (s.id === updated.id ? updated : s))
            );
            setSelectedSubmission(updated);
          }}
        />
      )}
    </div>
  );
}

export default function ParticipantDashboardPage() {
  return (
    <ProtectedRoute>
      <ParticipantDashboardContent />
    </ProtectedRoute>
  );
}
