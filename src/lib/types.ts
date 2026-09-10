// ─── Timestamps ─────────────────────────────────────────────────────────────

export type DBTimestamp =
  | string
  | Date
  | { toDate?: () => Date; toMillis?: () => number };

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'participant' | 'admin';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: DBTimestamp;
  emailVerified: boolean;
  image?: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export type CategorySlug =
  | 'home-decor'
  | 'reel-making'
  | 'literature'
  | 'faculty-corner';

export interface Category {
  id: CategorySlug;
  name: string;
  slug: CategorySlug;
  description: string;
  isOpen: boolean;
  createdAt: DBTimestamp;
}

// ─── Submission ──────────────────────────────────────────────────────────────

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export type FileType = 'image' | 'video' | 'pdf' | 'other';

export interface Submission {
  id: string;
  participantId: string;
  participantName: string;
  categoryId: CategorySlug;
  title: string;
  description: string;
  fileUrl: string;
  fileType: FileType;
  status: SubmissionStatus;
  voteCount: number;
  createdAt: DBTimestamp;
  approvedAt: DBTimestamp | null;
}

// ─── Vote ─────────────────────────────────────────────────────────────────────

export interface Vote {
  id: string;
  userId: string;
  userName?: string;
  submissionId: string;
  categoryId: CategorySlug;
  createdAt: DBTimestamp;
}

// ─── Competition Settings ─────────────────────────────────────────────────────

export interface CompetitionSettings {
  submissionsOpen: boolean;
  votingOpen: boolean;
  submissionDeadline: DBTimestamp | null;
  votingDeadline: DBTimestamp | null;
  updatedAt?: DBTimestamp;
  updatedBy?: string;
}
