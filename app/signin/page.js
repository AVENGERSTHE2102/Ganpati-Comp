import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Mandala } from "@/app/components/Decor";

function safeCallback(url) {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : "/vote";
}

export default async function SignInPage({ searchParams }) {
  const { callbackUrl, error } = await searchParams;
  const target = safeCallback(callbackUrl);
  if ((await auth())?.user) redirect(target);

  async function google() {
    "use server";
    await signIn("google", { redirectTo: target });
  }

  return (
    <main className="signin">
      <div className="signin-card reveal-in">
        <div className="signin-art">
          <Mandala className="signin-mandala" />
          <Image src="/images/hero-ganesha.jpg" alt="Dagadusheth Halwai Ganpati" width={220} height={293} priority />
        </div>
        <p className="eyebrow">श्री गणेशाय नमः</p>
        <h1>Welcome, bhakta</h1>
        <p className="muted">Sign in with your Google account to cast your votes. One vote per category.</p>
        {error && (
          <p className="notice" role="alert">
            {error === "AccessDenied" ? "That Google account isn't allowed to sign in." : "Sign-in didn't complete. Please try again."}
          </p>
        )}
        <form action={google}>
          <button className="btn btn-google" type="submit">
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Continue with Google
          </button>
        </form>
        <p className="tiny muted">We only use your email to make sure each person votes once.</p>
      </div>
    </main>
  );
}
