import Link from "next/link";
import Image from "next/image";
import config from "@/config/site.config";
import { database } from "@/lib/mongodb";
import { Mandala, Petals, LotusDivider, Diya } from "@/app/components/Decor";
import { Countdown } from "@/app/components/Client";

export const dynamic = "force-dynamic";

import staticSubmissions from "@/data/submissions.json";

export default async function Home() {
  const db = await database().catch(() => null);
  const [counts, recent, voteTotal] = db
    ? await Promise.all([
        db.collection("submissions").aggregate([{ $match: { status: "approved" } }, { $group: { _id: "$category", n: { $sum: 1 } } }]).toArray().catch(() => []),
        db.collection("submissions").find({ status: "approved" }).sort({ createdAt: -1 }).limit(8).toArray().catch(() => []),
        db.collection("votes").countDocuments().catch(() => 0),
      ])
    : [[], [], 0];

  const staticCounts = staticSubmissions.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});

  const countByCategory = counts.length > 0 ? Object.fromEntries(counts.map((c) => [c._id, c.n])) : staticCounts;
  const totalEntries = counts.reduce((s, c) => s + c.n, 0) || staticSubmissions.length;
  const recentItems = recent.length > 0 ? recent : staticSubmissions.slice(0, 8);
  const votingOpen = Date.now() < new Date(config.votingDeadline).getTime();

  return (
    <main className="home">
      <section className="hero">
        <Petals />
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow gold">॥ श्री गणेशाय नमः ॥</p>
            <h1 className="hero-title">
              <span className="deva">गणपती बाप्पा</span>
              <span className="deva accent">मोरया!</span>
            </h1>
            <p className="hero-sub">
              Welcome to <b>{config.competitionName}</b> — the {config.clubName}&apos;s celebration of Ganeshotsav. Admire the
              home decorations, reels &amp; videography, poetry &amp; literature, and artistic creations from our community, and vote for your favourites.
            </p>
            <div className="hero-ctas">
              <Link className="btn btn-lg" href="/vote">{votingOpen ? "Cast your vote" : "See the entries"}</Link>
              <Link className="btn btn-ghost btn-lg" href="/competitions">Explore categories</Link>
            </div>
            <dl className="hero-stats">
              <div><dt>Entries</dt><dd>{totalEntries}</dd></div>
              <div><dt>Votes cast</dt><dd>{voteTotal}</dd></div>
              <div><dt>Categories</dt><dd>{config.categories.length}</dd></div>
            </dl>
          </div>
          <div className="hero-art">
            <Mandala className="hero-mandala" />
            <div className="hero-halo" />
            <div className="hero-frame">
              <Image src="/images/hero-ganesha.jpg" alt="Shreemant Dagadusheth Halwai Ganpati, Pune" fill priority sizes="(max-width: 900px) 80vw, 420px" />
            </div>
            <Diya className="hero-diya left" />
            <Diya className="hero-diya right" />
          </div>
        </div>
      </section>

      <section className="band band-maroon countdown-band">
        <div className="container center">
          <p className="eyebrow gold">{votingOpen ? "Voting closes in" : "Voting"}</p>
          <Countdown to={config.votingDeadline} />
        </div>
      </section>

      <section className="container section">
        <header className="section-head reveal">
          <p className="eyebrow">स्पर्धा · Categories</p>
          <h2>Four ways to celebrate Bappa</h2>
          <LotusDivider />
        </header>
        <div className="cat-grid">
          {config.categories.map((c, i) => (
            <Link key={c.key} href={`/vote?c=${c.key}`} className="cat-card reveal" style={{ "--i": i }}>
              <Image src={c.image} alt="" fill sizes="(max-width: 700px) 100vw, 25vw" />
              <div className="cat-card-body">
                <span className="deva cat-mr">{c.marathi}</span>
                <h3>{c.label}</h3>
                <p>{c.description}</p>
                <span className="chip">{countByCategory[c.key] || 0} {countByCategory[c.key] === 1 ? "entry" : "entries"} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="band band-cream">
        <div className="container section">
          <header className="section-head reveal">
            <p className="eyebrow">How to vote</p>
            <h2>Three simple steps</h2>
          </header>
          <ol className="steps">
            {[
              ["Sign in with Google", "One tap — no forms, no passwords."],
              ["Pick your favourite", "Browse each category and choose the entry that moves you."],
              ["Vote once per category", "Your vote is locked in. Come back to vote in the other categories!"],
            ].map(([t, d], i) => (
              <li key={t} className="step reveal" style={{ "--i": i }}>
                <span className="step-num">{i + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {recentItems.length > 0 && (
        <section className="container section">
          <header className="section-head reveal">
            <p className="eyebrow">Latest darshan</p>
            <h2>Fresh from the community</h2>
          </header>
          <div className="strip">
            {recentItems.map((s) => {
              const file = s.files?.find((f) => f.mime?.startsWith("image/")) || s.files?.[0];
              if (!file) return null;
              const isVideo = file.mime?.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(file.url || "");
              const itemId = s.id || (s._id ? s._id.toString() : Math.random().toString());
              return (
                <Link key={itemId} href={`/vote?c=${s.category}`} className="strip-item reveal">
                  {isVideo ? (
                    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
                      <video src={file.url} poster={file.posterUrl || undefined} muted playsInline preload="metadata" />
                      <span className="strip-reel-badge">▶ Reel</span>
                    </div>
                  ) : (
                    <img src={file.url} alt={s.title} loading="lazy" />
                  )}
                  <span>{isVideo ? `🎬 ${s.title}` : s.title}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="band band-maroon final-cta">
        <Mandala className="final-mandala" />
        <div className="container center reveal">
          <h2 className="deva">सुखकर्ता दुःखहर्ता</h2>
          <p>Every vote is a little offering of appreciation. Show some love to the artists of our community.</p>
          <Link className="btn btn-lg btn-gold" href="/vote">Go to voting</Link>
        </div>
      </section>
    </main>
  );
}
