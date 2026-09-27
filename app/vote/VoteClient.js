"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function isVideoFile(file) {
  if (!file) return false;
  return file.mime?.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(file.url || file.originalName || "");
}

function isPdfFile(file) {
  if (!file) return false;
  return file.mime === "application/pdf" || /\.pdf$/i.test(file.url || file.originalName || "");
}

function ReelCardMedia({ file, alt }) {
  const videoRef = useRef(null);
  if (!file) {
    return (
      <div className="pdf-thumb-card">
        <span className="pdf-icon">🕉️</span>
        <span className="pdf-title">{alt}</span>
      </div>
    );
  }
  const isVideo = isVideoFile(file);
  const isPdf = isPdfFile(file);

  if (isVideo) {
    return (
      <div
        className="reel-thumb-container"
        onMouseEnter={() => videoRef.current?.play().catch(() => {})}
        onMouseLeave={() => {
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
        }}
      >
        <video
          ref={videoRef}
          src={file.url}
          poster={file.posterUrl || undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className="reel-video-element"
        />
        <div className="reel-play-overlay">
          <span className="reel-play-icon">▶</span>
        </div>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="pdf-thumb-card">
        <span className="pdf-icon">📄</span>
        <span className="pdf-title">{file.originalName || "Document / Literature (PDF)"}</span>
      </div>
    );
  }

  return <img src={file.url} alt={alt} loading="lazy" />;
}

function FullMediaItem({ file, alt }) {
  if (!file) return <div className="media-empty">No preview</div>;
  const isVideo = isVideoFile(file);
  const isPdf = isPdfFile(file);

  if (isVideo) {
    return (
      <div className="lightbox-video-wrapper">
        <video src={file.url} controls autoPlay playsInline loop preload="auto" />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="pdf-preview-box">
        <span style={{ fontSize: 48 }}>📄</span>
        <h3>{file.originalName || "Literature Submission (PDF)"}</h3>
        <a className="btn btn-gold" href={file.url} target="_blank" rel="noreferrer">Open PDF in new tab ↗</a>
      </div>
    );
  }

  return <img src={file.url} alt={alt} loading="lazy" />;
}

export default function VoteClient({ submissions, categories, voteCounts, showVoteCounts, pastDeadline, voterEmail, initialVotes, initialCategory }) {
  const [category, setCategory] = useState(initialCategory);
  const [mediaFilter, setMediaFilter] = useState("all");
  const [votes, setVotes] = useState(initialVotes);
  const [counts, setCounts] = useState(voteCounts);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(null);
  const [toast, setToast] = useState("");
  const dialog = useRef(null);

  const visible = submissions.filter((s) => s.category === category);
  const hasReels = visible.some((s) => isVideoFile(s.files?.[0]));
  const hasPhotos = visible.some((s) => !isVideoFile(s.files?.[0]));

  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const c = params.get("c");
      if (c && categories.some((x) => x.key === c)) {
        setCategory(c);
      }
    }
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [categories]);

  const filtered = visible.filter((s) => {
    if (mediaFilter === "all") return true;
    const isReel = isVideoFile(s.files?.[0]);
    if (mediaFilter === "reel") return isReel;
    if (mediaFilter === "photo") return !isReel;
    return true;
  });

  const votedFor = votes[category];

  function show(s) {
    setOpen(s);
    dialog.current?.showModal();
  }

  function closeDialog() {
    if (dialog.current) {
      dialog.current.querySelectorAll("video").forEach((v) => {
        v.pause();
      });
      dialog.current.close();
    }
    setOpen(null);
  }

  function pickCategory(key) {
    setCategory(key);
    setMediaFilter("all");
    history.replaceState(null, "", `?c=${key}`);
  }

  async function castVote(s) {
    setBusy(s.id);
    const res = await fetch("/api/vote/cast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId: s.id }) });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    closeDialog();
    if (data.ok) {
      setVotes((v) => ({ ...v, [s.category]: s.id }));
      setCounts((c) => ({ ...c, [s.id]: (c[s.id] || 0) + 1 }));
      setToast(`🙏 Your vote for “${s.title}” is recorded!`);
    } else {
      setToast(data.error || "Something went wrong. Please try again.");
    }
    setTimeout(() => setToast(""), 4000);
  }

  const isOpenReel = open && isVideoFile(open.files?.[0]);

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

      {hasReels && hasPhotos && (
        <div className="media-filter-bar">
          <button
            className={`media-filter-btn ${mediaFilter === "all" ? "is-active" : ""}`}
            onClick={() => setMediaFilter("all")}
          >
            All ({visible.length})
          </button>
          <button
            className={`media-filter-btn ${mediaFilter === "photo" ? "is-active" : ""}`}
            onClick={() => setMediaFilter("photo")}
          >
            📸 Photos ({visible.filter((s) => !isVideoFile(s.files?.[0])).length})
          </button>
          <button
            className={`media-filter-btn ${mediaFilter === "reel" ? "is-active" : ""}`}
            onClick={() => setMediaFilter("reel")}
          >
            🎬 Reels ({visible.filter((s) => isVideoFile(s.files?.[0])).length})
          </button>
        </div>
      )}

      {votedFor && <p className="voted-banner">✓ You&apos;ve voted in this category. Thank you!</p>}

      {!filtered.length ? (
        <div className="empty">
          <p className="deva">लवकरच येत आहे</p>
          <p>
            {visible.length
              ? `No ${mediaFilter === "reel" ? "reels" : "photos"} in this category yet.`
              : "No entries in this category yet — check back soon!"}
          </p>
        </div>
      ) : (
        <div className="gallery">
          {filtered.map((s) => {
            const isReel = isVideoFile(s.files?.[0]);
            return (
              <article key={s.id} className={`entry ${votedFor === s.id ? "is-mine" : ""}`}>
                <button className="entry-media" onClick={() => show(s)} aria-label={`View ${s.title}`}>
                  <ReelCardMedia file={s.files?.[0]} alt={s.title} />
                  {isReel && (
                    <span className="entry-badge-reel">
                      <span className="reel-badge-dot">●</span> Reel
                    </span>
                  )}
                  {s.files?.length > 1 && <span className="entry-more">+{s.files.length - 1}</span>}
                </button>
                <div className="entry-body">
                  <h3>{s.title}</h3>
                  <p className="muted">by <strong>{s.name}</strong>{s.department ? ` · ${s.department}` : ""}</p>
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
            );
          })}
        </div>
      )}

      <dialog
        ref={dialog}
        className={`lightbox ${isOpenReel ? "lightbox-reel-mode" : ""}`}
        onClick={(e) => e.target === dialog.current && closeDialog()}
        onClose={() => {
          if (dialog.current) dialog.current.querySelectorAll("video").forEach((v) => v.pause());
          setOpen(null);
        }}
      >
        {open && (
          <div className="lightbox-inner">
            <button className="lightbox-close" onClick={closeDialog} aria-label="Close">×</button>
            <div className="lightbox-media">
              {open.files && open.files.length > 0 ? (
                open.files.map((f, i) => <FullMediaItem key={i} file={f} alt={open.title} />)
              ) : (
                <div className="pdf-preview-box">
                  <span style={{ fontSize: 48 }}>🕉️</span>
                  <h3>{open.title}</h3>
                </div>
              )}
            </div>
            <div className="lightbox-body">
              <h2>{open.title}</h2>
              <p className="muted">by <strong>{open.name}</strong> {open.department ? `(${open.year ? open.year + " " : ""}${open.department})` : ""}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 14px" }}>
                {isOpenReel && <span className="chip chip-reel">🎬 Video Reel</span>}
                {open.submissionCode && <span className="chip">{open.submissionCode}</span>}
              </div>
              {open.description && (
                <div className="lightbox-desc">
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{open.description}</p>
                </div>
              )}
              {open.specialNote && (
                <p className="tiny muted" style={{ fontStyle: "italic", marginBottom: 14 }}>
                  &ldquo;{open.specialNote}&rdquo;
                </p>
              )}
              {votedFor === open.id ? (
                <p className="chip chip-gold">✓ You voted for this entry</p>
              ) : votedFor || pastDeadline ? null : !voterEmail ? (
                <Link className="btn" href={`/signin?callbackUrl=/vote?c=${open.category}`}>Sign in to vote</Link>
              ) : (
                <button className="btn btn-lg" disabled={!!busy} onClick={() => castVote(open)}>{busy ? "Voting…" : "Vote for this entry 🙏"}</button>
              )}
              <p className="tiny muted" style={{ marginTop: 10 }}>One vote per category — it can&apos;t be changed later.</p>
            </div>
          </div>
        )}
      </dialog>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
