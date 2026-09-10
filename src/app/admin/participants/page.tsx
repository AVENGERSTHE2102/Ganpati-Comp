'use client';

import { useEffect, useState } from 'react';
import type { AppUser } from '@/lib/types';
import { Loader2, UserCircle } from 'lucide-react';

function formatDate(ts: string | Date | { toDate?: () => Date } | null): string {
  if (!ts) return '—';
  const date =
    typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof ts.toDate === 'function'
      ? ts.toDate()
      : new Date(ts as string | Date);

  if (isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminParticipantsPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/participants', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load participants');
        const data = await res.json();
        setUsers(data.users || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Participants</h1>
        <p className="text-xs sm:text-sm text-foreground/60 mt-1">
          {users.length} registered user{users.length !== 1 ? 's' : ''}
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
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-foreground/50 text-sm">No participants yet.</div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-foreground/10 bg-foreground/[0.02]">
                <tr>
                  {['User', 'Email', 'Role', 'Verified', 'Joined'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-foreground/3 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-saffron/20 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-saffron/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserCircle className="w-5 h-5 text-saffron" />
                          </div>
                        )}
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          user.role === 'admin'
                            ? 'bg-burgundy/10 text-burgundy dark:text-saffron'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium ${
                          user.emailVerified ? 'text-green-600' : 'text-amber-500'
                        }`}
                      >
                        {user.emailVerified ? '✓ Verified' : '✗ Unverified'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground/70">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-foreground/10">
            {users.map((user) => (
              <div key={user.uid} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-saffron/20 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-saffron/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCircle className="w-5 h-5 text-saffron" />
                      </div>
                    )}
                    <span className="font-semibold text-sm text-foreground truncate">
                      {user.name}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize flex-shrink-0 ${
                      user.role === 'admin'
                        ? 'bg-burgundy/10 text-burgundy dark:text-saffron'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <p className="text-xs text-foreground/70 truncate">{user.email}</p>

                <div className="flex items-center justify-between text-xs pt-1 text-foreground/50">
                  <span
                    className={`font-medium ${
                      user.emailVerified ? 'text-green-600' : 'text-amber-500'
                    }`}
                  >
                    {user.emailVerified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
