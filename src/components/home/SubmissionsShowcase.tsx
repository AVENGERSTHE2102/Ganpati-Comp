'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { CATEGORY_SEEDS } from '@/lib/constants';
import type { Submission, CategorySlug } from '@/lib/types';
import { SubmissionCard } from '@/components/gallery/SubmissionCard';
import { useVoting } from '@/hooks/useVoting';
import {
  Sparkles,
  Loader2,
  SearchX,
  ArrowRight,
  PlusCircle,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | CategorySlug;

export function SubmissionsShowcase() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const {
    votedCategories,
    votedSubmissions,
    loadingIds,
    isAnyVoting,
    errors,
    vote,
    ready,
    isVotingOpen,
  } = useVoting();

  const loadSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/submissions?status=approved&sort=newest', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } else {
        throw new Error('Failed to load submissions.');
      }
    } catch (err) {
      console.error('Error fetching submissions showcase:', err);
      setError((err as Error).message || 'Failed to load entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleVote = useCallback(
    async (submissionId: string, catId: CategorySlug) => {
      await vote(submissionId, catId);
      await loadSubmissions();
    },
    [vote, loadSubmissions]
  );

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: submissions.length };
    for (const cat of CATEGORY_SEEDS) {
      counts[cat.id] = 0;
    }
    for (const sub of submissions) {
      if (counts[sub.categoryId] !== undefined) {
        counts[sub.categoryId]++;
      }
    }
    return counts;
  }, [submissions]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    if (activeTab === 'all') return submissions;
    return submissions.filter((s) => s.categoryId === activeTab);
  }, [submissions, activeTab]);

  return (
    <section className="py-14 sm:py-20 bg-background relative border-t border-saffron/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-saffron/10 text-saffron text-xs font-semibold mb-2.5">
              <Flame className="w-3.5 h-3.5 text-saffron" />
              <span>Live Entries &amp; Voting</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-burgundy dark:text-foreground">
              Participant Submissions
            </h2>
            <p className="mt-1.5 text-foreground/70 text-sm sm:text-base max-w-xl">
              Discover wonderful entries from our college community. Vote for your favorite creations!
            </p>
          </div>

          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-saffron to-saffron-dark text-white font-medium text-sm shadow-md hover:shadow-lg transition-all self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Your Entry</span>
          </Link>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 border',
              activeTab === 'all'
                ? 'bg-burgundy text-white border-burgundy shadow-sm'
                : 'bg-white dark:bg-zinc-900 text-foreground/70 border-foreground/10 hover:border-saffron/50'
            )}
          >
            <span>All Submissions</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                activeTab === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-foreground/10 text-foreground/70'
              )}
            >
              {categoryCounts.all ?? 0}
            </span>
          </button>

          {CATEGORY_SEEDS.map((cat) => {
            const isSelected = activeTab === cat.id;
            const count = categoryCounts[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 border',
                  isSelected
                    ? 'bg-saffron text-white border-saffron shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-foreground/70 border-foreground/10 hover:border-saffron/50'
                )}
              >
                <span>{cat.name}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-foreground/10 text-foreground/70'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading || !ready ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-saffron mb-3" />
            <p className="text-foreground/50 text-xs sm:text-sm">Loading participant submissions...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-foreground/[0.02] border border-dashed border-foreground/15 rounded-2xl sm:rounded-3xl text-center">
            <SearchX className="w-12 h-12 text-foreground/25 mb-3" />
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
              No entries in this section yet
            </h3>
            <p className="text-foreground/60 text-xs sm:text-sm max-w-md mb-6">
              {activeTab === 'all'
                ? 'Be the very first participant to showcase your celebration on the portal!'
                : `No one has submitted in ${CATEGORY_SEEDS.find((c) => c.id === activeTab)?.name || 'this category'} yet. Be the first!`}
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-saffron hover:bg-saffron-light text-white font-medium text-sm transition-all shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Now</span>
            </Link>
          </div>
        ) : (
          /* Submissions Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                userHasVotedInCategory={votedCategories.has(sub.categoryId)}
                userVotedSubmissionId={votedSubmissions.get(sub.categoryId)}
                isVoting={loadingIds.has(sub.id)}
                isAnyVoting={isAnyVoting}
                errorMessage={errors.get(sub.id)}
                votingDisabled={!isVotingOpen}
                onVoteClick={handleVote}
              />
            ))}
          </div>
        )}

        {/* Footer Link to Categories */}
        <div className="mt-12 text-center">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-sm font-semibold text-burgundy dark:text-saffron hover:underline underline-offset-4"
          >
            <span>Browse all categories &amp; full galleries</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
