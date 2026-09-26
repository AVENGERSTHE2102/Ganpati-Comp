"use client";

import { useRef, useState } from "react";
import Link from "next/link";

function Media({ file, alt, full }) {
  if (!file) return <div className="media-empty">No preview</div>;
  if (file.mime?.startsWith("video/")) return <video src={file.url} controls={full} muted={!full} playsInline preload="metadata" />;
  if (file.mime === "application/pdf") return <a href={file.url} target="_blank" rel="noreferrer">View PDF</a>;
  return <img src={file.url} alt={alt} loading="lazy" />;
}

export default function VoteClient({ submissions, categories, voteCounts, showVoteCounts, pastDeadline, voterEmail, initialVotes, initialCategory }) {
  const [category, setCategory] = useState(initialCategory);
  const [votes, setVotes] = useState(initialVotes);
  const [counts, setCounts] = useState(voteCounts);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState("");
  const dialog = useRef(null);

  const visible = submissions.filter((s) => s.category === category);
  const votedFor = votes[category];

  function show(s) {
    setOpen(s);
    dialog.current?.showModal();
  }

  function pickCategory(key) {
    setCategory(key);
    history.replaceState(null, "", `?c=${key}`);
  }

  async function castVote(s) {
    setBusy(s.id);
    const res = await fetch("/api/vote/cast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId: s.id }) });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    dialog.current?.close();
    if (data.ok) {
      setVotes((v) => ({ ...v, [s.category]: s.id }));
      setCounts((c) => ({ ...c, [s.id]: (c[s.id] || 0) + 1 }));
      setToast(`🙏 Your vote for “${s.title}” is recorded!`);
    } else {
      setToast(data.error || "Something went wrong. Please try again.");
    }
    setTimeout(() => setToast(""), 4000);
  }

  return (
    <div>
      {pastDeadline && <div className="notice">Voting has closed. Thank you to everyone who took part — Ganpati Bappa Morya!</div>}
      {!voterEmail && !pastDeadline && (
        <div className="notice notice-signin">
          <span>Sign in with Google to vote — it takes one tap.</span>
          <Link className="btn btn-sm" href="/signin?callbackUrl=/vote">Continue with Google</Link>
        </div>
      )}

      <div className="tabs" role="tablist">
        {categories.map((c) => (
          <button key={c.key} role="tab" aria-selected={category === c.key} className="tab" onClick={() => pickCategory(c.key)}>
            <span className="deva">{c.marathi}</span>
            <span>{c.label}</span>
            {votes[c.key] && <span className="tab-check" title="You voted here">✓</span>}
          </button>
        ))}
      </div>

      {votedFor && <p className="voted-banner">✓ You&apos;ve voted in this category. Thank you!</p>}

      {!visible.length ? (
        <div className="empty">
          <p className="deva">लवकरच येत आहे</p>
          <p>No entries in this category yet — check back soon!</p>
        </div>
      ) : (
        <div className="gallery">
          {visible.map((s) => (
            <article key={s.id} className={`entry ${votedFor === s.id ? "is-mine" : ""}`}>
              <button className="entry-media" onClick={() => show(s)} aria-label={`View ${s.title}`}>
                <Media file={s.files?.[0]} alt={s.title} />
                {s.files?.length > 1 && <span className="entry-more">+{s.files.length - 1}</span>}
              </button>
              <div className="entry-body">
                <h3>{s.title}</h3>
                <p className="muted">by {s.name}</p>
                <div className="entry-foot">
                  {showVoteCounts && <span className="chip">♥ {counts[s.id] || 0}</span>}
                  {votedFor === s.id ? (
                    <span className="chip chip-gold">Your vote</span>
                  ) : (
                    !voterEmail && !pastDeadline ? (
                      <Link className="btn btn-sm" href={`/signin?callbackUrl=/vote?c=${s.category}`}>Vote</Link>
                    ) : (
                      <button className="btn btn-sm" onClick={() => castVote(s)} disabled={pastDeadline || !!votedFor || !!busy}>
                        {busy === s.id ? "Voting…" : votedFor ? "Voted" : "Vote 🙏"}
                      </button>
                    )
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <dialog ref={dialog} className="lightbox" onClick={(e) => e.target === dialog.current && dialog.current.close()}>
        {open && (
          <div className="lightbox-inner">
            <button className="lightbox-close" onClick={() => dialog.current.close()} aria-label="Close">×</button>
            <div className="lightbox-media">
              {open.files?.map((f, i) => <Media key={i} file={f} alt={open.title} full />)}
            </div>
            <div className="lightbox-body">
              <h2>{open.title}</h2>
              <p className="muted">by {open.name}</p>
              {votedFor === open.id ? (
                <p className="chip chip-gold">✓ You voted for this entry</p>
              ) : votedFor || pastDeadline ? null : !voterEmail ? (
                <Link className="btn" href={`/signin?callbackUrl=/vote?c=${open.category}`}>Sign in to vote</Link>
              ) : (
                <button className="btn btn-lg" disabled={!!busy} onClick={() => castVote(open)}>{busy ? "Voting…" : "Vote for this entry 🙏"}</button>
              )}
              <p className="tiny muted">One vote per category — it can&apos;t be changed later.</p>
            </div>
          </div>
        )}
      </dialog>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
