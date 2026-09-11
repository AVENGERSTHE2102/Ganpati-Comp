'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CATEGORY_SEEDS } from '@/lib/constants';
import type { Submission, CategorySlug } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  X,
  User,
  Calendar,
  ThumbsUp,
  FileText,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Edit3,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubmissionDetailModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  // Voting props
  userHasVotedInCategory?: boolean;
  userVotedSubmissionId?: string;
  isVoting?: boolean;
  isAnyVoting?: boolean;
  votingDisabled?: boolean;
  onVoteClick?: (submissionId: string, categoryId: CategorySlug) => void;
  // Submitter edit callback
  onSubmissionUpdated?: (updatedSubmission: Submission) => void;
}

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

export function SubmissionDetailModal({
  submission,
  isOpen,
  onClose,
  userHasVotedInCategory = false,
  userVotedSubmissionId,
  isVoting = false,
  isAnyVoting = false,
  votingDisabled = false,
  onVoteClick,
  onSubmissionUpdated,
}: SubmissionDetailModalProps) {
  const { user, role } = useAuth();

  // Local state for inline edit
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<CategorySlug>('home-decor');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [currentSub, setCurrentSub] = useState<Submission | null>(submission);

  // Sync current submission when prop changes
  useEffect(() => {
    setCurrentSub(submission);
    if (submission) {
      setEditTitle(submission.title);
      setEditDesc(submission.description);
      setEditCategory(submission.categoryId);
      setIsEditing(false);
      setSaveError('');
    }
  }, [submission]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !currentSub) return null;

  const isOwner = Boolean(user && user.uid === currentSub.participantId);
  const canEdit = isOwner || role === 'admin';

  const votedForThis = userVotedSubmissionId === currentSub.id;
  const votedForOther = userHasVotedInCategory && !votedForThis;

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || editTitle.trim().length < 3) {
      setSaveError('Title must be at least 3 characters.');
      return;
    }
    if (!editDesc.trim() || editDesc.trim().length < 10) {
      setSaveError('Description must be at least 10 characters.');
      return;
    }

    setSaveLoading(true);
    setSaveError('');

    try {
      const res = await fetch(`/api/submissions/${currentSub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc.trim(),
          categoryId: editCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update submission.');
      }

      const updated = {
        ...currentSub,
        title: editTitle.trim(),
        description: editDesc.trim(),
        categoryId: editCategory,
      };

      setCurrentSub(updated);
      setIsEditing(false);
      onSubmissionUpdated?.(updated);
    } catch (err: unknown) {
      setSaveError((err as Error).message || 'Failed to update submission.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-black/10 dark:border-white/10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-foreground/10 bg-foreground/[0.02]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full bg-saffron/15 text-saffron">
              {getCategoryName(currentSub.categoryId)}
            </span>
            {votedForThis && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Voted by You
              </span>
            )}
            {isOwner && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                Your Submission
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-foreground/80 hover:text-saffron hover:bg-saffron/10 border border-foreground/10 transition-colors"
                title="Edit submission details"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {/* 1. Full Media Viewer */}
          <div className="rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-foreground/10 flex items-center justify-center">
            {currentSub.fileType === 'image' && (
              <img
                src={currentSub.fileUrl}
                alt={currentSub.title}
                className="max-h-[500px] w-full object-contain rounded-xl"
              />
            )}

            {currentSub.fileType === 'video' && (
              <video
                src={currentSub.fileUrl}
                controls
                autoPlay={false}
                className="max-h-[500px] w-full rounded-xl"
              >
                Your browser does not support the video tag.
              </video>
            )}

            {(currentSub.fileType === 'pdf' || currentSub.fileType === 'other') && (
              <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-4 w-full">
                <div className="w-16 h-16 rounded-2xl bg-saffron/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-saffron" />
                </div>
                <div>
                  <h4 className="font-semibold text-base mb-1">Attached Document</h4>
                  <p className="text-xs text-foreground/60 max-w-sm">
                    Click below to open and review the full submitted document or essay.
                  </p>
                </div>
                <a
                  href={currentSub.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-saffron hover:bg-saffron-light text-white text-xs font-semibold shadow-md transition-all"
                >
                  <span>Open Full Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* 2. Content or Edit Mode */}
          {isEditing ? (
            /* Submitter Edit Form */
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif font-bold text-burgundy dark:text-foreground flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-saffron" />
                  Edit Your Submission
                </h3>
                <span className="text-xs text-foreground/50">Changes update immediately</span>
              </div>

              {saveError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-foreground/15 bg-white dark:bg-zinc-800 text-foreground focus:outline-none focus:border-saffron"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as CategorySlug)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-foreground/15 bg-white dark:bg-zinc-800 text-foreground focus:outline-none focus:border-saffron"
                >
                  {CATEGORY_SEEDS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-foreground/15 bg-white dark:bg-zinc-800 text-foreground focus:outline-none focus:border-saffron"
                  required
                  minLength={10}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(currentSub.title);
                    setEditDesc(currentSub.description);
                    setEditCategory(currentSub.categoryId);
                    setSaveError('');
                  }}
                  disabled={saveLoading}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-foreground/15 hover:bg-foreground/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-saffron hover:bg-saffron-light text-white shadow-md transition-all"
                >
                  {saveLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Normal View Mode */
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-burgundy dark:text-foreground">
                  {currentSub.title}
                </h2>

                <div className="flex items-center gap-4 text-xs text-foreground/60 mt-2 flex-wrap">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground/80">
                    <User className="w-3.5 h-3.5 text-saffron" />
                    <span>{currentSub.participantName}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Submitted on {formatDate(currentSub.createdAt)}</span>
                  </span>

                  <span className="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>
                      {currentSub.voteCount} {currentSub.voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-foreground/50 mb-1.5">
                  About this Entry
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line bg-foreground/[0.02] p-4 rounded-xl border border-foreground/5">
                  {currentSub.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Voting & Actions */}
        <div className="px-5 sm:px-7 py-4 border-t border-foreground/10 bg-foreground/[0.02] flex items-center justify-between gap-3 flex-wrap">
          {/* Vote count status */}
          <div className="flex items-center gap-2">
            <ThumbsUp
              className={cn(
                'w-4 h-4',
                votedForThis ? 'text-emerald-600' : 'text-foreground/50'
              )}
            />
            <span className="text-sm font-bold">
              {currentSub.voteCount} {currentSub.voteCount === 1 ? 'vote' : 'votes'}
            </span>
          </div>

          {/* Voting Action Button */}
          <div className="flex items-center gap-3">
            {!user ? (
              <Link
                href={`/login?returnUrl=/category/${currentSub.categoryId}`}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-saffron hover:bg-saffron-light text-white shadow-sm transition-all"
              >
                Login to Vote
              </Link>
            ) : !user.emailVerified ? (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Verify email to vote
              </span>
            ) : votingDisabled ? (
              <span className="text-xs text-foreground/40 italic">Voting closed</span>
            ) : (
              <button
                onClick={() => onVoteClick?.(currentSub.id, currentSub.categoryId)}
                disabled={isVoting || isAnyVoting}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer',
                  isVoting
                    ? 'bg-saffron/70 text-white cursor-wait'
                    : votedForThis
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                    : votedForOther
                    ? 'bg-saffron/10 text-saffron border border-saffron/30 hover:bg-saffron hover:text-white'
                    : 'bg-saffron hover:bg-saffron-light text-white hover:shadow-md'
                )}
                title={
                  votedForThis
                    ? 'Click to revoke your vote'
                    : votedForOther
                    ? 'Click to switch your vote to this entry'
                    : 'Click to vote for this entry'
                }
              >
                {isVoting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : votedForThis ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Voted ✓ (Click to Revoke)</span>
                  </>
                ) : votedForOther ? (
                  <>
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Switch Vote to This</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Vote for this Entry</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-full border border-foreground/15 hover:bg-foreground/5 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
