'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CATEGORY_SEEDS } from '@/lib/constants';
import type { Submission, CategorySlug } from '@/lib/types';
import { SubmissionCard } from '@/components/gallery/SubmissionCard';
import { SubmissionDetailModal } from '@/components/gallery/SubmissionDetailModal';
import { CategoryCard } from '@/components/gallery/CategoryCard';
import { useVoting } from '@/hooks/useVoting';
import { Loader2, ArrowLeft, SearchX, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const ALL_SLUGS = CATEGORY_SEEDS.map((c) => c.id) as CategorySlug[];

export default function CategoryPage() {
  const params = useParams<{ categoryId: string }>();
  const router = useRouter();
  const categoryId = params.categoryId as CategorySlug;
  const cat = CATEGORY_SEEDS.find((c) => c.id === categoryId);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('newest');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const {
    votedCategories,
    votedSubmissions,
    loadingIds,
    isAnyVoting,
    errors,
    vote,
    ready,
    isVotingOpen,
    votingDeadlineDate,
    hasVotingDeadlinePassed,
  } = useVoting();

  // Redirect unknown slugs
  useEffect(() => {
    if (!ALL_SLUGS.includes(categoryId)) router.replace('/categories');
  }, [categoryId, router]);

  const reloadSubmissions = useCallback(async () => {
    if (!cat) return;
    try {
      const res = await fetch(
        `/api/submissions?categoryId=${categoryId}&status=approved&sort=${sortBy}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch {
      // ignore
    }
  }, [cat, categoryId, sortBy]);

  useEffect(() => {
    if (!cat) return;
    let isMounted = true;

    fetch(
      `/api/submissions?categoryId=${categoryId}&status=approved&sort=${sortBy}`,
      { cache: 'no-store' }
    )
      .then((res) => (res.ok ? res.json() : { submissions: [] }))
      .then((data) => {
        if (!isMounted) return;
        setSubmissions(data.submissions || []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching submissions:', err);
        setError((err as Error).message);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cat, categoryId, sortBy]);

  // Vote handler
  const handleVote = useCallback(
    async (submissionId: string, catId: CategorySlug) => {
      await vote(submissionId, catId);
      await reloadSubmissions();
    },
    [vote, reloadSubmissions]
  );

  const sorted = [...submissions].sort((a, b) => {
    if (sortBy === 'votes') {
      return (b.voteCount || 0) - (a.voteCount || 0);
    }
    const aTime = new Date(a.createdAt as string | Date).getTime() || 0;
    const bTime = new Date(b.createdAt as string | Date).getTime() || 0;
    return bTime - aTime;
  });

  if (!cat) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back */}
      <Link
        href="/categories"
        className="inline-flex items-center gap-2 text-xs sm:text-sm text-foreground/60 hover:text-saffron transition-colors mb-6 sm:mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> All Categories
      </Link>

      {/* Header */}
      <div className="mb-6 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-burgundy dark:text-foreground mb-2 sm:mb-3">
          {cat.name}
        </h1>
        <p className="text-foreground/60 text-sm sm:text-base md:text-lg max-w-2xl">
          {cat.description}
        </p>
      </div>

      {/* Category quick-nav */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-1 scrollbar-none mb-6 sm:mb-8">
        {CATEGORY_SEEDS.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.id}`}
            className={cn(
              'px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
              c.id === categoryId
                ? 'bg-burgundy text-white'
                : 'bg-white dark:bg-zinc-900 border border-foreground/20 hover:bg-foreground/5 text-foreground/70'
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Competition Voting Status Notice */}
      {!loading && !isVotingOpen && (
        <div className="mb-6 p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-semibold">Voting is currently closed.</span>
            <span className="ml-1 text-foreground/70">
              {hasVotingDeadlinePassed && votingDeadlineDate
                ? `The voting deadline ended on ${votingDeadlineDate.toLocaleDateString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}.`
                : 'The organizers have closed voting for this competition. You can still view all submissions.'}
            </span>
          </div>
        </div>
      )}

      {!loading && isVotingOpen && votingDeadlineDate && (
        <div className="mb-6 p-4 rounded-xl bg-saffron/10 border border-saffron/20 text-foreground flex items-center gap-3 text-sm">
          <Clock className="w-5 h-5 flex-shrink-0 text-saffron" />
          <div>
            <span className="font-semibold">Voting is live!</span>
            <span className="ml-1 text-foreground/70">
              Cast your vote before{' '}
              {votingDeadlineDate.toLocaleDateString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              . Each verified participant gets 1 vote in this category.
            </span>
          </div>
        </div>
      )}

      {/* Sort / count bar */}
      {!loading && !error && (
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-foreground/60 text-sm">
            {submissions.length} approved submission{submissions.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground/50">Sort by:</span>
            {(['newest', 'votes'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={cn(
                  'px-3 py-1 rounded-lg text-sm font-medium transition-all capitalize',
                  sortBy === s
                    ? 'bg-saffron text-white'
                    : 'text-foreground/60 hover:bg-foreground/8'
                )}
              >
                {s === 'votes' ? 'Most Votes' : 'Newest'}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-4 text-sm mb-6">
          Failed to load submissions: {error}
        </div>
      )}

      {/* Content */}
      {loading || !ready ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <SearchX className="w-12 h-12 text-foreground/20 mb-4" />
          <h3 className="text-xl font-bold mb-2">No entries yet</h3>
          <p className="text-foreground/50 max-w-sm">
            There are no approved submissions in this category yet. Be the first to participate!
          </p>
          <Link
            href="/submit"
            className="mt-6 bg-saffron hover:bg-saffron-light text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-md"
          >
            Submit Your Entry
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              userHasVotedInCategory={votedCategories.has(categoryId)}
              userVotedSubmissionId={votedSubmissions.get(categoryId)}
              isVoting={loadingIds.has(sub.id)}
              isAnyVoting={isAnyVoting}
              errorMessage={errors.get(sub.id)}
              votingDisabled={!isVotingOpen}
              onVoteClick={handleVote}
              onCardClick={(clicked) => setSelectedSubmission(clicked)}
              onEditClick={(clicked) => setSelectedSubmission(clicked)}
            />
          ))}
        </div>
      )}

      {/* Full Preview & Submitter Edit Modal */}
      <SubmissionDetailModal
        submission={selectedSubmission}
        isOpen={Boolean(selectedSubmission)}
        onClose={() => setSelectedSubmission(null)}
        userHasVotedInCategory={votedCategories.has(categoryId)}
        userVotedSubmissionId={votedSubmissions.get(categoryId)}
        isVoting={selectedSubmission ? loadingIds.has(selectedSubmission.id) : false}
        isAnyVoting={isAnyVoting}
        votingDisabled={!isVotingOpen}
        onVoteClick={async (id, cat) => {
          await handleVote(id, cat);
          // Sync modal vote count
          const res = await fetch(`/api/submissions/${id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.submission) setSelectedSubmission(data.submission);
          }
        }}
        onSubmissionUpdated={(updated) => {
          setSelectedSubmission(updated);
          reloadSubmissions();
        }}
      />

      {/* Other categories */}
      {!loading && sorted.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-serif font-bold mb-6">Explore Other Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORY_SEEDS.filter((c) => c.id !== categoryId).map((c) => (
              <CategoryCard key={c.id} slug={c.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
