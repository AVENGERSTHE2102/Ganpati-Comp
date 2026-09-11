'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CategorySlug } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCompetitionSettings } from '@/hooks/useCompetitionSettings';

interface UseVotingReturn {
  votedCategories: Set<CategorySlug>;
  votedSubmissions: Map<CategorySlug, string>;
  loadingIds: Set<string>;
  errors: Map<string, string>;
  vote: (submissionId: string, categoryId: CategorySlug) => Promise<void>;
  isAnyVoting: boolean;
  ready: boolean;
  isVotingOpen: boolean;
  votingDeadlineDate: Date | null;
  hasVotingDeadlinePassed: boolean;
}

export function useVoting(): UseVotingReturn {
  const { user } = useAuth();
  const { isVotingOpen, votingDeadlineDate, hasVotingDeadlinePassed } = useCompetitionSettings();

  const [votedCategories, setVotedCategories] = useState<Set<CategorySlug>>(new Set());
  const [votedSubmissions, setVotedSubmissions] = useState<Map<CategorySlug, string>>(
    new Map()
  );
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      // Defer ready state asynchronously
      const timer = setTimeout(() => {
        if (isMounted) {
          setVotedCategories(new Set());
          setVotedSubmissions(new Map());
          setReady(true);
        }
      }, 0);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    fetch('/api/votes?mode=user', { cache: 'no-store' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;
          const cats = new Set<CategorySlug>(data.votedCategories || []);
          const subs = new Map<CategorySlug, string>(
            Object.entries(data.votedSubmissions || {}) as [CategorySlug, string][]
          );
          setVotedCategories(cats);
          setVotedSubmissions(subs);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const vote = useCallback(
    async (submissionId: string, categoryId: CategorySlug) => {
      if (!user) return;

      if (loadingIds.size > 0) return;

      setErrors((prev) => {
        const m = new Map(prev);
        m.delete(submissionId);
        return m;
      });

      if (!isVotingOpen) {
        setErrors((prev) =>
          new Map(prev).set(submissionId, 'Voting is currently closed for this competition.')
        );
        return;
      }

      setLoadingIds((prev) => new Set(prev).add(submissionId));

      try {
        const res = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId, categoryId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to cast vote.');
        }

        // Update state based on server action: revoked vs voted/switched
        if (data.action === 'revoked') {
          setVotedCategories((prev) => {
            const next = new Set(prev);
            next.delete(categoryId);
            return next;
          });
          setVotedSubmissions((prev) => {
            const next = new Map(prev);
            next.delete(categoryId);
            return next;
          });
        } else {
          setVotedCategories((prev) => new Set(prev).add(categoryId));
          setVotedSubmissions((prev) => new Map(prev).set(categoryId, submissionId));
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred. Please try again.';
        setErrors((prev) => new Map(prev).set(submissionId, message));
      } finally {
        setLoadingIds((prev) => {
          const s = new Set(prev);
          s.delete(submissionId);
          return s;
        });
      }
    },
    [user, isVotingOpen, loadingIds.size]
  );

  return {
    votedCategories,
    votedSubmissions,
    loadingIds,
    isAnyVoting: loadingIds.size > 0,
    errors,
    vote,
    ready,
    isVotingOpen,
    votingDeadlineDate,
    hasVotingDeadlinePassed,
  };
}
