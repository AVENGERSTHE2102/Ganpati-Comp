'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/admin/StatCard';
import { CompetitionControls } from '@/components/admin/CompetitionControls';
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  ThumbsUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface Stats {
  totalParticipants: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  totalVotes: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load dashboard metrics');
        const data = await res.json();
        setStats(data.stats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-saffron font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Administrator Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-foreground/60 text-xs sm:text-sm mt-1">
            Real-time statistics, entry reviews, and lifecycle controls for Ganpati Agman
          </p>
        </div>

        {/* Direct Action */}
        <Link
          href="/admin/submissions"
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-saffron hover:bg-saffron-light text-white px-4 sm:px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm hover:shadow-md"
        >
          <span>Manage Submissions</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm">
          Failed to load stats: {error}
        </div>
      )}

      {/* ── Dashboard Statistics Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Participants"
          value={stats?.totalParticipants ?? 0}
          icon={Users}
          colorClass="text-blue-500"
          loading={loading}
        />
        <StatCard
          title="Total Submissions"
          value={stats?.totalSubmissions ?? 0}
          icon={FileText}
          colorClass="text-saffron"
          loading={loading}
        />
        <StatCard
          title="Pending Review"
          value={stats?.pendingSubmissions ?? 0}
          icon={Clock}
          colorClass="text-amber-500"
          loading={loading}
        />
        <StatCard
          title="Approved Entries"
          value={stats?.approvedSubmissions ?? 0}
          icon={CheckCircle}
          colorClass="text-green-500"
          loading={loading}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            title="Total Votes"
            value={stats?.totalVotes ?? 0}
            icon={ThumbsUp}
            colorClass="text-purple-500"
            loading={loading}
          />
        </div>
      </div>

      {/* ── Quick Action Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-5">
        <Link
          href="/admin/submissions"
          className="group bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 p-5 hover:border-saffron/40 shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-saffron transition-colors">
                Pending Submissions
              </h3>
              <p className="text-xs text-foreground/50 mt-0.5">
                {stats?.pendingSubmissions ?? 0} entries awaiting review
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground/40 group-hover:text-saffron group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/participants"
          className="group bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 p-5 hover:border-saffron/40 shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-saffron transition-colors">
                Registered Participants
              </h3>
              <p className="text-xs text-foreground/50 mt-0.5">
                {stats?.totalParticipants ?? 0} active users
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground/40 group-hover:text-saffron group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/votes"
          className="group bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 p-5 hover:border-saffron/40 shadow-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-saffron transition-colors">
                Voting Audit Log
              </h3>
              <p className="text-xs text-foreground/50 mt-0.5">
                {stats?.totalVotes ?? 0} votes recorded
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-foreground/40 group-hover:text-saffron group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* ── Competition Controls Section ────────────────────────────────────── */}
      <CompetitionControls />
    </div>
  );
}
