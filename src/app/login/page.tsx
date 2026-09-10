'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, AlertCircle, Sparkles } from 'lucide-react';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const returnUrl = searchParams.get('returnUrl') || '/';

  return (
    <div className="flex items-center justify-center min-h-[75vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-black/5 dark:border-white/5">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-saffron/10 text-saffron mb-3">
            <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-burgundy dark:text-foreground">
            Welcome to Ganpati Agman
          </h2>
          <p className="mt-1.5 sm:mt-2 text-foreground/70 text-xs sm:text-sm">
            Sign in with your Google account to participate and vote
          </p>
        </div>

        {errorParam && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorParam}</p>
          </div>
        )}

        {/* ── Google Sign-In Primary Action ── */}
        <div className="space-y-4">
          <a
            id="google-sign-in-btn"
            href={`/api/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border-2 border-foreground/10 hover:border-saffron/50 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-foreground font-semibold text-sm sm:text-base transition-all shadow-sm hover:shadow-md cursor-pointer text-center"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </a>

          <div className="p-4 rounded-xl bg-saffron/5 border border-saffron/20 text-xs text-foreground/70 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-saffron mt-0.5 flex-shrink-0" />
            <p>
              Use your college or personal Google account. Authenticated accounts receive verified status for voting eligibility instantly.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-foreground/10 text-center space-y-2">
          <p className="text-xs text-foreground/60">
            Organized by Marathi Club DBIT
          </p>
          <Link
            href="/categories"
            className="inline-block text-xs font-medium text-saffron hover:underline"
          >
            ← Explore Categories Without Signing In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[70vh]">
          <Loader2 className="w-8 h-8 animate-spin text-saffron" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
