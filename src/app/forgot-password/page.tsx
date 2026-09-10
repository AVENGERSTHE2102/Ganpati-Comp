import Link from 'next/link';
import { Mail, ArrowLeft, ShieldCheck, ExternalLink } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[75vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-black/5 dark:border-white/5 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-saffron/10 text-saffron mb-4">
          <Mail className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-burgundy dark:text-foreground">
          Google Account Security
        </h2>

        <p className="mt-2 text-foreground/70 text-xs sm:text-sm leading-relaxed mb-6">
          Marathi Club accounts are authenticated directly and securely through <strong>Google OAuth 2.0</strong>.
        </p>

        <div className="p-4 bg-saffron/5 border border-saffron/20 rounded-xl text-left space-y-2 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <ShieldCheck className="w-4 h-4 text-saffron flex-shrink-0" />
            <span>Need to reset your Google password?</span>
          </div>
          <p className="text-xs text-foreground/70 leading-relaxed">
            Since your account credentials are managed by Google, please use Google’s official account recovery page to reset or recover your password.
          </p>
          <div className="pt-2">
            <a
              href="https://accounts.google.com/signin/recovery"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron hover:underline"
            >
              <span>Visit Google Account Recovery</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 bg-saffron hover:bg-saffron-light text-white py-3 rounded-xl font-medium transition-all shadow-md text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </Link>

          <Link
            href="/"
            className="block text-xs text-foreground/50 hover:text-foreground transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
