import "@/app/styles.css";
import Link from "next/link";
import { Yatra_One, Mukta } from "next/font/google";
import { auth, signOut } from "@/auth";
import config from "@/config/site.config";
import { Toran, LotusDivider, Diya } from "@/app/components/Decor";
import { RevealObserver } from "@/app/components/Client";

const display = Yatra_One({ weight: "400", subsets: ["latin", "devanagari"], variable: "--font-display" });
const body = Mukta({ weight: ["400", "500", "700"], subsets: ["latin", "devanagari"], variable: "--font-body" });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Ganpati Agman 2026 · Marathi Club",
  description: "Vote for your favourite Ganpati decoration, rangoli, poetry & literature, and artistic creations.",
  openGraph: { images: ["/images/hero-ganesha.jpg"] },
};

const links = [
  ["/competitions", "Competitions"],
  ["/vote", "Vote"],
  ["/guidelines", "Guidelines"],
  ["/about", "About"],
];

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function Layout({ children }) {
  const session = await auth();
  const user = session?.user;
  const navLinks = (
    <>
      {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
      {user?.isAdmin && <Link href="/admin">Admin</Link>}
      {user ? (
        <form action={logout} className="nav-signout">
          <button type="submit" className="nav-user" title={`Signed in as ${user.email}`}>
            {user.image ? <img src={user.image} alt="" width={28} height={28} referrerPolicy="no-referrer" /> : null}
            Sign out
          </button>
        </form>
      ) : (
        <Link className="btn btn-sm" href="/signin">Sign in</Link>
      )}
    </>
  );

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="site-header">
          <nav className="nav">
            <Link className="brand" href="/">
              <Diya className="brand-diya" />
              <span>
                <b>Ganpati Agman</b>
                <small>{config.clubName} · 2026</small>
              </span>
            </Link>
            <div className="nav-links">{navLinks}</div>
            <details className="nav-mobile">
              <summary aria-label="Menu">☰</summary>
              <div className="nav-mobile-panel">{navLinks}</div>
            </details>
          </nav>
          <Toran />
        </header>

        {children}

        <footer className="site-footer">
          <LotusDivider />
          <p className="footer-mantra">गणपती बाप्पा मोरया · मंगलमूर्ती मोरया</p>
          <p>{config.competitionName} — celebrated with love by the {config.clubName}.</p>
          <p className="tiny">
            <Link href="/about#credits">Photo credits</Link> · Images from Wikimedia Commons under their respective licenses.
          </p>
        </footer>
        <RevealObserver />
      </body>
    </html>
  );
}
