'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompetitionSettings } from '@/hooks/useCompetitionSettings';
import {
  Sliders,
  CheckCircle,
  AlertCircle,
  Clock,
  Save,
  Loader2,
  Calendar,
  X,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to format a Date into YYYY-MM-DDTHH:mm for datetime-local input
function formatToDatetimeLocal(date: Date | null): string {
  if (!date) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function CompetitionControls() {
  const { user } = useAuth();
  const {
    settings,
    loading: settingsLoading,
    submissionDeadlineDate,
    votingDeadlineDate,
    hasSubmissionDeadlinePassed,
    hasVotingDeadlinePassed,
    isSubmissionsOpen,
    isVotingOpen,
    reloadSettings,
  } = useCompetitionSettings();

  const [userEdits, setUserEdits] = useState<{
    submissionsOpen?: boolean;
    votingOpen?: boolean;
    submissionDeadlineInput?: string;
    votingDeadlineInput?: string;
  } | null>(null);

  const submissionsOpen = userEdits?.submissionsOpen ?? settings.submissionsOpen;
  const votingOpen = userEdits?.votingOpen ?? settings.votingOpen;
  const submissionDeadlineInput =
    userEdits?.submissionDeadlineInput ?? formatToDatetimeLocal(submissionDeadlineDate);
  const votingDeadlineInput =
    userEdits?.votingDeadlineInput ?? formatToDatetimeLocal(votingDeadlineDate);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const submissionDeadline = submissionDeadlineInput
        ? new Date(submissionDeadlineInput).toISOString()
        : null;

      const votingDeadline = votingDeadlineInput
        ? new Date(votingDeadlineInput).toISOString()
        : null;

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionsOpen,
          votingOpen,
          submissionDeadline,
          votingDeadline,
          updatedBy: user?.email || user?.uid || 'admin',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update competition settings.');
      }

      setUserEdits(null);
      await reloadSettings();
      setSuccessMessage('Competition settings updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage((err as Error).message || 'Failed to update competition settings.');
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 p-8 flex items-center justify-center min-h-[240px]">
        <Loader2 className="w-6 h-6 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-6 sm:p-8">
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-5 border-b border-foreground/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-saffron/10 text-saffron flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-foreground">
              Competition Controls
            </h2>
            <p className="text-xs text-foreground/60">
              Manage live participant submission and voting periods
            </p>
          </div>
        </div>

        {/* Live Status Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5',
              isSubmissionsOpen
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isSubmissionsOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              )}
            />
            Submissions: {isSubmissionsOpen ? 'Open' : 'Closed'}
          </div>

          <div
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5',
              isVotingOpen
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isVotingOpen ? 'bg-purple-500 animate-pulse' : 'bg-zinc-400'
              )}
            />
            Voting: {isVotingOpen ? 'Open' : 'Closed'}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2.5">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Control Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Submissions Section ────────────────────────────────────────── */}
          <div className="p-5 rounded-xl border border-foreground/10 bg-foreground/[0.02] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Submissions Acceptance
                </h3>
                <p className="text-xs text-foreground/60">
                  Allow participants to submit entries
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={submissionsOpen}
                onClick={() =>
                  setUserEdits((prev) => ({
                    ...prev,
                    submissionsOpen: !submissionsOpen,
                  }))
                }
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-saffron focus:ring-offset-2',
                  submissionsOpen ? 'bg-saffron' : 'bg-foreground/20'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    submissionsOpen ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Submission Deadline */}
            <div>
              <label
                htmlFor="submissionDeadline"
                className="block text-xs font-medium text-foreground/70 mb-1.5"
              >
                Submission Deadline (Optional)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="submissionDeadline"
                    type="datetime-local"
                    value={submissionDeadlineInput}
                    onChange={(e) =>
                      setUserEdits((prev) => ({
                        ...prev,
                        submissionDeadlineInput: e.target.value,
                      }))
                    }
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-foreground/15 bg-white dark:bg-zinc-800 text-foreground focus:border-saffron focus:ring-1 focus:ring-saffron outline-none transition-all"
                  />
                  <Calendar className="w-4 h-4 text-foreground/40 absolute left-3 top-2.5" />
                </div>
                {submissionDeadlineInput && (
                  <button
                    type="button"
                    onClick={() =>
                      setUserEdits((prev) => ({
                        ...prev,
                        submissionDeadlineInput: '',
                      }))
                    }
                    className="px-2.5 py-2 text-xs border border-foreground/15 rounded-lg hover:bg-foreground/5 text-foreground/60 hover:text-red-500 transition-colors flex items-center gap-1"
                    title="Clear deadline"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>
              {hasSubmissionDeadlinePassed && (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  This submission deadline has already passed.
                </p>
              )}
            </div>
          </div>

          {/* ── Voting Section ─────────────────────────────────────────────── */}
          <div className="p-5 rounded-xl border border-foreground/10 bg-foreground/[0.02] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  Public Voting
                </h3>
                <p className="text-xs text-foreground/60">
                  Allow verified users to vote on approved entries
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={votingOpen}
                onClick={() =>
                  setUserEdits((prev) => ({
                    ...prev,
                    votingOpen: !votingOpen,
                  }))
                }
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-saffron focus:ring-offset-2',
                  votingOpen ? 'bg-purple-600' : 'bg-foreground/20'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    votingOpen ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Voting Deadline */}
            <div>
              <label
                htmlFor="votingDeadline"
                className="block text-xs font-medium text-foreground/70 mb-1.5"
              >
                Voting Deadline (Optional)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="votingDeadline"
                    type="datetime-local"
                    value={votingDeadlineInput}
                    onChange={(e) =>
                      setUserEdits((prev) => ({
                        ...prev,
                        votingDeadlineInput: e.target.value,
                      }))
                    }
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-foreground/15 bg-white dark:bg-zinc-800 text-foreground focus:border-saffron focus:ring-1 focus:ring-saffron outline-none transition-all"
                  />
                  <Calendar className="w-4 h-4 text-foreground/40 absolute left-3 top-2.5" />
                </div>
                {votingDeadlineInput && (
                  <button
                    type="button"
                    onClick={() =>
                      setUserEdits((prev) => ({
                        ...prev,
                        votingDeadlineInput: '',
                      }))
                    }
                    className="px-2.5 py-2 text-xs border border-foreground/15 rounded-lg hover:bg-foreground/5 text-foreground/60 hover:text-red-500 transition-colors flex items-center gap-1"
                    title="Clear deadline"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>
              {hasVotingDeadlinePassed && (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  This voting deadline has already passed.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between pt-4 border-t border-foreground/10 flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              All settings are saved in MongoDB and enforced on the server.
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-saffron hover:bg-saffron-light text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
