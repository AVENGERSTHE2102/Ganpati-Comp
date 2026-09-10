'use client';

import Link from 'next/link';
import {
  ThumbsUp,
  FileText,
  Image as ImageIcon,
  Video,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  MailWarning,
  CheckCircle2,
} from 'lucide-react';
import type { Submission, CategorySlug } from '@/lib/types';
import { CATEGORY_SEEDS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function categoryName(slug: CategorySlug): string {
  return CATEGORY_SEEDS.find((c) => c.id === slug)?.name ?? slug;
}

function formatDate(ts: string | Date | { toDate?: () => Date } | null): string {
  if (!ts) return '';
  const date =
    typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof ts.toDate === 'function'
      ? ts.toDate()
      : new Date(ts as string | Date);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── File Preview ─────────────────────────────────────────────────────────────

function FilePreview({
  fileUrl,
  fileType,
  title,
}: {
  fileUrl: string;
  fileType: string;
  title: string;
}) {
  if (fileType === 'image') {
    return (
      <div className="w-full h-48 sm:h-52 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  if (fileType === 'video') {
    return (
      <div className="w-full h-48 sm:h-52 bg-black flex items-center justify-center overflow-hidden">
        <video
          src={fileUrl}
          className="w-full h-full object-contain"
          controls
          preload="metadata"
          onClick={(e) => e.stopPropagation()}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div className="w-full h-48 sm:h-52 bg-zinc-50 dark:bg-zinc-800 flex flex-col items-center justify-center gap-3 p-4">
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-burgundy/10 dark:bg-burgundy/20 rounded-2xl flex items-center justify-center">
        <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-burgundy dark:text-saffron" />
      </div>
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-xs text-saffron hover:text-saffron-light font-semibold underline underline-offset-2 transition-colors"
      >
        View Document Attached ↗
      </a>
    </div>
  );
}

const FILE_ICONS = { image: ImageIcon, video: Video, pdf: FileText, other: FileText };

// ─── SubmissionCard ───────────────────────────────────────────────────────────

export interface SubmissionCardProps {
  submission: Submission;
  /** Whether the current user has already voted in this category */
  userHasVotedInCategory?: boolean;
  /** The submissionId the user voted for in this category (if any) */
  userVotedSubmissionId?: string;
  /** Whether this specific submission is processing a vote */
  isVoting?: boolean;
  /** Whether any submission is currently processing a vote */
  isAnyVoting?: boolean;
  /** Error message for this specific submission */
  errorMessage?: string;
  /** Voting is open at all */
  votingDisabled?: boolean;
  /** Called when the user clicks Vote */
  onVoteClick?: (submissionId: string, categoryId: CategorySlug) => void;
}

export function SubmissionCard({
  submission,
  userHasVotedInCategory = false,
  userVotedSubmissionId,
  isVoting = false,
  isAnyVoting = false,
  errorMessage,
  votingDisabled = false,
  onVoteClick,
}: SubmissionCardProps) {
  const { user } = useAuth();
  const TypeIcon = FILE_ICONS[submission.fileType] ?? FileText;

  // Real, confirmed vote count from backend (never faked or optimistically spoofed)
  const confirmedVoteCount = submission.voteCount || 0;
  const votedForThis = userVotedSubmissionId === submission.id;
  const votedForOther = userHasVotedInCategory && !votedForThis;

  // ── Determine exact Voting State ───────────────────────────────────────────
  let voteLabel: string;
  let voteTitle: string;
  let buttonDisabled: boolean;
  let buttonClass: string;
  let isLinkToLogin = false;
  let isLinkToVerify = false;

  // State 1: User not logged in
  if (!user) {
    voteLabel = 'Login to vote';
    voteTitle = 'Log in to your account to cast your vote';
    buttonDisabled = false;
    isLinkToLogin = true;
    buttonClass =
      'bg-saffron hover:bg-saffron-light text-white shadow-sm hover:shadow-md active:scale-95';
  }
  // State 2: User logged in but email not verified
  else if (!user.emailVerified) {
    voteLabel = 'Verify email to vote';
    voteTitle = 'Verify your email on the dashboard to enable voting';
    buttonDisabled = false;
    isLinkToVerify = true;
    buttonClass =
      'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200/70 shadow-sm';
  }
  // State 5: Vote is being processed on this submission
  else if (isVoting) {
    voteLabel = 'Voting...';
    voteTitle = 'Submitting your vote to the blockchain / backend...';
    buttonDisabled = true;
    buttonClass = 'bg-saffron/75 text-white cursor-wait opacity-90';
  }
  // State 6: Vote successful (user voted for this submission)
  else if (votedForThis) {
    voteLabel = 'Vote recorded';
    voteTitle = 'Your vote has been recorded for this submission';
    buttonDisabled = true;
    buttonClass =
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 cursor-default';
  }
  // State 3: User already voted in this category (for another submission)
  else if (votedForOther) {
    voteLabel = 'Already voted';
    voteTitle = 'You can only vote once per category. You already voted for another entry.';
    buttonDisabled = true;
    buttonClass =
      'bg-foreground/10 text-foreground/45 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed';
  }
  // Competition voting disabled by organizers or deadline passed
  else if (votingDisabled) {
    voteLabel = 'Voting closed';
    voteTitle = 'Voting is currently closed for this competition';
    buttonDisabled = true;
    buttonClass =
      'bg-foreground/10 text-foreground/45 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed';
  }
  // If another submission is processing a vote, disable to prevent multiple simultaneous requests
  else if (isAnyVoting) {
    voteLabel = 'Vote';
    voteTitle = 'A vote is currently processing. Please wait.';
    buttonDisabled = true;
    buttonClass = 'bg-saffron/50 text-white cursor-wait';
  }
  // State 4: User is eligible
  else {
    voteLabel = 'Vote';
    voteTitle = 'Cast your vote for this submission';
    buttonDisabled = false;
    buttonClass =
      'bg-saffron hover:bg-saffron-light text-white shadow-sm hover:shadow-md active:scale-95';
  }

  const handleVoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (buttonDisabled || isVoting || isAnyVoting) return;
    onVoteClick?.(submission.id, submission.categoryId);
  };

  return (
    <div className="group bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Preview Section */}
      <div className="relative">
        <FilePreview
          fileUrl={submission.fileUrl}
          fileType={submission.fileType}
          title={submission.title}
        />

        {/* Category Pill */}
        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <TypeIcon className="w-3.5 h-3.5 text-saffron" />
          {categoryName(submission.categoryId)}
        </span>

        {/* Vote Recorded Floating Badge */}
        {votedForThis && (
          <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Your Choice
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 sm:p-5">
        {/* Title */}
        <h3 className="font-serif font-bold text-lg leading-snug mb-1 text-foreground line-clamp-1">
          {submission.title}
        </h3>

        {/* Description */}
        <p className="text-foreground/60 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed flex-1">
          {submission.description}
        </p>

        {/* Meta details: Participant Name & Date */}
        <div className="flex items-center gap-3 text-xs text-foreground/60 mb-4 flex-wrap pb-3 border-b border-foreground/5">
          <span className="flex items-center gap-1.5 font-medium text-foreground/80">
            <User className="w-3.5 h-3.5 text-saffron" />
            <span>{submission.participantName}</span>
          </span>

          {submission.createdAt && (
            <span className="flex items-center gap-1 text-foreground/50">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(submission.createdAt as never)}</span>
            </span>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl p-2.5 mb-3"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Email verification reminder banner for unverified logged-in users */}
        {user && !user.emailVerified && (
          <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl p-2.5 mb-3">
            <MailWarning className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <span>Email verification is required before your vote can be cast.</span>
          </div>
        )}

        {/* Footer: Vote Count & Vote Action Button */}
        <div className="flex items-center justify-between pt-2">
          {/* Confirmed Vote Count */}
          <div
            className="flex items-center gap-1.5 text-foreground/70"
            aria-label={`${confirmedVoteCount} votes`}
          >
            <ThumbsUp
              className={cn(
                'w-4 h-4 transition-colors',
                votedForThis ? 'text-emerald-600' : 'text-foreground/50'
              )}
            />
            <span
              className={cn(
                'font-bold text-sm',
                votedForThis && 'text-emerald-700 dark:text-emerald-400'
              )}
            >
              {confirmedVoteCount}
            </span>
            <span className="text-xs text-foreground/50">
              {confirmedVoteCount === 1 ? 'vote' : 'votes'}
            </span>
          </div>

          {/* Action Button depending on state */}
          {isLinkToLogin ? (
            <Link
              href="/login"
              aria-label={`Login to vote for ${submission.title}`}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-saffron focus:ring-offset-2',
                buttonClass
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{voteLabel}</span>
            </Link>
          ) : isLinkToVerify ? (
            <Link
              href="/dashboard"
              title={voteTitle}
              aria-label="Verify email on dashboard to vote"
              className={cn(
                'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
                buttonClass
              )}
            >
              <MailWarning className="w-3.5 h-3.5 text-amber-600" />
              <span>{voteLabel}</span>
            </Link>
          ) : (
            <button
              type="button"
              title={voteTitle}
              disabled={buttonDisabled}
              onClick={handleVoteClick}
              aria-label={`${voteLabel} for ${submission.title}`}
              aria-busy={isVoting}
              aria-pressed={votedForThis}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-saffron focus:ring-offset-2 select-none',
                buttonClass
              )}
            >
              {isVoting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : votedForThis ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
              ) : (
                <ThumbsUp className="w-3.5 h-3.5" />
              )}
              <span>{voteLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
