import type { Category, CompetitionSettings } from '@/lib/types';

export const CATEGORY_SEEDS: Omit<Category, 'createdAt'>[] = [
  {
    id: 'home-decor',
    name: 'Home Decor',
    slug: 'home-decor',
    description:
      'Showcase your beautiful and eco-friendly Ganpati makhar and home decorations.',
    isOpen: true,
  },
  {
    id: 'reel-making',
    name: 'Reel Making',
    slug: 'reel-making',
    description:
      'Capture the festive spirit through creative short videos and reels.',
    isOpen: true,
  },
  {
    id: 'literature',
    name: 'Literature',
    slug: 'literature',
    description:
      'Express your devotion through essays, poems, and stories about Lord Ganesha.',
    isOpen: true,
  },
  {
    id: 'faculty-corner',
    name: 'Faculty Corner',
    slug: 'faculty-corner',
    description:
      'A special category for our esteemed faculty to share their festive joy.',
    isOpen: true,
  },
];

export const DEFAULT_COMPETITION_SETTINGS: CompetitionSettings = {
  submissionsOpen: true,
  votingOpen: true,
  submissionDeadline: null,
  votingDeadline: null,
};

export function isSubmissionsActive(settings: CompetitionSettings | null): boolean {
  if (!settings) return true;
  if (!settings.submissionsOpen) return false;
  if (settings.submissionDeadline) {
    const deadlineTime = new Date(settings.submissionDeadline as string | Date).getTime();
    return deadlineTime > Date.now();
  }
  return true;
}

export function isVotingActive(settings: CompetitionSettings | null): boolean {
  if (!settings) return true;
  if (!settings.votingOpen) return false;
  if (settings.votingDeadline) {
    const deadlineTime = new Date(settings.votingDeadline as string | Date).getTime();
    return deadlineTime > Date.now();
  }
  return true;
}
