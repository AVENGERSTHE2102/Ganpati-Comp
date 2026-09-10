'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CompetitionSettings } from '@/lib/types';
import {
  DEFAULT_COMPETITION_SETTINGS,
  isSubmissionsActive,
  isVotingActive,
} from '@/lib/constants';

export interface UseCompetitionSettingsReturn {
  settings: CompetitionSettings;
  loading: boolean;
  error: string | null;
  isSubmissionsOpen: boolean;
  isVotingOpen: boolean;
  submissionDeadlineDate: Date | null;
  votingDeadlineDate: Date | null;
  hasSubmissionDeadlinePassed: boolean;
  hasVotingDeadlinePassed: boolean;
  reloadSettings: () => Promise<void>;
}

export function useCompetitionSettings(): UseCompetitionSettingsReturn {
  const [settings, setSettings] = useState<CompetitionSettings>(DEFAULT_COMPETITION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmissionDeadlinePassed, setHasSubmissionDeadlinePassed] = useState(false);
  const [hasVotingDeadlinePassed, setHasVotingDeadlinePassed] = useState(false);

  const applySettings = useCallback((newSettings: CompetitionSettings) => {
    setSettings(newSettings);
    const subDate = newSettings.submissionDeadline
      ? new Date(newSettings.submissionDeadline as string | Date)
      : null;
    const voteDate = newSettings.votingDeadline
      ? new Date(newSettings.votingDeadline as string | Date)
      : null;

    const currentTime = Date.now();
    setHasSubmissionDeadlinePassed(Boolean(subDate && subDate.getTime() <= currentTime));
    setHasVotingDeadlinePassed(Boolean(voteDate && voteDate.getTime() <= currentTime));
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load competition settings');
      const data = await res.json();
      applySettings(data.settings || DEFAULT_COMPETITION_SETTINGS);
      setError(null);
    } catch (err) {
      console.error('Error fetching competition settings:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { settings: DEFAULT_COMPETITION_SETTINGS }))
      .then((data) => {
        if (!isMounted) return;
        applySettings(data.settings || DEFAULT_COMPETITION_SETTINGS);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching competition settings:', err);
        setError((err as Error).message);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [applySettings]);

  const submissionDeadlineDate = settings.submissionDeadline
    ? new Date(settings.submissionDeadline as string | Date)
    : null;

  const votingDeadlineDate = settings.votingDeadline
    ? new Date(settings.votingDeadline as string | Date)
    : null;

  const isSubmissionsOpen = isSubmissionsActive(settings);
  const isVotingOpen = isVotingActive(settings);

  return {
    settings,
    loading,
    error,
    isSubmissionsOpen,
    isVotingOpen,
    submissionDeadlineDate,
    votingDeadlineDate,
    hasSubmissionDeadlinePassed,
    hasVotingDeadlinePassed,
    reloadSettings: fetchSettings,
  };
}
