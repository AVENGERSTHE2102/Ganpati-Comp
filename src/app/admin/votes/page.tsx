'use client';

import { useEffect, useState } from 'react';
import { CATEGORY_SEEDS } from '@/lib/constants';
import type { Vote, CategorySlug } from '@/lib/types';
import { Loader2 } from 'lucide-react';

function formatDate(ts: string | Date | { toDate?: () => Date } | null): string {
  if (!ts) return '—';
  const date =
    typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof ts.toDate === 'function'
      ? ts.toDate()
      : new Date(ts as string | Date);

  if (isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function categoryName(slug: CategorySlug): string {
  return CATEGORY_SEEDS.find((c) => c.id === slug)?.name ?? slug;
}

export default function AdminVotesPage() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/votes?mode=audit', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load votes audit log');
        const data = await res.json();
        setVotes(data.votes || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
          Votes Audit Log
        </h1>
        <p className="text-xs sm:text-sm text-foreground/60 mt-1">
          {votes.length} vote{votes.length !== 1 ? 's' : ''} cast
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-4 text-xs sm:text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
        </div>
      ) : votes.length === 0 ? (
        <div className="text-center py-20 text-foreground/50 text-sm">
          No votes cast yet. Voting will be enabled when submissions are approved.
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-foreground/10 bg-foreground/[0.02]">
                <tr>
                  {['Voter', 'User ID', 'Submission ID', 'Category', 'Voted At'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {votes.map((vote) => (
                  <tr key={vote.id} className="hover:bg-foreground/3 transition-colors">
                    <td className="px-4 py-3 text-foreground/90 font-medium">
                      {vote.userName || 'Anonymous'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground/70 max-w-[140px] truncate">
                      {vote.userId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground/70 max-w-[140px] truncate">
                      {vote.submissionId}
                    </td>
                    <td className="px-4 py-3 text-foreground/80 font-medium">
                      {categoryName(vote.categoryId)}
                    </td>
                    <td className="px-4 py-3 text-foreground/70 whitespace-nowrap">
                      {formatDate(vote.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-foreground/10">
            {votes.map((vote) => (
              <div key={vote.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-saffron/15 text-saffron">
                    {categoryName(vote.categoryId)}
                  </span>
                  <span className="text-xs text-foreground/50">{formatDate(vote.createdAt)}</span>
                </div>

                <div className="space-y-1 text-xs text-foreground/70 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/40 font-mono">Voter:</span>
                    <span className="font-semibold text-foreground/80 truncate max-w-[200px]">
                      {vote.userName || vote.userId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/40 font-mono">Entry:</span>
                    <span className="font-mono text-foreground/80 truncate max-w-[200px]">
                      {vote.submissionId}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
